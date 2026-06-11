"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { templateSchema } from "@/lib/validators";
import { parseVariables } from "@/lib/services/variable-parser";
import { createAuditLog } from "@/lib/services/audit";
import { uploadFile, STORAGE_BUCKETS } from "@/lib/services/storage";
import { processHtmlAssetFiles } from "@/lib/services/html-assets";
import { actionError, actionSuccess } from "@/lib/action-results";
import { getCachedCategories } from "@/lib/cache";
import type { TemplateStatus } from "@prisma/client";

const templateListSelect = {
  id: true,
  name: true,
  subject: true,
  departmentId: true,
  categoryId: true,
  templateType: true,
  status: true,
  ownerId: true,
  htmlFileUrl: true,
  createdAt: true,
  updatedAt: true,
  department: { include: { division: true } },
  category: true,
  owner: { select: { firstName: true, lastName: true } },
  variables: {
    select: {
      id: true,
      variableName: true,
      label: true,
      isRequired: true,
    },
  },
  _count: { select: { sentEmails: true } },
} as const;

export async function getTemplates(filters?: {
  status?: TemplateStatus;
  departmentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await requireSession();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { subject: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (
    session.dbUser.role === "DEPARTMENT_MANAGER" &&
    session.dbUser.departmentId
  ) {
    where.departmentId = session.dbUser.departmentId;
  }

  if (session.dbUser.role === "STAFF" || session.dbUser.role === "VIEW_ONLY") {
    where.status = "APPROVED";
  }

  const [templates, total] = await Promise.all([
    prisma.emailTemplate.findMany({
      where,
      select: templateListSelect,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.emailTemplate.count({ where }),
  ]);

  return { templates, total, page, pageSize };
}

export async function getApprovedTemplateSummaries() {
  const session = await requireSession();

  const where: Record<string, unknown> = { status: "APPROVED" };

  if (
    session.dbUser.role === "DEPARTMENT_MANAGER" &&
    session.dbUser.departmentId
  ) {
    where.departmentId = session.dbUser.departmentId;
  }

  return prisma.emailTemplate.findMany({
    where,
    select: {
      id: true,
      name: true,
      subject: true,
      templateType: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTemplateForCompose(id: string) {
  await requireSession();

  return prisma.emailTemplate.findFirst({
    where: { id, status: "APPROVED" },
    select: {
      id: true,
      name: true,
      subject: true,
      body: true,
      htmlContent: true,
      templateType: true,
      variables: true,
      department: { select: { name: true } },
    },
  });
}

export async function getTemplateForEdit(id: string) {
  await requireSession();

  return prisma.emailTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      departmentId: true,
      categoryId: true,
      subject: true,
      body: true,
      templateType: true,
      htmlContent: true,
    },
  });
}

export async function getTemplate(id: string) {
  await requireSession();
  return prisma.emailTemplate.findUnique({
    where: { id },
    include: {
      department: { include: { division: true } },
      category: true,
      owner: true,
      variables: true,
      templateApprovals: {
        include: { approver: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createTemplate(formData: FormData) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "templates.create")) {
      throw new Error("Forbidden");
    }

    const htmlFile = formData.get("htmlFile") as File | null;
    const assetFiles = (formData.getAll("assetFiles") as File[]).filter(
      (f) => f && f.size > 0
    );
    let htmlContent = (formData.get("htmlContent") as string) || undefined;
    let htmlFileUrl: string | undefined;

    if (htmlFile && htmlFile.size > 0) {
      const buffer = Buffer.from(await htmlFile.arrayBuffer());
      htmlContent = buffer.toString("utf-8");
      const path = `${session.dbUser.id}/${Date.now()}-${htmlFile.name}`;
      htmlFileUrl = await uploadFile(
        STORAGE_BUCKETS.TEMPLATES,
        path,
        buffer,
        "text/html"
      );
    }

    if (htmlContent && assetFiles.length > 0) {
      htmlContent = await processHtmlAssetFiles(
        htmlContent,
        assetFiles,
        session.dbUser.id
      );
    }

    const data = templateSchema.parse({
      name: formData.get("name"),
      departmentId: formData.get("departmentId"),
      categoryId: formData.get("categoryId"),
      subject: formData.get("subject"),
      body: formData.get("body"),
      templateType: formData.get("templateType") || "RICH_TEXT",
      htmlContent,
    });

    const variables = parseVariables(data.body, data.htmlContent);

    const template = await prisma.emailTemplate.create({
      data: {
        ...data,
        htmlFileUrl,
        ownerId: session.dbUser.id,
        status: "DRAFT",
        variables: {
          create: variables.map((v) => ({
            variableName: v.name,
            label: v.label,
          })),
        },
      },
    });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "CREATE",
      entityType: "email_template",
      entityId: template.id,
      details: `Created template: ${template.name}`,
    });

    revalidatePath("/templates");
    return actionSuccess(template);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTemplate(id: string, formData: FormData) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "templates.edit")) {
      throw new Error("Forbidden");
    }

    const htmlFile = formData.get("htmlFile") as File | null;
    const assetFiles = (formData.getAll("assetFiles") as File[]).filter(
      (f) => f && f.size > 0
    );
    let htmlContent = (formData.get("htmlContent") as string) || undefined;
    let htmlFileUrl: string | undefined;

    if (htmlFile && htmlFile.size > 0) {
      const buffer = Buffer.from(await htmlFile.arrayBuffer());
      htmlContent = buffer.toString("utf-8");
      const path = `${session.dbUser.id}/${Date.now()}-${htmlFile.name}`;
      htmlFileUrl = await uploadFile(
        STORAGE_BUCKETS.TEMPLATES,
        path,
        buffer,
        "text/html"
      );
    }

    if (htmlContent && assetFiles.length > 0) {
      htmlContent = await processHtmlAssetFiles(
        htmlContent,
        assetFiles,
        session.dbUser.id
      );
    }

    const data = templateSchema.parse({
      name: formData.get("name"),
      departmentId: formData.get("departmentId"),
      categoryId: formData.get("categoryId"),
      subject: formData.get("subject"),
      body: formData.get("body"),
      templateType: formData.get("templateType") || "RICH_TEXT",
      htmlContent,
    });

    const variables = parseVariables(data.body, data.htmlContent);

    await prisma.templateVariable.deleteMany({ where: { templateId: id } });

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...data,
        ...(htmlFileUrl ? { htmlFileUrl } : {}),
        variables: {
          create: variables.map((v) => ({
            variableName: v.name,
            label: v.label,
          })),
        },
      },
    });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "UPDATE",
      entityType: "email_template",
      entityId: id,
      details: `Updated template: ${template.name}`,
    });

    revalidatePath("/templates");
    revalidatePath(`/templates/${id}`);
    return actionSuccess(template);
  } catch (error) {
    return actionError(error);
  }
}

