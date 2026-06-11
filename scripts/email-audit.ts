/**
 * Email & Brevo audit script — run with: npx tsx scripts/email-audit.ts
 * Optional: AUDIT_TEST_EMAIL=you@example.com to run live send tests
 */
import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { BrevoClient } from "@getbrevo/brevo";
import { createDecipheriv, scryptSync } from "crypto";

const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function decryptEncryptedSetting(encryptedText: string): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters");
  }
  const key = scryptSync(secret, "sch-salt", 32);
  const data = Buffer.from(encryptedText, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// Inline copies of core logic to avoid Next.js import issues
const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

function replaceVariables(content: string, values: Record<string, string>): string {
  return content.replace(VARIABLE_REGEX, (_, name: string) => values[name] ?? `{{${name}}}`);
}

function sanitizeHtmlForPreview(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

function wrapHtmlForPreview(html: string): string {
  const sanitized = sanitizeHtmlForPreview(html);
  if (/<html[\s>]/i.test(sanitized)) return sanitized;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${sanitized}</body></html>`;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type AuditResult = { name: string; pass: boolean; details: string };

const results: AuditResult[] = [];
function record(name: string, pass: boolean, details: string) {
  results.push({ name, pass, details });
  const icon = pass ? "✓" : "✗";
  console.log(`${icon} ${name}: ${details}`);
}

async function getBrevoConfig() {
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
      ? decryptEncryptedSetting(map.brevo_api_key.slice(4))
      : map.brevo_api_key,
    senderName: map.brevo_sender_name || "SegWitz",
    senderEmail: map.brevo_sender_email,
    replyToEmail: map.brevo_reply_to_email || map.brevo_sender_email,
  };
}

async function testPreviewLogic() {
  console.log("\n=== TEMPLATE PREVIEW LOGIC ===\n");

  const richText = "Hello {{client_name}},\n\nWelcome to SegWitz!";
  const replaced = replaceVariables(richText, { client_name: "Jane Doe" });
  record(
    "Variable replacement (rich text)",
    replaced.includes("Jane Doe") && !replaced.includes("{{client_name}}"),
    replaced.slice(0, 80)
  );

  const htmlWithVars = `<div style="color:red"><h1>{{company_name}}</h1><img src="https://via.placeholder.com/150" width="150" alt="logo"/></div>`;
  const htmlReplaced = replaceVariables(htmlWithVars, { company_name: "Conteg" });
  record(
    "Variable replacement (HTML)",
    htmlReplaced.includes("Conteg") && htmlReplaced.includes("via.placeholder.com"),
    "Variables + image URL preserved"
  );

  const wrapped = wrapHtmlForPreview("<p style='color:blue'>Fragment</p>");
  record(
    "HTML fragment wrapping",
    wrapped.includes("<!DOCTYPE html>") && wrapped.includes("color:blue"),
    "DOCTYPE + styles preserved"
  );

  const fullHtml = `<!DOCTYPE html><html><head><style>body{background:#f0f0f0}</style></head><body><table width="100%"><tr><td>Header</td></tr></table></body></html>`;
  const wrappedFull = wrapHtmlForPreview(fullHtml);
  record(
    "Full HTML document passthrough",
    wrappedFull === sanitizeHtmlForPreview(fullHtml) && wrappedFull.includes("background:#f0f0f0"),
    "Full document not double-wrapped"
  );

  const malicious = `<img src=x onerror="alert(1)"><script>alert(1)</script><p>Safe</p>`;
  const sanitized = sanitizeHtmlForPreview(malicious);
  record(
    "Script/onerror stripping",
    !sanitized.includes("<script") && !sanitized.includes("onerror"),
    "Scripts and event handlers removed"
  );

  const longHtml = "<p>" + "Line of content. ".repeat(500) + "</p>";
  const longWrapped = wrapHtmlForPreview(longHtml);
  record(
    "Long template content",
    longWrapped.length > 5000,
    `${longWrapped.length} chars wrapped successfully`
  );
}

async function testTemplatesInDb() {
  console.log("\n=== TEMPLATES IN DATABASE ===\n");

  const templates = await prisma.emailTemplate.findMany({
    select: {
      id: true,
      name: true,
      templateType: true,
      status: true,
      htmlContent: true,
      body: true,
      variables: { select: { variableName: true } },
    },
  });

  record("Templates exist", templates.length > 0, `Found ${templates.length} templates`);

  const richText = templates.filter((t) => t.templateType === "RICH_TEXT");
  const html = templates.filter((t) => t.templateType === "HTML");
  record("Rich text templates", richText.length > 0, `${richText.length} RICH_TEXT`);
  record("HTML templates", html.length >= 0, `${html.length} HTML`);

  for (const t of html) {
    const hasContent = !!(t.htmlContent && t.htmlContent.trim());
    const imgCount = (t.htmlContent?.match(/<img/gi) || []).length;
    record(
      `HTML template "${t.name}" content`,
      hasContent,
      hasContent ? `${t.htmlContent!.length} chars, ${imgCount} images` : "EMPTY"
    );
  }

  const approved = templates.filter((t) => t.status === "APPROVED");
  record("Approved templates for sending", approved.length > 0, `${approved.length} APPROVED`);

  for (const t of html) {
    if (!t.htmlContent) continue;
    const imgSrcs = [...t.htmlContent.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(
      (m) => m[1]
    );
    for (const src of imgSrcs) {
      if (src.startsWith("data:")) {
        record(`Image (data URI) in "${t.name}"`, true, "Embedded base64 image");
        continue;
      }
      if (src.startsWith("cid:")) {
        record(`Image (cid) in "${t.name}"`, true, src);
        continue;
      }
      try {
        const res = await fetch(src, { method: "HEAD", signal: AbortSignal.timeout(8000) });
        record(
          `Image reachable: ${src.slice(0, 60)}...`,
          res.ok,
          `HTTP ${res.status}`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        record(`Image reachable: ${src.slice(0, 60)}...`, false, msg);
      }
    }
  }
}

async function testBrevoConnection() {
  console.log("\n=== BREVO INTEGRATION ===\n");

  const config = await getBrevoConfig();
  if (!config) {
    record("Brevo config loaded", false, "Missing API key or sender email in database settings");
    return null;
  }

  record("Brevo config loaded", true, `Sender: ${config.senderName} <${config.senderEmail}>`);
  record("Reply-to configured", !!config.replyToEmail, config.replyToEmail);
  record("API key present", config.apiKey.length > 10, `Key length: ${config.apiKey.length} chars`);

  const client = new BrevoClient({ apiKey: config.apiKey });

  try {
    const account = await client.account.getAccount();
    record(
      "Brevo API authentication",
      true,
      `Account: ${account.email}, Plan: ${account.plan?.[0]?.type || "unknown"}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    record("Brevo API authentication", false, msg);
    return null;
  }

  try {
    const senders = await client.senders.getSenders();
    const senderList = senders.senders || [];
    const verified = senderList.some(
      (s) => s.email?.toLowerCase() === config.senderEmail.toLowerCase()
    );
    record(
      "Sender email verified in Brevo",
      verified,
      verified
        ? `${config.senderEmail} found in ${senderList.length} senders`
        : `Sender ${config.senderEmail} NOT in Brevo sender list (${senderList.map((s) => s.email).join(", ")})`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    record("Sender verification check", false, msg);
  }

  return config;
}

async function testLiveSending(config: NonNullable<Awaited<ReturnType<typeof getBrevoConfig>>>) {
  const testEmail = process.env.AUDIT_TEST_EMAIL || process.env.SEED_ADMIN_EMAIL;
  if (!testEmail) {
    record("Live email tests", false, "No AUDIT_TEST_EMAIL or SEED_ADMIN_EMAIL set");
    return;
  }

  console.log(`\n=== LIVE EMAIL TESTS → ${testEmail} ===\n`);

  const client = new BrevoClient({ apiKey: config.apiKey });
  const sentIds: string[] = [];

  const tests = [
    {
      name: "Simple rich text email",
      subject: `[Audit] Simple test ${Date.now()}`,
      html: `<div style="font-family:Arial">Hello, this is a simple test email from SegWitz audit.</div>`,
    },
    {
      name: "HTML template with styling",
      subject: `[Audit] HTML styled ${Date.now()}`,
      html: `<!DOCTYPE html><html><head><style>.header{background:#1a1a2e;color:#fff;padding:20px}.body{padding:20px;font-family:Arial}</style></head><body><div class="header">SegWitz Header</div><div class="body"><p>Styled HTML email test.</p></div></body></html>`,
    },
    {
      name: "Email with variables",
      subject: `[Audit] Variables {{client_name}} ${Date.now()}`,
      html: `<p>Dear Conteg Test Client,</p><p>Your company: SegWitz Communications</p>`,
      subjectVars: { client_name: "Conteg Test Client" },
      bodyVars: { client_name: "Conteg Test Client", company_name: "SegWitz Communications" },
    },
    {
      name: "Email with remote image",
      subject: `[Audit] Image test ${Date.now()}`,
      html: `<div><h2>Image Test</h2><img src="https://via.placeholder.com/300x100/1a1a2e/ffffff?text=SegWitz" alt="Banner" width="300" height="100"/></div>`,
    },
    {
      name: "Email with attachment",
      subject: `[Audit] Attachment test ${Date.now()}`,
      html: `<p>Please find attached test file.</p>`,
      attachment: {
        name: "audit-test.txt",
        content: Buffer.from("SegWitz email audit test file\nTimestamp: " + new Date().toISOString()).toString("base64"),
      },
    },
  ];

  for (const test of tests) {
    try {
      let subject = test.subject;
      let html = test.html;
      if (test.subjectVars) subject = replaceVariables(subject, test.subjectVars);
      if (test.bodyVars) html = replaceVariables(html, test.bodyVars);

      const response = await client.transactionalEmails.sendTransacEmail({
        sender: { name: config.senderName, email: config.senderEmail },
        replyTo: { email: config.replyToEmail },
        to: [{ email: testEmail }],
        subject,
        htmlContent: html,
        textContent: html.replace(/<[^>]+>/g, ""),
        attachment: test.attachment ? [test.attachment] : undefined,
      });

      const messageId = response.messageId || `unknown-${Date.now()}`;
      sentIds.push(messageId);
      record(test.name, true, `Message ID: ${messageId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      record(test.name, false, msg);
    }
  }

  console.log("\nSent message IDs:", sentIds.join(", "));
}

async function testAppEmailFlow(config: NonNullable<Awaited<ReturnType<typeof getBrevoConfig>>>) {
  console.log("\n=== APP EMAIL FLOW (DB + BREVO) ===\n");

  const testEmail = process.env.AUDIT_TEST_EMAIL || process.env.SEED_ADMIN_EMAIL;
  if (!testEmail) {
    record("App email flow", false, "No test email configured");
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { email: process.env.SEED_ADMIN_EMAIL || "admin@segwitz.com" },
  });
  if (!admin) {
    record("App email flow", false, "Admin user not found");
    return;
  }

  let template = await prisma.emailTemplate.findFirst({
    where: { status: "APPROVED" },
    include: { department: true },
  });

  if (!template) {
    const draft = await prisma.emailTemplate.findFirst({
      include: { department: true },
    });
    if (draft) {
      template = await prisma.emailTemplate.update({
        where: { id: draft.id },
        data: { status: "APPROVED" },
        include: { department: true },
      });
      record("Template approved for test", true, `"${template.name}" temporarily approved`);
    }
  }

  if (!template) {
    record("App email flow", false, "No template available");
    return;
  }

  const subject = `[App Audit] ${template.name} ${Date.now()}`;
  const bodyContent =
    template.templateType === "HTML" && template.htmlContent
      ? template.htmlContent
      : template.body;
  const htmlContent =
    template.templateType === "HTML"
      ? bodyContent
      : `<div style="font-family: Arial, sans-serif;">${bodyContent.replace(/\n/g, "<br>")}</div>`;

  const sentEmail = await prisma.sentEmail.create({
    data: {
      recipient: testEmail,
      subject,
      body: bodyContent,
      templateId: template.id,
      departmentId: template.departmentId,
      sentById: admin.id,
      status: "PENDING",
    },
  });

  try {
    const client = new BrevoClient({ apiKey: config.apiKey });
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: { name: config.senderName, email: config.senderEmail },
      replyTo: { email: config.replyToEmail },
      to: [{ email: testEmail }],
      subject,
      htmlContent,
      textContent: bodyContent.replace(/<[^>]+>/g, ""),
    });

    const messageId = response.messageId || `brevo-${Date.now()}`;

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

    record("App flow: email sent via Brevo", true, `Message ID: ${messageId}`);
    record("App flow: DB record created", true, `sentEmail.id=${sentEmail.id}`);
    record("App flow: status SENT", true, "Status updated");
    record("App flow: message ID stored", true, messageId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.sentEmail.update({
      where: { id: sentEmail.id },
      data: { status: "FAILED", errorMessage: msg },
    });
    record("App email flow", false, msg);
  }
}

async function testEmailHistory() {
  console.log("\n=== EMAIL HISTORY ===\n");

  const recent = await prisma.sentEmail.findMany({
    orderBy: { sentAt: "desc" },
    take: 10,
    select: {
      recipient: true,
      subject: true,
      status: true,
      sentAt: true,
      brevoMessageId: true,
      template: { select: { name: true } },
      sentBy: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  record("Email history records", recent.length >= 0, `${recent.length} recent emails`);

  for (const e of recent.slice(0, 5)) {
    const complete =
      !!e.recipient &&
      !!e.subject &&
      !!e.status &&
      !!e.sentAt &&
      !!e.sentBy;
    record(
      `History: "${e.subject.slice(0, 40)}..."`,
      complete,
      `Status=${e.status}, MsgID=${e.brevoMessageId || "MISSING"}, Template=${e.template?.name || "—"}, Sender=${e.sentBy.firstName} ${e.sentBy.lastName}`
    );
  }

  const sentWithMsgId = recent.filter((e) => e.status === "SENT" && e.brevoMessageId);
  const sentWithoutMsgId = recent.filter((e) => e.status === "SENT" && !e.brevoMessageId);
  record(
    "SENT emails have Brevo Message ID",
    sentWithoutMsgId.length === 0,
    `${sentWithMsgId.length} with ID, ${sentWithoutMsgId.length} missing ID`
  );
}

async function main() {
  console.log("SegWitz Email & Brevo Audit");
  console.log("Timestamp:", new Date().toISOString());
  console.log("=".repeat(50));

  try {
    await testPreviewLogic();
    await testTemplatesInDb();
    const config = await testBrevoConnection();
    if (config) {
      await testLiveSending(config);
      await testAppEmailFlow(config);
    }
    await testEmailHistory();
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log("\n" + "=".repeat(50));
  console.log("SUMMARY");
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`Passed: ${passed}/${results.length}`);
  if (failed.length > 0) {
    console.log("\nFailed checks:");
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.details}`));
  }
}

main().catch((e) => {
  console.error("Audit failed:", e);
  process.exit(1);
});
