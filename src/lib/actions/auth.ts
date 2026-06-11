"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function signInWithEmail(
  email: string,
  password: string,
  redirectTo = "/dashboard"
) {
  try {
    const data = loginSchema.parse({ email, password });
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { success: false as const, error: error.message };
    }

    redirect(redirectTo);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false as const, error: "Invalid email or password" };
    }
    throw error;
  }
}
