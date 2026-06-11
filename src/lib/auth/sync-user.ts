import { prisma } from "@/lib/prisma";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@prisma/client";

export async function syncAuthUserToDatabase(
  authUser: SupabaseUser
): Promise<User | null> {
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

  const pmDept = await prisma.department.findFirst({
    where: { name: "Project Management" },
  });

  return prisma.user.create({
    data: {
      authId: authUser.id,
      email: authUser.email,
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
      departmentId: pmDept?.id ?? null,
    },
  });
}
