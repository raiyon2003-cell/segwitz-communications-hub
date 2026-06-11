"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "template" | "contact" | "email";
};

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  const session = await requireSession();
  const q = query.trim();

  if (!q || q.length < 2) return [];

  const results: SearchResultItem[] = [];
  const take = 5;

  if (hasPermission(session.dbUser.role, "templates.view")) {
    const templateWhere: Record<string, unknown> = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ],
    };

    if (
      session.dbUser.role === "DEPARTMENT_MANAGER" &&
      session.dbUser.departmentId
    ) {
      templateWhere.departmentId = session.dbUser.departmentId;
    }

    if (
      session.dbUser.role === "STAFF" ||
      session.dbUser.role === "VIEW_ONLY"
    ) {
      templateWhere.status = "APPROVED";
    }

    const templates = await prisma.emailTemplate.findMany({
      where: templateWhere,
      select: {
        id: true,
        name: true,
        subject: true,
        department: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    results.push(
      ...templates.map((t) => ({
        id: t.id,
        title: t.name,
        subtitle: `${t.department.name} · ${t.subject}`,
        href: `/templates/${t.id}`,
        type: "template" as const,
      }))
    );
  }

  if (hasPermission(session.dbUser.role, "contacts.manage")) {
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, company: true },
      orderBy: { name: "asc" },
      take,
    });

    results.push(
      ...contacts.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.company ? `${c.email} · ${c.company}` : c.email,
        href: `/contacts/${c.id}/edit`,
        type: "contact" as const,
      }))
    );
  }

  if (
    hasPermission(session.dbUser.role, "emails.view_all") ||
    hasPermission(session.dbUser.role, "emails.view_own")
  ) {
    const emailWhere: Record<string, unknown> = {
      OR: [
        { recipient: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ],
    };

    if (
      session.dbUser.role === "STAFF" ||
      session.dbUser.role === "VIEW_ONLY"
    ) {
      emailWhere.sentById = session.dbUser.id;
    }

    const emails = await prisma.sentEmail.findMany({
      where: emailWhere,
      select: {
        id: true,
        recipient: true,
        subject: true,
        status: true,
      },
      orderBy: { sentAt: "desc" },
      take,
    });

    results.push(
      ...emails.map((e) => ({
        id: e.id,
        title: e.subject,
        subtitle: `${e.recipient} · ${e.status}`,
        href: "/history",
        type: "email" as const,
      }))
    );
  }

  return results.slice(0, 12);
}
