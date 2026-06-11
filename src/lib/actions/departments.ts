"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { divisionSchema, departmentSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/services/audit";
import { actionError, actionSuccess } from "@/lib/action-results";

export async function getDivisions() {
  await requireSession();
  return prisma.division.findMany({
    include: {
      departments: { orderBy: { name: "asc" } },
      _count: { select: { departments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDepartments() {
  await requireSession();
  return prisma.department.findMany({
    include: { division: true },
    orderBy: { name: "asc" },
  });
}

export async function createDivision(input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "divisions.manage")) {
      throw new Error("Forbidden");
    }

    const data = divisionSchema.parse(input);
    const division = await prisma.division.create({ data });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "CREATE",
      entityType: "division",
      entityId: division.id,
    });

    revalidatePath("/departments");
    return actionSuccess(division);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateDivision(id: string, input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "divisions.manage")) {
      throw new Error("Forbidden");
    }

    const data = divisionSchema.parse(input);
    const division = await prisma.division.update({ where: { id }, data });

    revalidatePath("/departments");
    return actionSuccess(division);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteDivision(id: string) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "divisions.manage")) {
      throw new Error("Forbidden");
    }

    await prisma.division.delete({ where: { id } });
    revalidatePath("/departments");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function createDepartment(input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "departments.manage")) {
      throw new Error("Forbidden");
    }

    const data = departmentSchema.parse(input);
    const department = await prisma.department.create({ data });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "CREATE",
      entityType: "department",
      entityId: department.id,
    });

    revalidatePath("/departments");
    return actionSuccess(department);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateDepartment(id: string, input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "departments.manage")) {
      throw new Error("Forbidden");
    }

    const data = departmentSchema.parse(input);
    const department = await prisma.department.update({ where: { id }, data });

    revalidatePath("/departments");
    return actionSuccess(department);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteDepartment(id: string) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "departments.manage")) {
      throw new Error("Forbidden");
    }

    await prisma.department.delete({ where: { id } });
    revalidatePath("/departments");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}
