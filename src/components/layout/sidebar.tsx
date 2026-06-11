"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  History,
  GitBranch,
  Building2,
  Settings,
  UserCircle,
  Send,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" as const },
  { href: "/templates", label: "Templates", icon: FileText, permission: "templates.view" as const },
  { href: "/contacts", label: "Contacts", icon: Users, permission: "contacts.manage" as const },
  { href: "/compose", label: "Compose Email", icon: Send, permission: "emails.send" as const },
  { href: "/history", label: "Email History", icon: History, permission: "emails.view_own" as const },
  { href: "/timeline", label: "Timeline", icon: GitBranch, permission: "timeline.view" as const },
  { href: "/users", label: "Users", icon: UserCircle, permission: "users.manage" as const },
  { href: "/departments", label: "Departments", icon: Building2, permission: "divisions.manage" as const },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" as const },
];

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = navItems.filter((item) =>
    hasPermission(role, item.permission)
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <BrandLogo variant="light" size="sm" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="outline"
          className="w-full justify-start border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
