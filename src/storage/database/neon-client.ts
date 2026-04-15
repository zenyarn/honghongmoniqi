import { Pool, type QueryResultRow } from "pg";

let envLoaded = false;
let pool: Pool | null = null;

function loadEnv() {
  if (envLoaded || process.env.NEON_DATABASE_URL) {
    return;
  }

  try {
    require("dotenv").config({ path: ".env.local" });
  } catch {
    // ignore dotenv load errors in production runtimes
  }

  envLoaded = true;
}

export function getNeonDatabaseUrl() {
  loadEnv();

  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error("NEON_DATABASE_URL is not set");
  }

  return connectionString;
}

export function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getNeonDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return getDbPool().query<T>(text, params);
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}
