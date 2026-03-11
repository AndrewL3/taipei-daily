import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRequire } from "node:module";
import { redis } from "../src/redis.js";
import type { AedVenue } from "@tracker/types";

const CACHE_KEY = "facilities:aed";
const CACHE_TTL = 86400; // 24h

const _require = createRequire(import.meta.url);

/**
 * Load AED venues from the bundled JSON snapshot.
 * Generated at build time by src/scripts/prefetch-aed.ts.
 * MOHW's server is unreachable from Vercel Lambda (TCP timeout),
 * so we rely on build-time data instead of live fetching.
 */
function loadBundledVenues(): AedVenue[] {
  try {
    return _require("../src/data/aed-venues.json") as AedVenue[];
  } catch {
    return [];
  }
}

async function getAllVenues(): Promise<AedVenue[]> {
  const cached = await redis.get<AedVenue[]>(CACHE_KEY);
  if (cached) return cached;

  const venues = loadBundledVenues();
  if (venues.length > 0) {
    await redis.set(CACHE_KEY, venues, { ex: CACHE_TTL });
  }
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
