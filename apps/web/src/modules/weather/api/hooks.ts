import { useQuery } from "@tanstack/react-query";
import { fetchWeatherForecast } from "./fetchers";

function snap(n: number): number {
  return Math.round(n * 100) / 100; // ~1km precision for weather
}

export function useWeatherForecast(lat: number | null, lon: number | null) {
  const snappedLat = lat !== null ? snap(lat) : null;
  const snappedLon = lon !== null ? snap(lon) : null;

  return useQuery({
    queryKey: ["weather-forecast", snappedLat, snappedLon],
    queryFn: () => fetchWeatherForecast(snappedLat!, snappedLon!),
    enabled: snappedLat !== null && snappedLon !== null,
    staleTime: 5 * 60_000, // 5 min (weather doesn't change fast)
  });
}
