"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { startOfDay, startOfMonth, endOfDay } from "date-fns";

export async function getDashboardStats() {
  const session = await requireSession();
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const monthStart = startOfMonth(today);

  const baseWhere =
    session.dbUser.role === "STAFF" || session.dbUser.role === "VIEW_ONLY"
      ? { sentById: session.dbUser.id }
      : {};

  const [
    emailsSentToday,
    failedToday,
    emailsSentMonth,
    recentSends,
    recentFailures,
    mostUsedTemplates,
    emailsByDepartment,
  ] = await Promise.all([
    prisma.sentEmail.count({
      where: {
        ...baseWhere,
        status: "SENT",
        sentAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.sentEmail.count({
      where: {
        ...baseWhere,
        status: "FAILED",
        sentAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.sentEmail.count({
      where: {
        ...baseWhere,
        status: "SENT",
        sentAt: { gte: monthStart },
      },
    }),
    prisma.sentEmail.findMany({
      where: { ...baseWhere, status: "SENT" },
      include: {
        template: { select: { name: true } },
        sentBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
    prisma.sentEmail.findMany({
      where: { ...baseWhere, status: "FAILED" },
      include: {
        template: { select: { name: true } },
        sentBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
    prisma.sentEmail.groupBy({
      by: ["templateId"],
      where: { ...baseWhere, status: "SENT", templateId: { not: null } },
      _count: { templateId: true },
      orderBy: { _count: { templateId: "desc" } },
      take: 5,
    }),
    prisma.sentEmail.groupBy({
      by: ["departmentId"],
      where: { ...baseWhere, status: "SENT", departmentId: { not: null } },
      _count: { departmentId: true },
    }),
  ]);

  const templateIds = mostUsedTemplates
    .map((t) => t.templateId)
    .filter(Boolean) as string[];
  const templates = await prisma.emailTemplate.findMany({
    where: { id: { in: templateIds } },
    select: { id: true, name: true },
  });
  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t.name]));

  const departmentIds = emailsByDepartment
    .map((d) => d.departmentId)
    .filter(Boolean) as string[];
  const departments = await prisma.department.findMany({
    where: { id: { in: departmentIds } },
    select: { id: true, name: true },
  });
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  return {
    emailsSentToday,
    failedToday,
    emailsSentMonth,
    recentSends,
    recentFailures,
    mostUsedTemplates: mostUsedTemplates.map((t) => ({
      name: templateMap[t.templateId!] || "Unknown",
      count: t._count.templateId,
    })),
    emailsByDepartment: emailsByDepartment.map((d) => ({
      name: deptMap[d.departmentId!] || "Unknown",
      count: d._count.departmentId,
    })),
  };
}
