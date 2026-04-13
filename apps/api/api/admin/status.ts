import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "drizzle-orm";
import { db } from "../../src/db.js";
import { requireSharedSecret } from "../../src/auth.js";
import { redis } from "../../src/redis.js";
import { toTaipeiDateString } from "@tracker/utils";

const NTC_GPS_URL =
  "https://data.ntpc.gov.tw/api/datasets/28ab4122-60e1-4065-98e5-abccb69aaca6/json";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (
    !(await requireSharedSecret(req, res, {
      envVarName: "ADMIN_PASSWORD",
      scope: "admin/status",
      allowRawAuthorization: true,
    }))
  ) {
    return;
  }

  const now = new Date();
  const today = toTaipeiDateString(now);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // --- Service Health (parallel) ---
  const [dbHealth, redisHealth, ntcHealth] = await Promise.all([
    pingDatabase(),
    pingRedis(),
    pingNtcApi(),
  ]);

  // --- Data Freshness ---
  const freshness = {
    latestGpsTimestamp: ntcHealth.latestTimestamp,
    passEventsLastHour: 0,
    passEventsToday: 0,
  };
  try {
    const counts = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE route_date = ${today})::int AS today,
        COUNT(*) FILTER (WHERE passed_at >= ${oneHourAgo.toISOString()})::int AS last_hour
      FROM pass_events
    `);
    const row = (counts as Record<string, unknown>[])[0];
    freshness.passEventsToday = Number(row?.today ?? 0);
    freshness.passEventsLastHour = Number(row?.last_hour ?? 0);
  } catch (err) {
    console.error("[admin/status] freshness query failed:", err);
  }

  // --- Cron Sync Log ---
  let recentSyncs: unknown[] = [];
  try {
    const raw = await redis.lrange("admin:sync_log", 0, 19);
    recentSyncs = raw.map((entry) =>
      typeof entry === "string" ? JSON.parse(entry) : entry,
    );
  } catch (err) {
    console.error("[admin/status] sync log read failed:", err);
  }

  // --- Route Status Grid ---
  let routes: unknown[] = [];
  try {
    const rows = await db.execute(sql`
      SELECT
        r.line_id,
        r.line_name,
        r.city,
        COUNT(DISTINCT s.id)::int AS stop_count,
        COUNT(DISTINCT pe.car)::int AS active_vehicles,
        MAX(pe.stop_rank) AS leading_stop_rank,
        MAX(pe.passed_at) AS last_event_at
      FROM routes r
      LEFT JOIN stops s ON s.route_line_id = r.line_id
      LEFT JOIN pass_events pe
        ON pe.route_line_id = r.line_id
        AND pe.route_date = ${today}
      GROUP BY r.line_id, r.line_name, r.city
      ORDER BY r.line_name
    `);
    routes = (rows as Record<string, unknown>[]).map((row) => {
      const activeVehicles = Number(row.active_vehicles ?? 0);
      const totalStops = Number(row.stop_count ?? 0);
      const leadingStopRank =
        row.leading_stop_rank != null ? Number(row.leading_stop_rank) : null;

      const status =
        activeVehicles === 0
          ? "inactive"
          : leadingStopRank != null && leadingStopRank >= totalStops
            ? "completed"
            : "active";

      return {
        lineId: row.line_id,
        lineName: row.line_name,
        city: row.city,
        totalStops,
        activeVehicles,
        leadingStopRank,
        lastEventAt: row.last_event_at ?? null,
        status,
      };
    });
  } catch (err) {
    console.error("[admin/status] route status query failed:", err);
  }

  return res.status(200).json({
    ok: true,
    timestamp: now.toISOString(),
    services: {
      database: {
        ok: dbHealth.ok,
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error,
      },
      redis: {
        ok: redisHealth.ok,
        latencyMs: redisHealth.latencyMs,
        error: redisHealth.error,
      },
      ntcGpsApi: {
        ok: ntcHealth.ok,
        latencyMs: ntcHealth.latencyMs,
        vehicleCount: ntcHealth.vehicleCount,
        error: ntcHealth.error,
      },
    },
    freshness,
    recentSyncs,
    routes,
  });
}

async function pingDatabase() {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function pingRedis() {
  const start = Date.now();
  try {
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function pingNtcApi() {
  const start = Date.now();
  try {
    const resp = await fetch(`${NTC_GPS_URL}?page=0&size=1000`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = (await resp.json()) as Record<string, unknown>[];
    return {
      ok: true,
      latencyMs: Date.now() - start,
      vehicleCount: data.length,
      latestTimestamp:
        data.length > 0 ? ((data[0]?.time as string) ?? null) : null,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      vehicleCount: 0,
      latestTimestamp: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
