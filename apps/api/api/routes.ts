import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "../src/db.js";
import { routes, stops, passEvents } from "@tracker/types";
import {
  toTaipeiDateString,
  getTaipeiDayOfWeek,
  computeEtaDelta,
  type RouteStop,
  type PassEvent,
} from "@tracker/utils";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const lineId = req.query.lineId as string | undefined;

    if (lineId) {
      return await handleDetail(lineId, res);
    } else {
      return await handleList(res);
    }
  } catch (err) {
    console.error("Routes API error:", err);
    return res.status(500).json({ ok: false, error: "Database unavailable" });
  }
}

async function handleList(res: VercelResponse) {
  const today = toTaipeiDateString(new Date());

  const rows = await db.execute(sql`
    SELECT
      r.line_id,
      r.line_name,
      r.city,
      COUNT(DISTINCT s.id)::int AS stop_count,
      COUNT(DISTINCT pe.car)::int AS active_vehicles,
      MAX(pe.stop_rank) AS leading_stop_rank
    FROM routes r
    LEFT JOIN stops s ON s.route_line_id = r.line_id
    LEFT JOIN pass_events pe
      ON pe.route_line_id = r.line_id
      AND pe.route_date = ${today}
    GROUP BY r.line_id, r.line_name, r.city
    ORDER BY r.line_name
  `);

  const routeList = (rows as any[]).map((row: any) => ({
    lineId: row.line_id,
    lineName: row.line_name,
    city: row.city,
    stopCount: Number(row.stop_count),
    activeVehicles: Number(row.active_vehicles),
    leadingStopRank: row.leading_stop_rank != null ? Number(row.leading_stop_rank) : null,
  }));

  return res.status(200).json({ ok: true, routes: routeList });
}

async function handleDetail(lineId: string, res: VercelResponse) {
  // 1. Get the route
  const routeRows = await db
    .select()
    .from(routes)
    .where(eq(routes.lineId, lineId));

  if (routeRows.length === 0) {
    return res.status(404).json({ ok: false, error: "Route not found" });
  }

  const route = routeRows[0];
  const today = toTaipeiDateString(new Date());
  const dow = getTaipeiDayOfWeek(new Date());

  // 2. Get stops ordered by rank
  const stopRows = await db
    .select()
    .from(stops)
    .where(eq(stops.routeLineId, lineId))
    .orderBy(asc(stops.rank));

  // 3. Get today's pass events for this route
  const eventRows = await db
    .select({
      stopRank: passEvents.stopRank,
      car: passEvents.car,
      passedAt: passEvents.passedAt,
    })
    .from(passEvents)
    .where(
      sql`${passEvents.routeLineId} = ${lineId} AND ${passEvents.routeDate} = ${today}`,
    );

  // 4. Compute ETA and annotate stops
  const routeStops: RouteStop[] = stopRows.map((s) => ({
    rank: s.rank,
    name: s.name,
    village: s.village,
    scheduledTime: s.scheduledTime,
    garbageDays: s.garbageDays,
    recyclingDays: s.recyclingDays,
    foodscrapsDays: s.foodscrapsDays,
  }));

  const events: PassEvent[] = eventRows.map((e) => ({
    stopRank: e.stopRank,
    car: e.car,
    passedAt: e.passedAt,
  }));

  const etaResult = computeEtaDelta(routeStops, events, today, dow);

  return res.status(200).json({
    ok: true,
    route: {
      lineId: route.lineId,
      lineName: route.lineName,
      city: route.city,
    },
    stops: etaResult.stops,
    progress: etaResult.progress,
  });
}
