import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "drizzle-orm";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const checks: Record<string, { ok: boolean; error?: string }> = {};

  // 1. Check env vars (existence only, not values)
  const envVars = [
    "SUPABASE_DB_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];
  for (const name of envVars) {
    checks[name] = { ok: !!process.env[name] };
    if (!process.env[name]) {
      checks[name].error = "Not set";
    }
  }

  // 2. Test DB connection
  try {
    const { db } = await import("../src/db.js");
    await db.execute(sql`SELECT 1 AS ping`);
    checks.database = { ok: true };
  } catch (err) {
    checks.database = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 3. Test Redis connection
  try {
    const { redis } = await import("../src/redis.js");
    await redis.ping();
    checks.redis = { ok: true };
  } catch (err) {
    checks.redis = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return res.status(allOk ? 200 : 503).json({ ok: allOk, checks });
}
