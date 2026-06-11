"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { composeEmailSchema } from "@/lib/validators";
import { replaceVariables } from "@/lib/services/variable-parser";
import { sendEmailViaBrevo } from "@/lib/services/brevo";
import { createAuditLog } from "@/lib/services/audit";
import {
  uploadFile,
  STORAGE_BUCKETS,
  ALLOWED_ATTACHMENT_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/services/storage";
import { actionError, actionSuccess } from "@/lib/action-results";
import type { EmailStatus } from "@prisma/client";

export async function sendEmail(formData: FormData) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "emails.send")) {
      throw new Error("Forbidden");
    }

    const variablesRaw = formData.get("variables") as string;
    const variables = variablesRaw ? JSON.parse(variablesRaw) : {};

    const input = composeEmailSchema.parse({
      templateId: formData.get("templateId"),
      contactId: formData.get("contactId") || undefined,
      to: formData.get("to"),
      cc: formData.get("cc") || undefined,
      bcc: formData.get("bcc") || undefined,
      subject: formData.get("subject"),
      body: formData.get("body"),
      variables,
    });

    const template = await prisma.emailTemplate.findUnique({
      where: { id: input.templateId },
      include: { department: true },
    });

    if (!template || template.status !== "APPROVED") {
      throw new Error("Only approved templates can be used");
    }

    const subject = replaceVariables(input.subject, variables);
    const bodyContent =
      template.templateType === "HTML" && template.htmlContent
        ? replaceVariables(template.htmlContent, variables)
        : replaceVariables(input.body, variables);

    const htmlContent =
      template.templateType === "HTML"
        ? bodyContent
        : `<div style="font-family: Arial, sans-serif;">${bodyContent.replace(/\n/g, "<br>")}</div>`;

    const sentEmail = await prisma.sentEmail.create({
      data: {
        recipient: input.to,
        cc: input.cc || null,
        bcc: input.bcc || null,
        subject,
        body: bodyContent,
        templateId: input.templateId,
        contactId: input.contactId || null,
        departmentId: template.departmentId,
        sentById: session.dbUser.id,
        status: "PENDING",
      },
    });

    const attachmentFiles = (formData.getAll("attachments") as File[]).filter(
      (file) => file && file.size > 0
    );

    for (const file of attachmentFiles) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${file.name} exceeds 10MB limit`);
      }
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        throw new Error(`File type not allowed: ${file.name}`);
      }
    }

    const uploadedAttachments = await Promise.all(
      attachmentFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const path = `${sentEmail.id}/${Date.now()}-${file.name}`;
        const fileUrl = await uploadFile(
          STORAGE_BUCKETS.ATTACHMENTS,
          path,
          buffer,
          file.type
        );

        return {
          db: {
            sentEmailId: sentEmail.id,
            fileName: file.name,
            fileUrl,
            fileSize: file.size,
            mimeType: file.type,
          },
          brevo: {
            name: file.name,
            content: buffer.toString("base64"),
            type: file.type,
          },
        };
      })
    );

    if (uploadedAttachments.length > 0) {
      await prisma.emailAttachment.createMany({
        data: uploadedAttachments.map((a) => a.db),
      });
    }

    const attachments = uploadedAttachments.map((a) => a.brevo);

    try {
      const ccList = input.cc
        ? input.cc.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined;
      const bccList = input.bcc
        ? input.bcc.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined;

      const { messageId } = await sendEmailViaBrevo({
        to: [input.to],
        cc: ccList,
        bcc: bccList,
        subject,
        htmlContent,
        textContent: bodyContent.replace(/<[^>]+>/g, ""),
        attachments,
      });

      await prisma.sentEmail.update({
        where: { id: sentEmail.id },
        data: { status: "SENT", brevoMessageId: messageId },
      });

      await prisma.emailLog.create({
        data: {
          sentEmailId: sentEmail.id,
          event: "SENT",
          details: `Brevo message ID: ${messageId}`,
        },
      });

      if (input.contactId) {
        await prisma.communicationTimeline.create({
          data: {
            contactId: input.contactId,
            sentEmailId: sentEmail.id,
            templateId: input.templateId,
            title: template.name,
            description: subject,
            occurredAt: new Date(),
          },
        });
      }
    } catch (sendError) {
      const errorMessage =
        sendError instanceof Error ? sendError.message : "Send failed";

      await prisma.sentEmail.update({
        where: { id: sentEmail.id },
        data: { status: "FAILED", errorMessage },
      });

      await prisma.emailLog.create({
        data: {
          sentEmailId: sentEmail.id,
          event: "FAILED",
          details: errorMessage,
        },
      });

      throw new Error(errorMessage);
    }

    await createAuditLog({
      userId: session.dbUser.id,
      action: "SEND",
      entityType: "sent_email",
      entityId: sentEmail.id,
      details: `Sent email to ${input.to}`,
    });

    revalidatePath("/history");
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    revalidateTag("dashboard", "max");
    return actionSuccess({ id: sentEmail.id });
  } catch (error) {
    return actionError(error);
  }
}

export async function getEmailHistory(filters?: {
  recipient?: string;
  departmentId?: string;
  templateId?: string;
  status?: EmailStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await requireSession();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const where: Record<string, unknown> = {};

  if (session.dbUser.role === "STAFF" || session.dbUser.role === "VIEW_ONLY") {
    where.sentById = session.dbUser.id;
  }

  if (filters?.recipient) {
    where.recipient = { contains: filters.recipient, mode: "insensitive" };
  }
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.templateId) where.templateId = filters.templateId;
  if (filters?.status) where.status = filters.status;
  if (filters?.startDate || filters?.endDate) {
    where.sentAt = {};
    if (filters.startDate) {
      (where.sentAt as Record<string, Date>).gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      (where.sentAt as Record<string, Date>).lte = new Date(filters.endDate);
    }
  }

  const [emails, total] = await Promise.all([
    prisma.sentEmail.findMany({
      where,
      select: {
        id: true,
        recipient: true,
        subject: true,
        status: true,
        sentAt: true,
        brevoMessageId: true,
        template: { select: { name: true } },
        department: { select: { name: true } },
        sentBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sentEmail.count({ where }),
  ]);

  return { emails, total, page, pageSize };
}

export async function getEmailHistoryForExport() {
  const session = await requireSession();

  const where: Record<string, unknown> = {};
  if (session.dbUser.role === "STAFF" || session.dbUser.role === "VIEW_ONLY") {
    where.sentById = session.dbUser.id;
  }

  const BATCH_SIZE = 500;
  const rows: Array<{
    recipient: string;
    subject: string;
    status: string;
    sentAt: Date;
    brevoMessageId: string | null;
    template: { name: string } | null;
    department: { name: string } | null;
    sentBy: { firstName: string; lastName: string };
  }> = [];

  let page = 1;
  while (true) {
    const batch = await prisma.sentEmail.findMany({
      where,
      select: {
        recipient: true,
        subject: true,
        status: true,
        sentAt: true,
        brevoMessageId: true,
        template: { select: { name: true } },
        department: { select: { name: true } },
        sentBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * BATCH_SIZE,
      take: BATCH_SIZE,
    });

    rows.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    page++;
  }

  return rows;
}

export async function getCommunicationTimeline(contactId?: string) {
  await requireSession();

  const where = contactId ? { contactId } : {};

  return prisma.communicationTimeline.findMany({
    where,
    include: {
      contact: { select: { name: true, email: true } },
      template: { select: { name: true } },
      sentEmail: { select: { subject: true, status: true, sentAt: true } },
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });
}
