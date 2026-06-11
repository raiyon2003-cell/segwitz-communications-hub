import { Pool } from "pg";

let pool: Pool | undefined;

export function createPgPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const isSupabase = connectionString.includes("supabase.co");
  const cleanUrl = connectionString.replace(/\?.*$/, "");

  pool = new Pool({
    connectionString: cleanUrl,
    max: process.env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  return pool;
}
