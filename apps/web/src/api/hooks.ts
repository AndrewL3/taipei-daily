import { useQuery } from "@tanstack/react-query";
import { fetchNearbyStops, fetchRouteList, fetchRouteDetail } from "./client";

export function useNearbyStops(
  lat: number | null,
  lon: number | null,
  radius = 500,
) {
  return useQuery({
    queryKey: ["stops", lat, lon, radius],
    queryFn: () => fetchNearbyStops(lat!, lon!, radius),
    enabled: lat !== null && lon !== null,
  });
}

export function useRouteDetail(lineId: string | undefined) {
  return useQuery({
    queryKey: ["route", lineId],
    queryFn: () => fetchRouteDetail(lineId!),
    enabled: !!lineId,
    refetchInterval: 60_000,
  });
}

export function useRouteList() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: fetchRouteList,
    staleTime: 60_000,
  });
}
