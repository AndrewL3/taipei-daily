import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchParkingSpaces } from "./fetchers";
import type { MapBounds } from "./types";

function snap(n: number): number {
  return Math.round(n * 1_000) / 1_000;
}

export function useParkingSpaces(bounds: MapBounds | null) {
  const snapped = bounds
    ? {
        north: snap(bounds.north),
        south: snap(bounds.south),
        east: snap(bounds.east),
        west: snap(bounds.west),
      }
    : null;

  return useQuery({
    queryKey: ["parking-spaces", snapped],
    queryFn: () => fetchParkingSpaces(snapped!),
    enabled: snapped !== null,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
