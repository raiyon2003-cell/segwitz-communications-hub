import { Role } from "@prisma/client";

export type Permission =
  | "users.manage"
  | "divisions.manage"
  | "departments.manage"
  | "templates.create"
  | "templates.edit"
  | "templates.approve"
  | "templates.view"
  | "templates.delete"
  | "contacts.manage"
  | "emails.send"
  | "emails.view_all"
  | "emails.view_own"
  | "settings.manage"
  | "dashboard.view"
  | "timeline.view"
  | "api.access";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "users.manage",
    "divisions.manage",
    "departments.manage",
    "templates.create",
    "templates.edit",
    "templates.approve",
    "templates.view",
    "templates.delete",
    "contacts.manage",
    "emails.send",
    "emails.view_all",
    "settings.manage",
    "dashboard.view",
    "timeline.view",
    "api.access",
  ],
  DEPARTMENT_MANAGER: [
    "templates.create",
    "templates.edit",
    "templates.approve",
    "templates.view",
    "contacts.manage",
    "emails.send",
    "emails.view_all",
    "dashboard.view",
    "timeline.view",
  ],
  STAFF: [
    "templates.view",
    "contacts.manage",
    "emails.send",
    "emails.view_own",
    "dashboard.view",
    "timeline.view",
  ],
  VIEW_ONLY: [
    "templates.view",
    "emails.view_own",
    "dashboard.view",
    "timeline.view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessDepartment(
  role: Role,
  userDepartmentId: string | null,
  targetDepartmentId: string
): boolean {
  if (role === "ADMIN") return true;
  if (role === "DEPARTMENT_MANAGER") {
    return userDepartmentId === targetDepartmentId;
  }
  return false;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  DEPARTMENT_MANAGER: "Department Manager",
  STAFF: "Staff",
  VIEW_ONLY: "View Only",
};
