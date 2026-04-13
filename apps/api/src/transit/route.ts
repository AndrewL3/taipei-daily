import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../redis.js";
import { tdxFetch } from "../data-sources/tdx.js";
import { sendInternalError } from "../http.js";
import {
  TdxStopOfRouteRawArraySchema,
  flattenStopsOfRoute,
  TdxBusEtaRawArraySchema,
  TdxBusPositionRawArraySchema,
  TdxBusRouteRawArraySchema,
  type CityKey,
  type TdxStopOfRouteRaw,
  type TdxBusStopRaw,
  type TdxBusEtaRaw,
  type TdxBusPositionRaw,
  type TdxBusRouteRaw,
  type BusRouteDetail,
  type BusRouteStop,
  type BusVehicle,
} from "@tracker/types";

const CACHE_TTL_STATIC = 86400;
const CACHE_TTL_REALTIME = 60;

const VALID_CITIES: Set<string> = new Set(["Taipei", "NewTaipei"]);

const SAFE_ID = /^[A-Za-z0-9_-]+$/;

async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  const data = await fetcher();
  await redis.set(key, data, { ex: ttl });
  return data;
}

export async function handleRoute(req: VercelRequest, res: VercelResponse) {
  try {
    const routeId = req.query.routeId as string | undefined;
    const direction = parseInt(req.query.direction as string) || 0;
    const cityParam = (req.query.city as string) ?? "Taipei";
    if (!VALID_CITIES.has(cityParam)) {
      return res.status(400).json({ ok: false, error: "Invalid city" });
    }
    const city = cityParam as CityKey;

    if (!routeId) {
      return res.status(400).json({
        ok: false,
        error: "routeId query param is required",
      });
    }

    if (!SAFE_ID.test(routeId)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid routeId format",
      });
    }

    if (direction !== 0 && direction !== 1) {
      return res.status(400).json({
        ok: false,
        error: "direction must be 0 or 1",
      });
    }

    // Static data (24h cache): routes + per-route stops -- fetch per-route via $filter
    // Real-time data (60s cache): ETAs + positions -- fetch per-route via $filter
    const [routes, routeStopsRaw, routeEtas, routePositions] = await Promise.all([
      getCached<TdxBusRouteRaw[]>(
        `transit:routes:${city}`,
        CACHE_TTL_STATIC,
        () =>
          tdxFetch<TdxBusRouteRaw[]>(`/v2/Bus/Route/City/${city}`, {
            $select:
              "RouteUID,RouteID,RouteName,DepartureStopNameZh,DepartureStopNameEn,DestinationStopNameZh,DestinationStopNameEn,City,CityCode",
          }).then((r) => TdxBusRouteRawArraySchema.parse(r)),
      ),
      getCached<TdxBusStopRaw[]>(
        `transit:stops:route:${city}:${routeId}`,
        CACHE_TTL_STATIC,
        () =>
          tdxFetch<TdxStopOfRouteRaw[]>(
            `/v2/Bus/StopOfRoute/City/${city}`,
            { $filter: `RouteUID eq '${routeId}'` },
          ).then((r) => flattenStopsOfRoute(TdxStopOfRouteRawArraySchema.parse(r))),
      ),
      getCached<TdxBusEtaRaw[]>(
        `transit:etas:route:${city}:${routeId}`,
        CACHE_TTL_REALTIME,
        () =>
          tdxFetch<TdxBusEtaRaw[]>(
            `/v2/Bus/EstimatedTimeOfArrival/City/${city}`,
            {
              $select:
                "StopUID,StopName,RouteUID,RouteName,Direction,EstimateTime,StopStatus,NextBusTime",
              $filter: `RouteUID eq '${routeId}'`,
            },
          ).then((r) => TdxBusEtaRawArraySchema.parse(r)),
      ),
      getCached<TdxBusPositionRaw[]>(
        `transit:positions:route:${city}:${routeId}`,
        CACHE_TTL_REALTIME,
        () =>
          tdxFetch<TdxBusPositionRaw[]>(
            `/v2/Bus/RealTimeByFrequency/City/${city}`,
            {
              $select:
                "PlateNumb,RouteUID,RouteName,Direction,BusPosition,Speed,DutyStatus,BusStatus",
              $filter: `RouteUID eq '${routeId}'`,
            },
          ).then((r) => TdxBusPositionRawArraySchema.parse(r)),
      ),
    ]);

    // Find route metadata
    const routeMeta = routes.find((r) => r.RouteUID === routeId);
    if (!routeMeta) {
      return res.status(404).json({ ok: false, error: "Route not found" });
    }

    const route: BusRouteDetail = {
      routeId: routeMeta.RouteUID,
      routeName: routeMeta.RouteName.Zh_tw,
      routeNameEn: routeMeta.RouteName.En ?? "",
      departure:
        (direction === 0
          ? routeMeta.DepartureStopNameZh
          : routeMeta.DestinationStopNameZh) ?? "",
      destination:
        (direction === 0
          ? routeMeta.DestinationStopNameZh
          : routeMeta.DepartureStopNameZh) ?? "",
      city: routeMeta.City ?? city,
    };

    // Filter stops by direction (already scoped to route via $filter), sorted by sequence
    const routeStops = routeStopsRaw
      .filter((s) => s.Direction === direction)
      .sort((a, b) => a.StopSequence - b.StopSequence);

    // Build ETA lookup: StopUID -> ETA entry
    const etaMap = new Map<string, TdxBusEtaRaw>();
    for (const e of routeEtas) {
      if (e.Direction === direction) {
        etaMap.set(e.StopUID, e);
      }
    }

    const stops: BusRouteStop[] = routeStops.map((s) => {
      const eta = etaMap.get(s.StopUID);
      return {
        stopId: s.StopUID,
        name: s.StopName.Zh_tw,
        nameEn: s.StopName.En ?? "",
        lat: s.StopPosition.PositionLat,
        lon: s.StopPosition.PositionLon,
        sequence: s.StopSequence,
        estimateMinutes:
          eta?.EstimateTime != null ? Math.round(eta.EstimateTime / 60) : null,
        stopStatus: eta?.StopStatus ?? 4,
      };
    });

    // Filter bus positions for this route + direction
    const buses: BusVehicle[] = routePositions
      .filter(
        (p) =>
          p.Direction === direction &&
          (p.DutyStatus === 0 || p.DutyStatus === 1),
      )
      .map((p) => ({
        plateNumb: p.PlateNumb,
        lat: p.BusPosition.PositionLat,
        lon: p.BusPosition.PositionLon,
        speed: p.Speed ?? 0,
        nearStopSequence: null,
      }));

    return res.status(200).json({ ok: true, route, stops, buses });
  } catch (err) {
    return sendInternalError(res, "Transit route API error:", err);
  }
}
