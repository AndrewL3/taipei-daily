import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../../src/redis.js";
import { tdxFetch } from "../../src/data-sources/tdx.js";
import {
  TdxBusStopRawArraySchema,
  groupStopsIntoStations,
  type BusStation,
  type TdxBusStopRaw,
} from "@tracker/types";

const CACHE_KEY = "transit:stations";
const CACHE_TTL = 86400; // 24h

const CITIES = [
  { path: "Taipei", code: "TPE" },
  { path: "NewTaipei", code: "NWT" },
];

const SELECT_FIELDS =
  "StopUID,StopName,StopPosition,StationID,RouteUID,RouteName,Direction,StopSequence";

async function fetchCityStops(city: {
  path: string;
  code: string;
}): Promise<BusStation[]> {
  const raw = await tdxFetch<TdxBusStopRaw[]>(
    `/v2/Bus/Stop/City/${city.path}`,
    { $select: SELECT_FIELDS },
  );
  const parsed = TdxBusStopRawArraySchema.parse(raw);
  return groupStopsIntoStations(parsed, city.code);
}

async function getAllStations(): Promise<BusStation[]> {
  const cached = await redis.get<BusStation[]>(CACHE_KEY);
  if (cached) return cached;

  const results = await Promise.all(CITIES.map(fetchCityStops));
  const all = results.flat();
  await redis.set(CACHE_KEY, all, { ex: CACHE_TTL });
  return all;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");

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

    const all = await getAllStations();
    const stations = all.filter(
      (s) =>
        s.lat >= south && s.lat <= north && s.lon >= west && s.lon <= east,
    );

    return res.status(200).json({ ok: true, stations });
  } catch (err) {
    console.error("Transit stops API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
