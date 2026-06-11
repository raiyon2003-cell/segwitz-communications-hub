"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { startOfDay, startOfMonth, endOfDay } from "date-fns";
import type { Role } from "@prisma/client";

const recentEmailSelect = {
  id: true,
  recipient: true,
  subject: true,
  errorMessage: true,
  sentAt: true,
  template: { select: { name: true } },
  sentBy: { select: { firstName: true, lastName: true } },
} as const;

async function fetchDashboardStats(userId: string, role: Role) {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const monthStart = startOfMonth(today);

  const baseWhere =
    role === "STAFF" || role === "VIEW_ONLY" ? { sentById: userId } : {};

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
      select: recentEmailSelect,
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
    prisma.sentEmail.findMany({
      where: { ...baseWhere, status: "FAILED" },
      select: recentEmailSelect,
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
      orderBy: { _count: { departmentId: "desc" } },
      take: 10,
    }),
  ]);

  const templateIds = mostUsedTemplates
    .map((t) => t.templateId)
    .filter(Boolean) as string[];
  const departmentIds = emailsByDepartment
    .map((d) => d.departmentId)
    .filter(Boolean) as string[];

  const [templates, departments] = await Promise.all([
    templateIds.length > 0
      ? prisma.emailTemplate.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    departmentIds.length > 0
      ? prisma.department.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t.name]));
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

const getCachedDashboardStats = unstable_cache(
  fetchDashboardStats,
  ["dashboard-stats"],
  { revalidate: 60, tags: ["dashboard"] }
);

export async function getDashboardStats() {
  const session = await requireSession();
  return getCachedDashboardStats(session.dbUser.id, session.dbUser.role);
}
