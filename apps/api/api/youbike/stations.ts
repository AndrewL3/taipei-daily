import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../../src/redis.js";
import { sendInternalError } from "../../src/http.js";
import {
  NtcYouBikeRawArraySchema,
  TpeYouBikeRawArraySchema,
  transformNtcStation,
  transformTpeStation,
  type YouBikeStation,
} from "@tracker/types";

const CACHE_KEY = "youbike:stations";
const CACHE_TTL = 60;

const NTC_API =
  "https://data.ntpc.gov.tw/api/datasets/010e5b15-3823-4b20-b401-b1cf000550c5/json";
const TPE_API =
  "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";

async function fetchNtcStations(): Promise<YouBikeStation[]> {
  const stations: YouBikeStation[] = [];
  let page = 0;
  const size = 1000;

  while (true) {
    const res = await fetch(`${NTC_API}?page=${page}&size=${size}`);
    const data = await res.json();
    const parsed = NtcYouBikeRawArraySchema.parse(data);
    if (parsed.length === 0) break;
    stations.push(...parsed.map(transformNtcStation));
    page++;
  }

  return stations;
}

async function fetchTpeStations(): Promise<YouBikeStation[]> {
  const res = await fetch(TPE_API);
  const data = await res.json();
  const parsed = TpeYouBikeRawArraySchema.parse(data);
  return parsed.map(transformTpeStation);
}

async function getAllStations(): Promise<YouBikeStation[]> {
  const cached = await redis.get<YouBikeStation[]>(CACHE_KEY);
  if (cached) return cached;

  const [ntc, tpe] = await Promise.all([
    fetchNtcStations(),
    fetchTpeStations(),
  ]);

  const all = [...ntc, ...tpe];
  await redis.set(CACHE_KEY, all, { ex: CACHE_TTL });
  return all;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      (s) => s.lat >= south && s.lat <= north && s.lon >= west && s.lon <= east,
    );

    return res.status(200).json({ ok: true, stations });
  } catch (err) {
    return sendInternalError(res, "YouBike stations API error:", err);
  }
}
