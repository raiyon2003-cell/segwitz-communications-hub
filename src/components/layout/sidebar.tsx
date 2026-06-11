"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Mail,
  History,
  GitBranch,
  Building2,
  Settings,
  UserCircle,
  Send,
} from "lucide-react";
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

  const visibleItems = navItems.filter((item) =>
    hasPermission(role, item.permission)
  );

  return (
    <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Mail className="h-6 w-6 text-primary" />
        <div className="ml-3">
          <p className="text-sm font-bold">SegWitz</p>
          <p className="text-xs text-muted-foreground">Communications Hub</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
