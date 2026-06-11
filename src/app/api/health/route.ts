import { NextResponse } from "next/server";
import { testDatabaseConnection } from "@/lib/pg-pool";

export async function GET() {
  const checks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
    databaseConnected: false,
  };

  if (checks.DATABASE_URL) {
    try {
      checks.databaseConnected = await testDatabaseConnection();
    } catch {
      checks.databaseConnected = false;
    }
  }

  return NextResponse.json(checks);
}
