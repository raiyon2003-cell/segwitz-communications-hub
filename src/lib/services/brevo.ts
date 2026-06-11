import { BrevoClient } from "@getbrevo/brevo";
import { decrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export interface BrevoConfig {
  apiKey: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
}

export interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: Array<{
    name: string;
    content: string;
    type: string;
  }>;
}

export async function getBrevoConfig(): Promise<BrevoConfig | null> {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "brevo_api_key",
          "brevo_sender_name",
          "brevo_sender_email",
          "brevo_reply_to_email",
        ],
      },
    },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  if (!map.brevo_api_key || !map.brevo_sender_email) return null;

  return {
    apiKey: map.brevo_api_key.startsWith("enc:")
      ? decrypt(map.brevo_api_key.slice(4))
      : map.brevo_api_key,
    senderName: map.brevo_sender_name || "SegWitz",
    senderEmail: map.brevo_sender_email,
    replyToEmail: map.brevo_reply_to_email || map.brevo_sender_email,
  };
}

export async function sendEmailViaBrevo(
  params: SendEmailParams
): Promise<{ messageId: string }> {
  const config = await getBrevoConfig();
  if (!config) {
    throw new Error("Brevo is not configured. Please configure in Settings.");
  }

  const client = new BrevoClient({ apiKey: config.apiKey });

  const response = await client.transactionalEmails.sendTransacEmail({
    sender: {
      name: config.senderName,
      email: config.senderEmail,
    },
    replyTo: { email: config.replyToEmail },
    to: params.to.map((email) => ({ email })),
    cc: params.cc?.map((email) => ({ email })),
    bcc: params.bcc?.map((email) => ({ email })),
    subject: params.subject,
    htmlContent: params.htmlContent,
    textContent: params.textContent,
    attachment: params.attachments?.map((a) => ({
      name: a.name,
      content: a.content,
    })),
  });

  const messageId = response.messageId || `brevo-${Date.now()}`;
  return { messageId };
}
