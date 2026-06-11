"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { userSchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuditLog } from "@/lib/services/audit";
import { actionError, actionSuccess } from "@/lib/action-results";

export async function getUsers() {
  const session = await requireSession();
  if (!hasPermission(session.dbUser.role, "users.manage")) {
    throw new Error("Forbidden");
  }

  return prisma.user.findMany({
    include: { department: { include: { division: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "users.manage")) {
      throw new Error("Forbidden");
    }

    const data = userSchema.parse(input);
    if (!data.password) throw new Error("Password is required for new users");

    const supabase = createAdminClient();
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (error || !authData.user) {
      throw new Error(error?.message || "Failed to create auth user");
    }

    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        departmentId: data.departmentId || null,
      },
    });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "CREATE",
      entityType: "user",
      entityId: user.id,
    });

    revalidatePath("/users");
    return actionSuccess(user);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateUser(id: string, input: unknown) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "users.manage")) {
      throw new Error("Forbidden");
    }

    const data = userSchema.parse(input);
    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        departmentId: data.departmentId || null,
      },
    });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "UPDATE",
      entityType: "user",
      entityId: id,
    });

    revalidatePath("/users");
    return actionSuccess(user);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.dbUser.role, "users.manage")) {
      throw new Error("Forbidden");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");

    const supabase = createAdminClient();
    await supabase.auth.admin.deleteUser(user.authId);
    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      userId: session.dbUser.id,
      action: "DELETE",
      entityType: "user",
      entityId: id,
    });

    revalidatePath("/users");
    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}
