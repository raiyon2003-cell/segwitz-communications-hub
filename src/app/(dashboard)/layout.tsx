import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

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
