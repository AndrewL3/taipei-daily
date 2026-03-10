import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../src/redis.js";
import { db } from "../src/db.js";
import { stops, routes } from "@tracker/types";
import { sql } from "drizzle-orm";
import type {
  BusStation,
  YouBikeStation,
  ParkingRoadSegment,
  AedVenue,
} from "@tracker/types";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lon: number;
  moduleId: string;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

async function searchGarbage(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const rows = await db
    .select({
      routeLineId: stops.routeLineId,
      name: stops.name,
      latitude: stops.latitude,
      longitude: stops.longitude,
      lineName: routes.lineName,
    })
    .from(stops)
    .innerJoin(routes, sql`${stops.routeLineId} = ${routes.lineId}`)
    .where(
      sql`${stops.name} ILIKE ${"%" + query + "%"} OR ${routes.lineName} ILIKE ${"%" + query + "%"}`,
    )
    .limit(limit);

  return rows.map((r) => ({
    id: `garbage-${r.routeLineId}-${r.name}`,
    title: r.name,
    subtitle: r.lineName ?? "",
    lat: r.latitude,
    lon: r.longitude,
    moduleId: "garbage",
  }));
}

async function searchTransit(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const cached = await redis.get<BusStation[]>("transit:stations");
  if (!cached) return [];

  const q = normalize(query);
  return cached
    .filter(
      (s) =>
        normalize(s.name).includes(q) ||
        normalize(s.nameEn).includes(q) ||
        s.routes.some((r) => normalize(r.routeName).startsWith(q)),
    )
    .slice(0, limit)
    .map((s) => ({
      id: `transit-${s.stationId}`,
      title: s.name,
      subtitle: s.routes.map((r) => r.routeName).join(", "),
      lat: s.lat,
      lon: s.lon,
      moduleId: "transit",
    }));
}

async function searchYouBike(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const cached = await redis.get<YouBikeStation[]>("youbike:stations");
  if (!cached) return [];

  const q = normalize(query);
  return cached
    .filter(
      (s) =>
        normalize(s.name).includes(q) ||
        normalize(s.nameEn).includes(q) ||
        normalize(s.address).includes(q),
    )
    .slice(0, limit)
    .map((s) => ({
      id: `youbike-${s.id}`,
      title: s.name,
      subtitle: s.address,
      lat: s.lat,
      lon: s.lon,
      moduleId: "youbike",
    }));
}

async function searchParking(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const cached = await redis.get<ParkingRoadSegment[]>("parking:spaces");
  if (!cached) return [];

  const q = normalize(query);
  return cached
    .filter((s) => normalize(s.roadName).includes(q))
    .slice(0, limit)
    .map((s) => ({
      id: `parking-${s.roadId}`,
      title: s.roadName,
      subtitle: `${s.availableSpaces}/${s.totalSpaces} spaces · ${s.pricing}`,
      lat: s.latitude,
      lon: s.longitude,
      moduleId: "parking",
    }));
}

async function searchFacilities(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const cached = await redis.get<AedVenue[]>("facilities:aed");
  if (!cached) return [];

  const q = normalize(query);
  return cached
    .filter(
      (v) =>
        normalize(v.name).includes(q) || normalize(v.address).includes(q),
    )
    .slice(0, limit)
    .map((v) => ({
      id: `facilities-${v.venueId}`,
      title: v.name,
      subtitle: `${v.aedCount} AED · ${v.address}`,
      lat: v.lat,
      lon: v.lon,
      moduleId: "facilities",
    }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const q = ((req.query.q as string) || "")
      .trim()
      .toLowerCase()
      .slice(0, 100);
    if (!q || q.length < 1) {
      return res.status(200).json({ ok: true, results: [] });
    }

    const cacheKey = `search:${q}`;
    const cached = await redis.get<SearchResult[]>(cacheKey);
    if (cached) {
      return res.status(200).json({ ok: true, results: cached });
    }

    const [transit, garbage, youbike, parking, facilities] = await Promise.all([
      searchTransit(q, 10),
      searchGarbage(q, 5),
      searchYouBike(q, 5),
      searchParking(q, 5),
      searchFacilities(q, 5),
    ]);

    const results = [
      ...transit,
      ...garbage,
      ...youbike,
      ...parking,
      ...facilities,
    ];
    await redis.set(cacheKey, results, { ex: 60 });

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("Search API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
