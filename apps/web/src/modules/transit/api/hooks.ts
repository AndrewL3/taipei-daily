import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchBusStations, fetchStationArrivals, fetchBusRoutes } from "./fetchers";
import type { MapBounds } from "./types";

function snap(n: number): number {
  return Math.round(n * 1_000) / 1_000;
}

export function useBusStations(bounds: MapBounds | null) {
  const snapped = bounds
    ? {
        north: snap(bounds.north),
        south: snap(bounds.south),
        east: snap(bounds.east),
        west: snap(bounds.west),
      }
    : null;

  return useQuery({
    queryKey: ["bus-stations", snapped],
    queryFn: () => fetchBusStations(snapped!),
    enabled: snapped !== null,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useStationArrivals(stationId: string | null, city: string) {
  return useQuery({
    queryKey: ["bus-arrivals", stationId, city],
    queryFn: () => fetchStationArrivals(stationId!, city),
    enabled: stationId !== null,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

export function useBusRoutes() {
  return useQuery({
    queryKey: ["bus-routes"],
    queryFn: fetchBusRoutes,
    staleTime: 5 * 60_000, // 5 min — route catalog is static-ish
  });
}
