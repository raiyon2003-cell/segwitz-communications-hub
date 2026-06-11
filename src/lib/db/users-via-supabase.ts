import { createAdminClient } from "@/lib/supabase/admin";
import type { Role, User } from "@prisma/client";

type SupabaseUserRow = {
  id: string;
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: SupabaseUserRow): User {
  return {
    id: row.id,
    authId: row.auth_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    departmentId: row.department_id,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getUserByAuthIdViaSupabase(
  authId: string
): Promise<User | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as SupabaseUserRow) : null;
}

export async function getUserByEmailViaSupabase(
  email: string
): Promise<User | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as SupabaseUserRow) : null;
}

export async function upsertAdminUserViaSupabase(input: {
  authId: string;
  email: string;
  departmentId?: string | null;
}): Promise<User> {
  const supabase = createAdminClient();
  const existing = await getUserByEmailViaSupabase(input.email);

  if (existing) {
    const { data, error } = await supabase
      .from("users")
      .update({ auth_id: input.authId, role: "ADMIN", is_active: true })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return mapRow(data as SupabaseUserRow);
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      auth_id: input.authId,
      email: input.email,
      first_name: "System",
      last_name: "Admin",
      role: "ADMIN",
      department_id: input.departmentId ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as SupabaseUserRow);
}
