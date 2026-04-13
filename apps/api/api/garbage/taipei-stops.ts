import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../../src/redis.js";
import { sendInternalError } from "../../src/http.js";
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

    const all = await getAllStops();
    const stops = all.filter(
      (s) => s.lat >= south && s.lat <= north && s.lon >= west && s.lon <= east,
    );

    return res.status(200).json({ ok: true, stops });
  } catch (err) {
    return sendInternalError(res, "Taipei garbage stops API error:", err);
  }
}
