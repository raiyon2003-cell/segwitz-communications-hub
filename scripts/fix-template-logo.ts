/**
 * One-time fix: upload fly-world-logo.png and update the HTML template.
 * Run: npx tsx scripts/fix-template-logo.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { rewriteRelativeAssetUrls } from "../src/lib/services/html-sanitizer";

const LOGO_PATH = "/Users/zaira/Desktop/poster/assets/fly-world-logo.png";
const BUCKET = "company-assets";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const template = await prisma.emailTemplate.findFirst({
    where: { templateType: "HTML" },
    include: { owner: true },
  });

  if (!template?.htmlContent) {
    console.error("No HTML template found");
    process.exit(1);
  }

  const logoBuffer = readFileSync(LOGO_PATH);
  const storagePath = `${template.ownerId}/assets/fly-world-logo.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, logoBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError.message);
    process.exit(1);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  console.log("Uploaded logo:", publicUrl);

  const updatedHtml = rewriteRelativeAssetUrls(template.htmlContent, {
    "assets/fly-world-logo.png": publicUrl,
    "fly-world-logo.png": publicUrl,
  });

  await prisma.emailTemplate.update({
    where: { id: template.id },
    data: { htmlContent: updatedHtml },
  });

  console.log(`Updated template "${template.name}" (${template.id})`);
  console.log("Logo URL in HTML:", publicUrl);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
