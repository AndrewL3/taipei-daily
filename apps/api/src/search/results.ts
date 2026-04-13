import { redis } from "../redis.js";
import { db } from "../db.js";
import { TRANSIT_STATIONS_CACHE_KEY } from "../transit/cache.js";
import { stops, routes } from "@tracker/types/db";
import { sql } from "drizzle-orm";
import type {
  BusStation,
  YouBikeStation,
  ParkingRoadSegment,
} from "@tracker/types";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lon: number;
  moduleId: string;
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function normalizeSearchQuery(value: string | undefined): string {
  return normalize(value ?? "").slice(0, 100);
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

  return rows.map((row) => ({
    id: `garbage-${row.routeLineId}-${row.name}`,
    title: row.name,
    subtitle: row.lineName ?? "",
    lat: row.latitude,
    lon: row.longitude,
    moduleId: "garbage",
  }));
}

async function searchTransit(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const cached = await redis.get<BusStation[]>(TRANSIT_STATIONS_CACHE_KEY);
  if (!cached) return [];

  return cached
    .filter(
      (station) =>
        normalize(station.name).includes(query) ||
        normalize(station.nameEn).includes(query) ||
        station.routes.some((route) => normalize(route.routeName).startsWith(query)),
    )
    .slice(0, limit)
    .map((station) => ({
      id: `transit-${station.stationId}`,
      title: station.name,
      subtitle: station.routes.map((route) => route.routeName).join(", "),
      lat: station.lat,
      lon: station.lon,
      moduleId: "transit",
    }));
}

async function searchYouBike(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const cached = await redis.get<YouBikeStation[]>("youbike:stations");
  if (!cached) return [];

  return cached
    .filter(
      (station) =>
        normalize(station.name).includes(query) ||
        normalize(station.nameEn).includes(query) ||
        normalize(station.address).includes(query),
    )
    .slice(0, limit)
    .map((station) => ({
      id: `youbike-${station.id}`,
      title: station.name,
      subtitle: station.address,
      lat: station.lat,
      lon: station.lon,
      moduleId: "youbike",
    }));
}

async function searchParking(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const cached = await redis.get<ParkingRoadSegment[]>("parking:spaces");
  if (!cached) return [];

  return cached
    .filter((segment) => normalize(segment.roadName).includes(query))
    .slice(0, limit)
    .map((segment) => ({
      id: `parking-${segment.roadId}`,
      title: segment.roadName,
      subtitle: `${segment.availableSpaces}/${segment.totalSpaces} spaces · ${segment.pricing}`,
      lat: segment.latitude,
      lon: segment.longitude,
      moduleId: "parking",
    }));
}

export async function getSearchResults(query: string): Promise<SearchResult[]> {
  const cacheKey = `search:${query}`;
  const cached = await redis.get<SearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const [transit, garbage, youbike, parking] = await Promise.all([
    searchTransit(query, 10),
    searchGarbage(query, 5),
    searchYouBike(query, 5),
    searchParking(query, 5),
  ]);

  const results = [...transit, ...garbage, ...youbike, ...parking];
  await redis.set(cacheKey, results, { ex: 60 });
  return results;
}
