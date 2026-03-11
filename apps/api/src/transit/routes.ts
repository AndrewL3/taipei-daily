import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../redis.js";
import { tdxFetch } from "../data-sources/tdx.js";
import {
  TdxBusRouteRawArraySchema,
  type TdxBusRouteRaw,
  type BusRouteDetail,
  type CityKey,
} from "@tracker/types";

const CACHE_TTL = 86400; // 24h

const CITIES: CityKey[] = ["Taipei", "NewTaipei"];

function cacheKey(city: CityKey): string {
  return `transit:routes:${city}`;
}

async function fetchCityRoutes(city: CityKey): Promise<TdxBusRouteRaw[]> {
  const cached = await redis.get<TdxBusRouteRaw[]>(cacheKey(city));
  if (cached) return cached;

  const raw = await tdxFetch<TdxBusRouteRaw[]>(
    `/v2/Bus/Route/City/${city}`,
    {
      $select:
        "RouteUID,RouteID,RouteName,DepartureStopNameZh,DepartureStopNameEn,DestinationStopNameZh,DestinationStopNameEn,City,CityCode",
    },
  );
  const parsed = TdxBusRouteRawArraySchema.parse(raw);
  await redis.set(cacheKey(city), parsed, { ex: CACHE_TTL });
  return parsed;
}

function transformRoutes(
  raw: TdxBusRouteRaw[],
  city: CityKey,
): BusRouteDetail[] {
  return raw.map((r) => ({
    routeId: r.RouteUID,
    routeName: r.RouteName.Zh_tw,
    routeNameEn: r.RouteName.En ?? "",
    departure: r.DepartureStopNameZh ?? "",
    destination: r.DestinationStopNameZh ?? "",
    city,
  }));
}

export async function handleRoutes(_req: VercelRequest, res: VercelResponse) {
  try {
    const results = await Promise.all(
      CITIES.map(async (city) => {
        const raw = await fetchCityRoutes(city);
        return transformRoutes(raw, city);
      }),
    );
    const routes = results.flat();
    return res.status(200).json({ ok: true, routes });
  } catch (err) {
    console.error("Transit routes API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
