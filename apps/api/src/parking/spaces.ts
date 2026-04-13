import { redis } from "../redis.js";
import {
  NtcParkingSpaceRawArraySchema,
  groupSpacesIntoRoadSegments,
  type ParkingRoadSegment,
} from "@tracker/types";

const CACHE_KEY = "parking:spaces";
const CACHE_TTL = 120; // 2 minutes (matches NTC update frequency)

const NTC_PARKING_API =
  "https://data.ntpc.gov.tw/api/datasets/54A507C4-C038-41B5-BF60-BBECB9D052C6/json";

async function fetchAllSegments(): Promise<ParkingRoadSegment[]> {
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

  const segments = await fetchAllSegments();
  await redis.set(CACHE_KEY, segments, { ex: CACHE_TTL });
  return segments;
}

export interface ParkingBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function getParkingRoadSegmentsInBounds({
  north,
  south,
  east,
  west,
}: ParkingBounds): Promise<ParkingRoadSegment[]> {
  const all = await getAllSegments();

  return all.filter(
    (segment) =>
      segment.latitude >= south &&
      segment.latitude <= north &&
      segment.longitude >= west &&
      segment.longitude <= east,
  );
}
