import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@tracker/types";

function getConnectionString(): string {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error(
      "SUPABASE_DB_URL environment variable is not set. " +
        "Add it in Vercel project settings → Environment Variables.",
    );
  }
  return url;
}

function createDb() {
  const client = postgres(getConnectionString(), { prepare: false });
  return drizzle(client, { schema });
}

type Database = ReturnType<typeof createDb>;

let dbInstance: Database | null = null;

export function getDb(): Database {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance;
}

// Defer DB client creation until the first query so handlers can degrade
// gracefully when the DB env var is missing or invalid.
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const resolved = getDb();
    const value = Reflect.get(resolved as object, prop);
    return typeof value === "function" ? value.bind(resolved) : value;
  },
});
