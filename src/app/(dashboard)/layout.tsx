import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      // Supabase session is valid but no DB user — don't sign out (that causes a loop).
      redirect("/login?error=account_not_configured");
    }

    redirect("/login");
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
