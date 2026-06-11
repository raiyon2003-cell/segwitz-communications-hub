import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address"),
  contactType: z.enum([
    "CLIENT",
    "PROSPECT",
    "EMPLOYEE",
    "CANDIDATE",
    "VENDOR",
    "PARTNER",
  ]),
  notes: z.string().optional(),
});

export const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().min(1, "Category is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  templateType: z.enum(["RICH_TEXT", "HTML"]),
  htmlContent: z.string().optional(),
});

export const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "DEPARTMENT_MANAGER", "STAFF", "VIEW_ONLY"]),
  departmentId: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
});

export const divisionSchema = z.object({
  name: z.string().min(1, "Division name is required"),
  description: z.string().optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  divisionId: z.string().min(1, "Division is required"),
});

export const settingsSchema = z.object({
  companyName: z.string().min(1),
  brevoApiKey: z.string().optional(),
  brevoSenderName: z.string().min(1),
  brevoSenderEmail: z.string().email(),
  brevoReplyToEmail: z.string().email().optional(),
});

export const composeEmailSchema = z.object({
  templateId: z.string().min(1),
  contactId: z.string().optional(),
  to: z.string().email(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.record(z.string(), z.string()).optional(),
});
