"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { contactSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/services/audit";
import { actionError, actionSuccess } from "@/lib/action-results";
import type { ContactType } from "@prisma/client";

export async function getContacts(filters?: {
  search?: string;
  contactType?: ContactType;
  page?: number;
  pageSize?: number;
}) {
  await requireSession();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const where: Record<string, unknown> = {};
  if (filters?.contactType) where.contactType = filters.contactType;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total, page, pageSize };
}

export async function getContact(id: string) {
  await requireSession();
  return prisma.contact.findUnique({
    where: { id },
    include: {
      communicationTimelines: {
        include: {
          template: { select: { name: true } },
          sentEmail: { select: { subject: true, status: true } },
        },
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function getContactForEdit(id: string) {
  await requireSession();
  return prisma.contact.findUnique({ where: { id } });
}

export async function getContactsForCompose() {
  await requireSession();
  return prisma.contact.findMany({
    select: { id: true, name: true, email: true, company: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function createContact(input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "contacts.manage")) {
      throw new Error("Forbidden");
    }

    const data = contactSchema.parse(input);
    const contact = await prisma.contact.create({ data });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "CREATE",
      entityType: "contact",
      entityId: contact.id,
    });

    revalidatePath("/contacts");
    return actionSuccess(contact);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateContact(id: string, input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "contacts.manage")) {
      throw new Error("Forbidden");
    }

    const data = contactSchema.parse(input);
    const contact = await prisma.contact.update({ where: { id }, data });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "UPDATE",
      entityType: "contact",
      entityId: id,
    });

    revalidatePath("/contacts");
    return actionSuccess(contact);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteContact(id: string) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "contacts.manage")) {
      throw new Error("Forbidden");
    }

    await prisma.contact.delete({ where: { id } });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "DELETE",
      entityType: "contact",
      entityId: id,
    });

    revalidatePath("/contacts");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}
