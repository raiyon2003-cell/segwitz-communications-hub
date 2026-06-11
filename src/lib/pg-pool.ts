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
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}
