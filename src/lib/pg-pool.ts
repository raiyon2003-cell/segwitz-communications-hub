import { Pool } from "pg";

export function createPgPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const isSupabase = connectionString.includes("supabase.co");
  const cleanUrl = connectionString.replace(/\?.*$/, "");

  return new Pool({
    connectionString: cleanUrl,
    ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}
