import { parseScheduleTime } from "./time.js";
import { getCollectsToday, type CollectionType } from "./collection.js";

export interface RouteStop {
  rank: number;
  name: string;
  village: string;
  scheduledTime: string;
  garbageDays: boolean[];
  recyclingDays: boolean[];
  foodscrapsDays: boolean[];
}

export interface PassEvent {
  stopRank: number;
  car: string;
  passedAt: Date;
}

export interface AnnotatedStop {
  rank: number;
  name: string;
  village: string;
  scheduledTime: string;
  collectsToday: CollectionType[];
  passedAt: string | null;
  eta: string | null;
}

export interface RouteProgress {
  leadingStopRank: number | null;
  totalStops: number;
  deltaMinutes: number | null;
  status: "active" | "completed" | "inactive";
}

export interface EtaResult {
  stops: AnnotatedStop[];
  progress: RouteProgress;
}

function formatTaipei(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  // Convert to Taipei by adding 8 hours to UTC
  const taipei = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const y = taipei.getUTCFullYear();
  const mo = pad(taipei.getUTCMonth() + 1);
  const d = pad(taipei.getUTCDate());
  const h = pad(taipei.getUTCHours());
  const mi = pad(taipei.getUTCMinutes());
  const s = pad(taipei.getUTCSeconds());
  return `${y}-${mo}-${d}T${h}:${mi}:${s}+08:00`;
}

export function computeEtaDelta(
  stops: RouteStop[],
  passEvents: PassEvent[],
  todayDateStr: string,
  dayOfWeek: number,
): EtaResult {
  // Build a map of stopRank → leading passedAt (latest timestamp if multiple cars)
  const passedMap = new Map<number, Date>();
  for (const evt of passEvents) {
    const existing = passedMap.get(evt.stopRank);
    if (!existing || evt.passedAt > existing) {
      passedMap.set(evt.stopRank, evt.passedAt);
    }
  }

  // Find the leading stop rank (highest rank with a pass event)
  let leadingStopRank: number | null = null;
  let leadingPassedAt: Date | null = null;

  for (const evt of passEvents) {
    if (leadingStopRank === null || evt.stopRank > leadingStopRank) {
      leadingStopRank = evt.stopRank;
      leadingPassedAt = evt.passedAt;
    } else if (
      evt.stopRank === leadingStopRank &&
      evt.passedAt > leadingPassedAt!
    ) {
      leadingPassedAt = evt.passedAt;
    }
  }

  // Compute delta
  let deltaMs: number | null = null;
  let deltaMinutes: number | null = null;

  if (leadingStopRank !== null && leadingPassedAt !== null) {
    const leadingStop = stops.find((s) => s.rank === leadingStopRank);
    if (leadingStop) {
      try {
        const scheduled = parseScheduleTime(
          leadingStop.scheduledTime,
          todayDateStr,
        );
        deltaMs = leadingPassedAt.getTime() - scheduled.getTime();
        deltaMinutes = Math.round(deltaMs / 60_000);
      } catch {
        // If scheduledTime is unparseable, no delta
      }
    }
  }

  // Determine status
  const allPassed =
    stops.length > 0 && stops.every((s) => passedMap.has(s.rank));
  const status: RouteProgress["status"] =
    passEvents.length === 0 ? "inactive" : allPassed ? "completed" : "active";

  // Annotate stops
  const annotatedStops: AnnotatedStop[] = stops.map((stop) => {
    const passed = passedMap.get(stop.rank);
    const collectsToday = getCollectsToday(stop, dayOfWeek);

    let eta: string | null = null;
    if (!passed && deltaMs !== null) {
      try {
        const scheduled = parseScheduleTime(stop.scheduledTime, todayDateStr);
        const etaDate = new Date(scheduled.getTime() + deltaMs);
        eta = formatTaipei(etaDate);
      } catch {
        // Unparseable scheduledTime → eta stays null
      }
    }

    return {
      rank: stop.rank,
      name: stop.name,
      village: stop.village,
      scheduledTime: stop.scheduledTime,
      collectsToday,
      passedAt: passed ? formatTaipei(passed) : null,
      eta,
    };
  });

  return {
    stops: annotatedStops,
    progress: {
      leadingStopRank,
      totalStops: stops.length,
      deltaMinutes,
      status,
    },
  };
}
