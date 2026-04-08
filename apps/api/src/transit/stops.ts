import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../redis.js";
import { tdxFetch } from "../data-sources/tdx.js";
import {
  TRANSIT_STATIONS_CACHE_KEY,
  TRANSIT_STATIONS_CACHE_TTL,
} from "./cache.js";
import {
  TdxStopOfRouteRawArraySchema,
  flattenStopsOfRoute,
  groupStopsIntoStations,
  type CityKey,
  type BusStation,
  type TdxStopOfRouteRaw,
} from "@tracker/types";

const VALID_CITIES: Set<string> = new Set(["Taipei", "NewTaipei"]);

const CITIES: CityKey[] = ["Taipei", "NewTaipei"];

async function fetchCityStops(city: CityKey): Promise<BusStation[]> {
  const raw = await tdxFetch<TdxStopOfRouteRaw[]>(
    `/v2/Bus/StopOfRoute/City/${city}`,
  );
  const parsed = TdxStopOfRouteRawArraySchema.parse(raw);
  const flat = flattenStopsOfRoute(parsed);
  return groupStopsIntoStations(flat, city);
}

async function getAllStations(): Promise<BusStation[]> {
  const cached = await redis.get<BusStation[]>(TRANSIT_STATIONS_CACHE_KEY);
  if (cached) return cached;

  const results = await Promise.all(CITIES.map(fetchCityStops));
  const all = results.flat();
  await redis.set(TRANSIT_STATIONS_CACHE_KEY, all, {
    ex: TRANSIT_STATIONS_CACHE_TTL,
  });
  return all;
}

export async function handleStops(req: VercelRequest, res: VercelResponse) {
  try {
    const north = parseFloat(req.query.north as string);
    const south = parseFloat(req.query.south as string);
    const east = parseFloat(req.query.east as string);
    const west = parseFloat(req.query.west as string);

    if ([north, south, east, west].some(isNaN)) {
      return res.status(400).json({
        ok: false,
        error: "north, south, east, west query params are required",
      });
    }

    const cityParam = req.query.city as CityKey | undefined;
    if (cityParam && !VALID_CITIES.has(cityParam)) {
      return res.status(400).json({ ok: false, error: "Invalid city" });
    }

    const all = await getAllStations();
    const stations = all.filter(
      (s) =>
        s.lat >= south &&
        s.lat <= north &&
        s.lon >= west &&
        s.lon <= east &&
        (!cityParam || s.city === cityParam),
    );

    return res.status(200).json({ ok: true, stations });
  } catch (err) {
    console.error("Transit stops API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