export async function submitTemplateForApproval(id: string) {
  try {
    const session = await requireSession();
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: { status: "PENDING_APPROVAL" },
    });

    await prisma.templateApproval.create({
      data: {
        templateId: id,
        approverId: session.dbUser.id,
        action: "SUBMITTED",
      },
    });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "SUBMIT",
      entityType: "email_template",
      entityId: id,
    });

    revalidatePath("/templates");
    return actionSuccess(template);
  } catch (error) {
    return actionError(error);
  }
}

export async function approveTemplate(id: string, comments?: string) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "templates.approve")) {
      throw new Error("Forbidden");
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    await prisma.templateApproval.create({
      data: {
        templateId: id,
        approverId: session.dbUser.id,
        action: "APPROVED",
        comments,
      },
    });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "APPROVE",
      entityType: "email_template",
      entityId: id,
    });

    revalidatePath("/templates");
    return actionSuccess(template);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteTemplate(id: string) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "templates.delete")) {
      throw new Error("Forbidden");
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!template) throw new Error("Template not found");

    await prisma.$transaction([
      prisma.sentEmail.updateMany({
        where: { templateId: id },
        data: { templateId: null },
      }),
      prisma.communicationTimeline.updateMany({
        where: { templateId: id },
        data: { templateId: null },
      }),
      prisma.emailTemplate.delete({ where: { id } }),
    ]);

    await createAuditLog({
      userId: session.dbUser.id,
      action: "DELETE",
      entityType: "email_template",
      entityId: id,
      details: `Deleted template: ${template.name}`,
    });

    revalidatePath("/templates");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveTemplate(id: string) {
  try {
    const session = await requireSession();
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "ARCHIVE",
      entityType: "email_template",
      entityId: id,
    });

    revalidatePath("/templates");
    return actionSuccess(template);
  } catch (error) {
    return actionError(error);
  }
}

export async function getCategories() {
  await requireSession();
  return getCachedCategories();
}
