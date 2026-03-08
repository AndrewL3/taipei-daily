import { apiFetch } from "@/api/client";
import type { ParkingRoadSegment, MapBounds } from "./types";

export async function fetchParkingSpaces(
  bounds: MapBounds,
): Promise<ParkingRoadSegment[]> {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
  });
  const json = await apiFetch<{ ok: true; segments: ParkingRoadSegment[] }>(
    `/api/parking/spaces?${params}`,
  );
  return json.segments;
}
