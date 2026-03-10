import { apiFetch } from "@/api/client";
import type { AedVenue, MapBounds } from "./types";

export async function fetchAedVenues(bounds: MapBounds): Promise<AedVenue[]> {
  const params = new URLSearchParams({
    type: "aed",
    north: bounds.north.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    west: bounds.west.toString(),
  });
  const data = await apiFetch<{ ok: boolean; venues: AedVenue[] }>(
    `/api/facilities?${params}`,
  );
  return data.venues;
}
