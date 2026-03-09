import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../redis.js";
import { tdxFetch } from "../data-sources/tdx.js";
import {
  TdxBusStopRawArraySchema,
  TdxBusEtaRawArraySchema,
  transformArrivals,
  type CityKey,
  type TdxBusStopRaw,
  type TdxBusEtaRaw,
} from "@tracker/types";

const STOPS_CACHE_KEY = "transit:stops:raw";
const STOPS_TTL = 86400;
const ETA_TTL = 60;

const ETA_SELECT =
  "StopUID,StopName,RouteUID,RouteName,Direction,EstimateTime,StopStatus,NextBusTime";
const STOP_SELECT = "StopUID,StationID";

const VALID_CITIES: Set<string> = new Set(["Taipei", "NewTaipei"]);

const SAFE_ID = /^[A-Za-z0-9_-]+$/;

async function getCityStops(city: CityKey): Promise<TdxBusStopRaw[]> {
  const cacheKey = `${STOPS_CACHE_KEY}:${city}`;
  const cached = await redis.get<TdxBusStopRaw[]>(cacheKey);
  if (cached) return cached;

  const raw = await tdxFetch<TdxBusStopRaw[]>(`/v2/Bus/Stop/City/${city}`, {
    $select: STOP_SELECT,
  });
  const parsed = TdxBusStopRawArraySchema.parse(raw);
  await redis.set(cacheKey, parsed, { ex: STOPS_TTL });
  return parsed;
}

function findStopUidsForStation(
  stops: TdxBusStopRaw[],
  stationId: string,
): Set<string> {
  const uids = new Set<string>();
  for (const s of stops) {
    if (s.StationID === stationId) {
      uids.add(s.StopUID);
    }
  }
  return uids;
}

async function getStationEtas(
  city: CityKey,
  stationId: string,
  stopUids: Set<string>,
): Promise<TdxBusEtaRaw[]> {
  const cacheKey = `transit:etas:station:${city}:${stationId}`;
  const cached = await redis.get<TdxBusEtaRaw[]>(cacheKey);
  if (cached) return cached;

  const filter = [...stopUids].map((uid) => `StopUID eq '${uid}'`).join(" or ");
  const raw = await tdxFetch<TdxBusEtaRaw[]>(
    `/v2/Bus/EstimatedTimeOfArrival/City/${city}`,
    { $select: ETA_SELECT, $filter: filter },
  );
  const parsed = TdxBusEtaRawArraySchema.parse(raw);
  await redis.set(cacheKey, parsed, { ex: ETA_TTL });
  return parsed;
}

export async function handleArrivals(req: VercelRequest, res: VercelResponse) {
  try {
    const stationId = req.query.stationId as string | undefined;
    const cityParam = (req.query.city as string) ?? "Taipei";
    if (!VALID_CITIES.has(cityParam)) {
      return res.status(400).json({ ok: false, error: "Invalid city" });
    }
    const city = cityParam as CityKey;

    if (!stationId) {
      return res.status(400).json({
        ok: false,
        error: "stationId query param is required",
      });
    }

    if (!SAFE_ID.test(stationId)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid stationId format",
      });
    }

    const stops = await getCityStops(city);
    const stopUids = findStopUidsForStation(stops, stationId);
    if (stopUids.size === 0) {
      return res.status(200).json({ ok: true, arrivals: [] });
    }

    const etas = await getStationEtas(city, stationId, stopUids);
    const arrivals = transformArrivals(etas, stopUids);

    return res.status(200).json({ ok: true, arrivals });
  } catch (err) {
    console.error("Transit arrivals API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
