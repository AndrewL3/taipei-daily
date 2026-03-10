import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchAedVenues } from "./fetchers";
import type { MapBounds } from "./types";

function snap(n: number): number {
  return Math.round(n * 1_000) / 1_000;
}

export function useAedVenues(bounds: MapBounds | null) {
  const snapped = bounds
    ? {
        north: snap(bounds.north),
        south: snap(bounds.south),
        east: snap(bounds.east),
        west: snap(bounds.west),
      }
    : null;

  return useQuery({
    queryKey: ["aed-venues", snapped],
    queryFn: () => fetchAedVenues(snapped!),
    enabled: snapped !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
