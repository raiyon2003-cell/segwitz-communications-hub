import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUserToDatabase } from "@/lib/auth/sync-user";
import type { Role, User } from "@prisma/client";
import { cache } from "react";

export interface SessionUser extends User {
  department?: {
    id: string;
    name: string;
    division: { id: string; name: string };
  } | null;
}

const userInclude = {
  department: {
    include: { division: true },
  },
} as const;

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  let dbUser = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: userInclude,
  });

  if (!dbUser && authUser.email) {
    const synced = await syncAuthUserToDatabase(authUser);
    if (synced) {
      dbUser = await prisma.user.findUnique({
        where: { id: synced.id },
        include: userInclude,
      });
    }
  }

  if (!dbUser || !dbUser.isActive) return null;

  return { authUser, dbUser: dbUser as SessionUser };
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
