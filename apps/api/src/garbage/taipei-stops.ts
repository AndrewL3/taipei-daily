import { redis } from "../redis.js";
import { parseTaipeiGarbageCsv, type TaipeiGarbageStop } from "@tracker/types";

const CACHE_KEY = "garbage:taipei:stops";
const CACHE_TTL = 86_400; // 24 hours

const CSV_URL =
  "https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=a6e90031-7ec4-4089-afb5-361a4efe7202";

async function getAllStops(): Promise<TaipeiGarbageStop[]> {
  const cached = await redis.get<TaipeiGarbageStop[]>(CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(`Taipei CSV fetch failed: ${res.status} ${res.statusText}`);
  }
  const csvText = await res.text();
  const stops = parseTaipeiGarbageCsv(csvText);

  await redis.set(CACHE_KEY, stops, { ex: CACHE_TTL });
  return stops;
}

export interface TaipeiGarbageBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function getTaipeiGarbageStopsInBounds({
  north,
  south,
  east,
  west,
}: TaipeiGarbageBounds): Promise<TaipeiGarbageStop[]> {
  const all = await getAllStops();

  return all.filter(
    (stop) =>
      stop.lat >= south &&
      stop.lat <= north &&
      stop.lon >= west &&
      stop.lon <= east,
  );
}
