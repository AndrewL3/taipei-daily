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

const client = postgres(getConnectionString(), { prepare: false });

export const db = drizzle(client, { schema });
