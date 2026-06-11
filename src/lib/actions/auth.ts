"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUserToDatabase } from "@/lib/auth/sync-user";
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false as const, error: "Sign in failed. Please try again." };
    }

    try {
      const dbUser = await syncAuthUserToDatabase(user);
      if (!dbUser) {
        return {
          success: false as const,
          error:
            "Your account is not set up in the system. Contact an administrator.",
        };
      }
    } catch (dbError) {
      console.error("Database sync failed during login:", dbError);
      return {
        success: false as const,
        error:
          "Unable to connect to the database. Check that DATABASE_URL is set correctly on Vercel.",
      };
    }

    redirect(redirectTo);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false as const, error: "Invalid email or password" };
    }
    throw error;
  }
}
