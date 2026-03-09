import { apiFetch } from "@/api/client";
import type { WeatherForecast } from "./types";

export async function fetchWeatherForecast(
  lat: number,
  lon: number,
): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  const json = await apiFetch<{ ok: true; forecast: WeatherForecast }>(
    `/api/weather/forecast?${params}`,
  );
  return json.forecast;
}
