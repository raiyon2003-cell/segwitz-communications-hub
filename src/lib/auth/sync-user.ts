import { prisma } from "@/lib/prisma";
import {
  getUserByAuthIdViaSupabase,
  getUserByEmailViaSupabase,
  upsertAdminUserViaSupabase,
} from "@/lib/db/users-via-supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@prisma/client";

async function getProjectManagementDeptId(): Promise<string | null> {
  try {
    const dept = await prisma.department.findFirst({
      where: { name: "Project Management" },
      select: { id: true },
    });
    return dept?.id ?? null;
  } catch {
    return null;
  }
}

async function syncViaPrisma(authUser: SupabaseUser): Promise<User | null> {
  if (!authUser.email) return null;

  const existingByAuth = await prisma.user.findUnique({
    where: { authId: authUser.id },
  });
  if (existingByAuth) {
    return existingByAuth.isActive ? existingByAuth : null;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: authUser.email },
  });
  if (existingByEmail) {
    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { authId: authUser.id },
    });
    return updated.isActive ? updated : null;
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@segwitz.com";
  if (authUser.email !== adminEmail) return null;

  const pmDeptId = await getProjectManagementDeptId();

  return prisma.user.create({
    data: {
      authId: authUser.id,
      email: authUser.email,
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
      departmentId: pmDeptId,
    },
  });
}

async function syncViaSupabase(authUser: SupabaseUser): Promise<User | null> {
  if (!authUser.email) return null;

  const existingByAuth = await getUserByAuthIdViaSupabase(authUser.id);
  if (existingByAuth) {
    return existingByAuth.isActive ? existingByAuth : null;
  }

  const existingByEmail = await getUserByEmailViaSupabase(authUser.email);
  if (existingByEmail) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@segwitz.com";
    if (authUser.email === adminEmail) {
      return upsertAdminUserViaSupabase({
        authId: authUser.id,
        email: authUser.email,
        departmentId: existingByEmail.departmentId,
      });
    }
    return existingByEmail.isActive ? existingByEmail : null;
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@segwitz.com";
  if (authUser.email !== adminEmail) return null;

  return upsertAdminUserViaSupabase({
    authId: authUser.id,
    email: authUser.email,
  });
}

export async function syncAuthUserToDatabase(
  authUser: SupabaseUser
): Promise<User | null> {
  try {
    return await syncViaPrisma(authUser);
  } catch (prismaError) {
    console.error("Prisma sync failed, trying Supabase REST:", prismaError);
    return syncViaSupabase(authUser);
  }
}
