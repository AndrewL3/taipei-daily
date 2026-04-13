import { redis } from "../redis.js";
import { cwaFetch } from "../data-sources/cwa.js";
import { findNearestTownship } from "../data/township-centers.js";
import {
  CwaForecastResponseSchema,
  transformCwaForecast,
  type CwaForecastResponse,
  type WeatherForecast,
} from "@tracker/types";

const CACHE_TTL = 1800; // 30 minutes

async function getCachedForecastResponse(
  datasetId: string,
): Promise<CwaForecastResponse> {
  const cacheKey = `weather:forecast:${datasetId}`;
  const cached = await redis.get<CwaForecastResponse>(cacheKey);

  if (cached) {
    return CwaForecastResponseSchema.parse(cached);
  }

  const raw = await cwaFetch<unknown>(datasetId);
  const parsed = CwaForecastResponseSchema.parse(raw);
  await redis.set(cacheKey, parsed, { ex: CACHE_TTL });
  return parsed;
}

export interface ForecastLookupResult {
  townshipName: string;
  forecast: WeatherForecast | null;
}

export async function getForecastForLocation(
  lat: number,
  lon: number,
): Promise<ForecastLookupResult> {
  const township = findNearestTownship(lat, lon);
  const parsed = await getCachedForecastResponse(township.datasetId);

  return {
    townshipName: township.name,
    forecast: transformCwaForecast(parsed, township.name),
  };
}
