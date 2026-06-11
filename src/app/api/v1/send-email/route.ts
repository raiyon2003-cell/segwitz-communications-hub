import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { replaceVariables } from "@/lib/services/variable-parser";
import { sendEmailViaBrevo } from "@/lib/services/brevo";
import { createAuditLog } from "@/lib/services/audit";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const sendEmailSchema = z.object({
  apiKey: z.string().min(1),
  templateId: z.string().min(1),
  to: z.string().email(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  variables: z.record(z.string(), z.string()).optional(),
  contactId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`api-send-${ip}`, 30, 60000);

  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const data = sendEmailSchema.parse(body);

    const expectedKey = process.env.SCH_API_KEY;
    if (!expectedKey || data.apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: data.templateId },
      include: { department: true },
    });

    if (!template || template.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Template not found or not approved" },
        { status: 404 }
      );
    }

    const variables = data.variables || {};
    const subject = replaceVariables(template.subject, variables);
    const bodyContent =
      template.templateType === "HTML" && template.htmlContent
        ? replaceVariables(template.htmlContent, variables)
        : replaceVariables(template.body, variables);

    const htmlContent =
      template.templateType === "HTML"
        ? bodyContent
        : `<div style="font-family: Arial, sans-serif;">${bodyContent.replace(/\n/g, "<br>")}</div>`;

    const sentEmail = await prisma.sentEmail.create({
      data: {
        recipient: data.to,
        cc: data.cc?.join(",") || null,
        bcc: data.bcc?.join(",") || null,
        subject,
        body: bodyContent,
        templateId: template.id,
        contactId: data.contactId || null,
        departmentId: template.departmentId,
        sentById: (
          await prisma.user.findFirst({ where: { role: "ADMIN" } })
        )?.id!,
        status: "PENDING",
      },
    });

    try {
      const { messageId } = await sendEmailViaBrevo({
        to: [data.to],
        cc: data.cc,
        bcc: data.bcc,
        subject,
        htmlContent,
        textContent: bodyContent.replace(/<[^>]+>/g, ""),
      });

      await prisma.sentEmail.update({
        where: { id: sentEmail.id },
        data: { status: "SENT", brevoMessageId: messageId },
      });

      if (data.contactId) {
        await prisma.communicationTimeline.create({
          data: {
            contactId: data.contactId,
            sentEmailId: sentEmail.id,
            templateId: template.id,
            title: template.name,
            description: subject,
            occurredAt: new Date(),
          },
        });
      }

      await createAuditLog({
        action: "API_SEND",
        entityType: "sent_email",
        entityId: sentEmail.id,
        details: `API sent email to ${data.to}`,
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        messageId,
        sentEmailId: sentEmail.id,
      });
    } catch (sendError) {
      const errorMessage =
        sendError instanceof Error ? sendError.message : "Send failed";
      await prisma.sentEmail.update({
        where: { id: sentEmail.id },
        data: { status: "FAILED", errorMessage },
      });
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
