import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

const rawUrl = process.env.DATABASE_URL!;
const connectionString = rawUrl.replace(/\?.*$/, "");
const pool = new Pool({
  connectionString,
  ...(rawUrl.includes("supabase.co")
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DIVISIONS = [
  {
    name: "Business Division",
    departments: ["Sales", "Marketing", "Account Management"],
  },
  {
    name: "Delivery Division",
    departments: [
      "Project Management",
      "UI/UX",
      "Frontend",
      "Backend",
      "Mobile Development",
      "QA",
      "DevOps",
    ],
  },
  {
    name: "Corporate Services Division",
    departments: ["HR", "Finance", "Administration", "Operations"],
  },
  {
    name: "Leadership Division",
    departments: ["Management", "Strategy"],
  },
];

const CATEGORIES = [
  { name: "Proposal Sent", department: "Sales" },
  { name: "Quotation Sent", department: "Sales" },
  { name: "Follow Up", department: "Sales" },
  { name: "Welcome Email", department: "Project Management" },
  { name: "Kickoff Meeting", department: "Project Management" },
  { name: "Weekly Update", department: "Project Management" },
  { name: "Monthly Milestone Report", department: "Project Management" },
  { name: "UAT Ready", department: "Project Management" },
  { name: "Go Live", department: "Project Management" },
  { name: "Invoice Issued", department: "Finance" },
  { name: "Receipt Issued", department: "Finance" },
  { name: "Payment Reminder", department: "Finance" },
  { name: "Overdue Notice", department: "Finance" },
  { name: "Interview Invitation", department: "HR" },
  { name: "Rejection Email", department: "HR" },
  { name: "Employee Onboarding", department: "HR" },
  { name: "Announcement", department: "Administration" },
  { name: "Reminder", department: "Administration" },
];

async function main() {
  console.log("Seeding database...");

  for (const div of DIVISIONS) {
    const division = await prisma.division.upsert({
      where: { name: div.name },
      create: { name: div.name },
      update: {},
    });

    for (const deptName of div.departments) {
      await prisma.department.upsert({
        where: {
          divisionId_name: { divisionId: division.id, name: deptName },
        },
        create: { name: deptName, divisionId: division.id },
        update: {},
      });
    }
  }

  for (const cat of CATEGORIES) {
    await prisma.emailCategory.upsert({
      where: {
        name_department: { name: cat.name, department: cat.department },
      },
      create: cat,
      update: {},
    });
  }

  await prisma.setting.upsert({
    where: { key: "company_name" },
    create: { key: "company_name", value: "SegWitz" },
    update: {},
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@segwitz.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAuth = existingUsers?.users?.find((u) => u.email === adminEmail);

  let authId = existingAuth?.id;

  if (!authId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });
    if (error) throw error;
    authId = data.user!.id;
    console.log(`Created Supabase auth user: ${adminEmail}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authId, {
      password: adminPassword,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Reset password for admin: ${adminEmail}`);
  }

  const pmDept = await prisma.department.findFirst({
    where: { name: "Project Management" },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      authId: authId!,
      email: adminEmail,
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
      departmentId: pmDept?.id,
    },
    update: { role: "ADMIN" },
  });

  console.log(`Admin user ready: ${adminEmail}`);
  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
