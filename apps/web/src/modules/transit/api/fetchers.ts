import { apiFetch } from "@/api/client";
import type { BusStation, BusArrival, MapBounds } from "./types";

export async function fetchBusStations(
  bounds: MapBounds,
): Promise<BusStation[]> {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
  });
  const json = await apiFetch<{ ok: true; stations: BusStation[] }>(
    `/api/transit/stops?${params}`,
  );
  return json.stations;
}

export async function fetchStationArrivals(
  stationId: string,
  city: string,
): Promise<BusArrival[]> {
  const params = new URLSearchParams({ stationId, city });
  const json = await apiFetch<{ ok: true; arrivals: BusArrival[] }>(
    `/api/transit/arrivals?${params}`,
  );
  return json.arrivals;
}
