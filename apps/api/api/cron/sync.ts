import type { VercelRequest, VercelResponse } from "@vercel/node";
import { inArray, asc } from "drizzle-orm";
import { db } from "../../src/db.js";
import { sendServiceUnavailable } from "../../src/http.js";
import { redis } from "../../src/redis.js";
import { stops, passEvents } from "@tracker/types/db";
import {
  inferPassEvents,
  getNextMidnightTaipei,
  type StopCoord,
} from "@tracker/utils";
import { fetchLiveGps } from "../../src/ntc-client.js";
import type { VehicleGps } from "@tracker/types";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  // Method check: only accept POST
  if (_req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Auth check: validate CRON_SECRET bearer token (skip if env var not set)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return sendServiceUnavailable(
      res,
      "[cron/sync] CRON_SECRET is not configured",
    );
  }

  const authHeader = _req.headers.authorization;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const startMs = Date.now();

    async function logSync(entry: Record<string, unknown>) {
      try {
        const p = redis.pipeline();
        p.lpush(
          "admin:sync_log",
          JSON.stringify({ ...entry, durationMs: Date.now() - startMs }),
        );
        p.ltrim("admin:sync_log", 0, 99);
        await p.exec();
      } catch {
        /* never break sync */
      }
    }

    // 1. Fetch live GPS
    let gpsPoints: VehicleGps[];
    try {
      gpsPoints = await fetchLiveGps();
    } catch (err) {
      console.error("NTC API fetch failed:", err);
      await logSync({
        timestamp: new Date().toISOString(),
        vehicles: 0,
        routes: 0,
        newPassEvents: 0,
        error: "NTC API unreachable",
      });
      return res.status(500).json({ ok: false, error: "NTC API unreachable" });
    }

    if (gpsPoints.length === 0) {
      await logSync({
        timestamp: new Date().toISOString(),
        vehicles: 0,
        routes: 0,
        newPassEvents: 0,
        error: null,
      });
      return res.status(200).json({ ok: true, vehicles: 0 });
    }

    // 2. Group by lineId
    const byLine = new Map<string, VehicleGps[]>();
    for (const point of gpsPoints) {
      const arr = byLine.get(point.lineid) ?? [];
      arr.push(point);
      byLine.set(point.lineid, arr);
    }

    // 3. Load stops for active routes
    const activeLineIds = [...byLine.keys()];
    const routeStops = await db
      .select({
        routeLineId: stops.routeLineId,
        rank: stops.rank,
        latitude: stops.latitude,
        longitude: stops.longitude,
      })
      .from(stops)
      .where(inArray(stops.routeLineId, activeLineIds))
      .orderBy(stops.routeLineId, asc(stops.rank));

    const stopsByLine = new Map<string, StopCoord[]>();
    for (const s of routeStops) {
      const arr = stopsByLine.get(s.routeLineId) ?? [];
      arr.push({ rank: s.rank, latitude: s.latitude, longitude: s.longitude });
      stopsByLine.set(s.routeLineId, arr);
    }

    // 4. Load Redis state (batch)
    const allKeys: string[] = [];
    for (const [lineId, vehicles] of byLine) {
      for (const v of vehicles) {
        allKeys.push(`sync:${lineId}:${v.car}`);
      }
    }

    const redisState: Record<string, number> = {};
    if (allKeys.length > 0) {
      try {
        const values = await redis.mget<(number | null)[]>(...allKeys);
        for (let i = 0; i < allKeys.length; i++) {
          if (values[i] != null) {
            redisState[allKeys[i]] = values[i]!;
          }
        }
      } catch (err) {
        console.error("Redis MGET failed:", err);
        await logSync({
          timestamp: new Date().toISOString(),
          vehicles: gpsPoints.length,
          routes: 0,
          newPassEvents: 0,
          error: "Redis read failed",
        });
        return res.status(500).json({ ok: false, error: "Redis read failed" });
      }
    }

    // 5. Run inference per route
    let totalPassEvents = 0;
    const allPassEvents: {
      routeLineId: string;
      stopRank: number;
      car: string;
      passedAt: Date;
      routeDate: string;
    }[] = [];
    const allRedisUpdates: Record<string, number> = {};

    for (const [lineId, vehicles] of byLine) {
      const lineStops = stopsByLine.get(lineId) ?? [];
      const result = inferPassEvents({
        lineId,
        stops: lineStops,
        vehicles: vehicles.map((v) => ({
          car: v.car,
          latitude: v.latitude,
          longitude: v.longitude,
          time: v.time,
        })),
        redisState,
      });

      allPassEvents.push(...result.passEvents);
      Object.assign(allRedisUpdates, result.redisUpdates);
    }

    // 6. Write PassEvents to Supabase
    if (allPassEvents.length > 0) {
      try {
        await db.insert(passEvents).values(allPassEvents).onConflictDoNothing();
        totalPassEvents = allPassEvents.length;
      } catch (err) {
        console.error("Supabase write failed:", err);
        await logSync({
          timestamp: new Date().toISOString(),
          vehicles: gpsPoints.length,
          routes: byLine.size,
          newPassEvents: 0,
          error: "DB write failed",
        });
        return res.status(500).json({ ok: false, error: "DB write failed" });
      }
    }

    // 7. Update Redis state
    const midnightUnix = getNextMidnightTaipei(new Date());
    try {
      const pipeline = redis.pipeline();
      for (const [key, rank] of Object.entries(allRedisUpdates)) {
        pipeline.set(key, rank, { exat: midnightUnix });
      }
      if (Object.keys(allRedisUpdates).length > 0) {
        await pipeline.exec();
      }
    } catch (err) {
      console.error("Redis update failed:", err);
      // PassEvents already written — log but don't fail
      // Next tick will read stale rank but onConflictDoNothing prevents duplicates
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      vehicles: gpsPoints.length,
      routes: byLine.size,
      newPassEvents: totalPassEvents,
      error: null,
    };
    await logSync(logEntry);

    return res.status(200).json({
      ok: true,
      vehicles: gpsPoints.length,
      routes: byLine.size,
      newPassEvents: totalPassEvents,
    });
  } catch (err) {
    console.error("Unexpected error in sync:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}
