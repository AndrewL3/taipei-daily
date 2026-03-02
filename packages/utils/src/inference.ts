import { haversineMeters } from "./geo.js";
import { parseNtcTimestamp, toTaipeiDateString } from "./time.js";

const PROXIMITY_THRESHOLD_M = 50;

export interface StopCoord {
  rank: number;
  latitude: number;
  longitude: number;
}

export interface VehiclePosition {
  car: string;
  latitude: number;
  longitude: number;
  time: string;
}

export interface InferenceInput {
  lineId: string;
  stops: StopCoord[];
  vehicles: VehiclePosition[];
  redisState: Record<string, number>;
}

export interface PassEventRecord {
  routeLineId: string;
  stopRank: number;
  car: string;
  passedAt: Date;
  routeDate: string;
}

export interface InferenceResult {
  passEvents: PassEventRecord[];
  redisUpdates: Record<string, number>;
}

export function inferPassEvents(input: InferenceInput): InferenceResult {
  const { lineId, stops, vehicles, redisState } = input;
  const passEvents: PassEventRecord[] = [];
  const redisUpdates: Record<string, number> = {};

  if (stops.length === 0) return { passEvents, redisUpdates };

  for (const vehicle of vehicles) {
    const redisKey = `sync:${lineId}:${vehicle.car}`;
    const originalRank = redisState[redisKey] ?? 0;
    let lastRank = originalRank;
    const vTime = parseNtcTimestamp(vehicle.time);
    const routeDate = toTaipeiDateString(vTime);

    // Find the highest-rank stop the truck is currently near
    let detectedRank: number | null = null;
    for (const stop of stops) {
      if (stop.rank <= lastRank) continue;

      const dist = haversineMeters(
        vehicle.latitude,
        vehicle.longitude,
        stop.latitude,
        stop.longitude,
      );

      if (dist <= PROXIMITY_THRESHOLD_M) {
        detectedRank = stop.rank;
      }
    }

    // Backfill: if truck detected at rank N, all stops from lastRank+1..N
    // must have been passed (monotonic progress along the route)
    if (detectedRank !== null) {
      for (const stop of stops) {
        if (stop.rank <= lastRank) continue;
        if (stop.rank > detectedRank) break;

        passEvents.push({
          routeLineId: lineId,
          stopRank: stop.rank,
          car: vehicle.car,
          passedAt: vTime,
          routeDate,
        });
      }
      lastRank = detectedRank;
    }

    if (lastRank > originalRank) {
      redisUpdates[redisKey] = lastRank;
    }
  }

  return { passEvents, redisUpdates };
}
