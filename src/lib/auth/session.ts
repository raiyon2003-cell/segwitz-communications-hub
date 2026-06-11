import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Role, User } from "@prisma/client";
import { cache } from "react";

export interface SessionUser extends User {
  department?: {
    id: string;
    name: string;
    division: { id: string; name: string };
  } | null;
}

export const getSession = cache(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const dbUser = await prisma.user.findUnique({
      where: { authId: authUser.id },
      include: {
        department: {
          include: { division: true },
        },
      },
    });

    if (!dbUser || !dbUser.isActive) return null;

    return { authUser, dbUser: dbUser as SessionUser };
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
});

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.dbUser.role)) {
    throw new Error("Forbidden");
  }
  return session;
}
