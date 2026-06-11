import { Pool } from "pg";

let pool: Pool | undefined;

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const isSupabase = connectionString.includes("supabase");
  const isVercel = !!process.env.VERCEL;

  // Keep query params (e.g. sslmode=require) for non-Supabase URLs.
  // For Supabase we set ssl explicitly because pg ignores sslmode in some runtimes.
  const connectionStringForPool = isSupabase
    ? connectionString.replace(/\?.*$/, "")
    : connectionString;

  return {
    connectionString: connectionStringForPool,
    max: isVercel ? 1 : 10,
    idleTimeoutMillis: isVercel ? 5000 : 20000,
    connectionTimeoutMillis: 15000,
    allowExitOnIdle: isVercel,
    ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

export function createPgPool() {
  if (pool) return pool;
  pool = new Pool(buildPoolConfig());
  return pool;
}

export async function testDatabaseConnection(): Promise<boolean> {
  const testPool = new Pool(buildPoolConfig());
  try {
    await testPool.query("SELECT 1");
    return true;
  } finally {
    await testPool.end();
  }
}
