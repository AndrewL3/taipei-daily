import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../src/redis.js";
import {
  AedCsvRowArraySchema,
  groupAedsIntoVenues,
  type AedVenue,
} from "@tracker/types";
import { parseCsv } from "../src/data-sources/aed.js";

const AED_CSV_URL = "https://tw-aed.mohw.gov.tw/openData?t=csv";
const CACHE_KEY = "facilities:aed";
const CACHE_TTL = 86400; // 24h

const GREATER_TAIPEI_CITIES = new Set(["臺北市", "新北市"]);

async function getAllVenues(): Promise<AedVenue[]> {
  const cached = await redis.get<AedVenue[]>(CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(AED_CSV_URL);
  if (!res.ok) throw new Error(`AED CSV fetch error: ${res.status}`);
  const text = await res.text();

  const rawRows = parseCsv(text);
  const parsed = AedCsvRowArraySchema.parse(rawRows);

  // Filter to Greater Taipei
  const taipeiRows = parsed.filter((r) =>
    GREATER_TAIPEI_CITIES.has(r.場所縣市),
  );

  const venues = groupAedsIntoVenues(taipeiRows);
  await redis.set(CACHE_KEY, venues, { ex: CACHE_TTL });
  return venues;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const type = req.query.type as string | undefined;
    if (type && type !== "aed") {
      return res.status(400).json({
        ok: false,
        error: "Unsupported facility type. Supported: aed",
      });
    }

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

    const all = await getAllVenues();
    const venues = all.filter(
      (v) => v.lat >= south && v.lat <= north && v.lon >= west && v.lon <= east,
    );

    return res.status(200).json({ ok: true, venues });
  } catch (err) {
    console.error("Facilities API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
