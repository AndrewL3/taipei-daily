import { useQuery } from "@tanstack/react-query";
import { fetchNearbyStops, fetchRouteList, fetchRouteDetail } from "./client";

/** Round to 4 decimals (~11m) to prevent cache key explosion on map pan */
function snap(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

export function useNearbyStops(
  lat: number | null,
  lon: number | null,
  radius = 500,
) {
  const sLat = lat !== null ? snap(lat) : null;
  const sLon = lon !== null ? snap(lon) : null;

  return useQuery({
    queryKey: ["stops", sLat, sLon, radius],
    queryFn: () => fetchNearbyStops(sLat!, sLon!, radius),
    enabled: sLat !== null && sLon !== null,
    staleTime: 30_000,
  });
}

export function useRouteDetail(lineId: string | undefined) {
  return useQuery({
    queryKey: ["route", lineId],
    queryFn: () => fetchRouteDetail(lineId!),
    enabled: !!lineId,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}

export function useRouteList() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: fetchRouteList,
    staleTime: 60_000,
  });
}
