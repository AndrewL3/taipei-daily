import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../../src/redis.js";
import { sendInternalError } from "../../src/http.js";
import {
  NtcParkingSpaceRawArraySchema,
  groupSpacesIntoRoadSegments,
  type ParkingRoadSegment,
} from "@tracker/types";

const CACHE_KEY = "parking:spaces";
const CACHE_TTL = 120; // 2 minutes (matches NTC update frequency)

const NTC_PARKING_API =
  "https://data.ntpc.gov.tw/api/datasets/54A507C4-C038-41B5-BF60-BBECB9D052C6/json";

async function fetchAllSpaces(): Promise<ParkingRoadSegment[]> {
  const allRaw = [];
  let page = 0;
  const size = 1000;

  while (true) {
    const res = await fetch(`${NTC_PARKING_API}?page=${page}&size=${size}`);
    const data = await res.json();
    const parsed = NtcParkingSpaceRawArraySchema.parse(data);
    if (parsed.length === 0) break;
    allRaw.push(...parsed);
    page++;
  }

  return groupSpacesIntoRoadSegments(allRaw);
}

async function getAllSegments(): Promise<ParkingRoadSegment[]> {
  const cached = await redis.get<ParkingRoadSegment[]>(CACHE_KEY);
  if (cached) return cached;

  const segments = await fetchAllSpaces();
  await redis.set(CACHE_KEY, segments, { ex: CACHE_TTL });
  return segments;
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

    const all = await getAllSegments();
    const segments = all.filter(
      (s) =>
        s.latitude >= south &&
        s.latitude <= north &&
        s.longitude >= west &&
        s.longitude <= east,
    );

    return res.status(200).json({ ok: true, segments });
  } catch (err) {
    return sendInternalError(res, "Parking spaces API error:", err);
  }
}
