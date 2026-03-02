import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, between, eq } from "drizzle-orm";
import { db } from "../src/db.js";
import { stops, routes } from "@tracker/types";
import { haversineMeters } from "@tracker/utils";

const DEFAULT_RADIUS = 500;
const MAX_RADIUS = 2000;
// ~111,000 meters per degree of latitude
const METERS_PER_DEGREE = 111_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const latStr = req.query.lat as string | undefined;
    const lonStr = req.query.lon as string | undefined;
    const radiusStr = req.query.radius as string | undefined;

    if (!latStr || !lonStr) {
      return res
        .status(400)
        .json({ ok: false, error: "lat and lon are required" });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ ok: false, error: "Invalid coordinates" });
    }

    const radius = Math.min(
      radiusStr ? parseFloat(radiusStr) || DEFAULT_RADIUS : DEFAULT_RADIUS,
      MAX_RADIUS,
    );

    // Bounding box filter
    const latDelta = radius / METERS_PER_DEGREE;
    const lonDelta =
      radius / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180));

    const rows = await db
      .select({
        routeLineId: stops.routeLineId,
        rank: stops.rank,
        name: stops.name,
        latitude: stops.latitude,
        longitude: stops.longitude,
        lineName: routes.lineName,
      })
      .from(stops)
      .innerJoin(routes, eq(stops.routeLineId, routes.lineId))
      .where(
        and(
          between(stops.latitude, lat - latDelta, lat + latDelta),
          between(stops.longitude, lon - lonDelta, lon + lonDelta),
        ),
      );

    // Refine with haversine and compute distance
    const nearbyStops = rows
      .map((row) => ({
        routeLineId: row.routeLineId,
        routeLineName: row.lineName,
        rank: row.rank,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        distance: Math.round(
          haversineMeters(lat, lon, row.latitude, row.longitude),
        ),
      }))
      .filter((s) => s.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return res.status(200).json({ ok: true, stops: nearbyStops });
  } catch (err) {
    console.error("Stops API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
