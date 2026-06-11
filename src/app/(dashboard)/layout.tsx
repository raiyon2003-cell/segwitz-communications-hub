import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUserToDatabase } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = await getSession();

  if (!session) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      try {
        const synced = await syncAuthUserToDatabase(authUser);
        if (synced?.isActive) {
          const dbUser = await prisma.user.findUnique({
            where: { id: synced.id },
            include: {
              department: { include: { division: true } },
            },
          });
          if (dbUser) {
            session = { authUser, dbUser };
          }
        }
      } catch (error) {
        console.error("Dashboard DB error:", error);
        redirect("/login?error=database_error");
      }

      if (!session) {
        redirect("/login?error=account_not_configured");
      }
    } else {
      redirect("/login");
    }
  }

  return (
    <DashboardShell
      user={{
        firstName: session.dbUser.firstName,
        lastName: session.dbUser.lastName,
        email: session.dbUser.email,
        role: session.dbUser.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
