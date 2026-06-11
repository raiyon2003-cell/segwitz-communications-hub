"use server";

import { revalidatePath } from "next/cache";
import { clearBrevoConfigCache } from "@/lib/services/brevo";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { settingsSchema } from "@/lib/validators";
import { encrypt } from "@/lib/encryption";
import { createAuditLog } from "@/lib/services/audit";
import { actionError, actionSuccess } from "@/lib/action-results";

export async function getSettings() {
  const session = await requireSession();
  if (!hasPermission(session.dbUser.role, "settings.manage")) {
    throw new Error("Forbidden");
  }

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "company_name",
          "company_logo",
          "brevo_sender_name",
          "brevo_sender_email",
          "brevo_reply_to_email",
          "brevo_api_key",
        ],
      },
    },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s]));

  return {
    companyName: map.company_name?.value || "SegWitz",
    companyLogo: map.company_logo?.value || "",
    brevoSenderName: map.brevo_sender_name?.value || "",
    brevoSenderEmail: map.brevo_sender_email?.value || "",
    brevoReplyToEmail: map.brevo_reply_to_email?.value || "",
    hasBrevoApiKey: !!map.brevo_api_key?.value,
  };
}

async function upsertSetting(key: string, value: string, isSecret = false) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value, isSecret },
    update: { value, isSecret },
  });
}

export async function updateSettings(input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "settings.manage")) {
      throw new Error("Forbidden");
    }

    const data = settingsSchema.parse(input);

    await upsertSetting("company_name", data.companyName);
    await upsertSetting("brevo_sender_name", data.brevoSenderName);
    await upsertSetting("brevo_sender_email", data.brevoSenderEmail);
    await upsertSetting(
      "brevo_reply_to_email",
      data.brevoReplyToEmail || data.brevoSenderEmail
    );

    if (data.brevoApiKey && data.brevoApiKey.trim()) {
      await upsertSetting(
        "brevo_api_key",
        `enc:${encrypt(data.brevoApiKey)}`,
        true
      );
    }

    await createAuditLog({
      userId: session.dbUser.id,
      action: "UPDATE",
      entityType: "settings",
      details: "Updated application settings",
    });

    clearBrevoConfigCache();
    revalidatePath("/settings");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}
