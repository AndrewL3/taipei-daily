import { redis } from "../redis.js";
import {
  fetchNcdrFeed,
  preFilterEntries,
  fetchCapFile,
  sanitizeAlertWebUrl,
} from "../data-sources/ncdr.js";
import { filterAlertsByArea, type ActiveAlert } from "@tracker/types";

const CACHE_KEY = "alerts:active";
const CACHE_TTL = 300; // 5 minutes

const TAIPEI_PREFIXES = ["63", "65"];

function sanitizeAlertLinks(alerts: ActiveAlert[]): ActiveAlert[] {
  return alerts.map((alert) => ({
    ...alert,
    web: sanitizeAlertWebUrl(alert.web),
  }));
}

export async function getActiveAlerts(): Promise<ActiveAlert[]> {
  const cached = await redis.get<ActiveAlert[]>(CACHE_KEY);
  if (cached) {
    return sanitizeAlertLinks(cached);
  }

  const entries = await fetchNcdrFeed();
  const relevant = preFilterEntries(entries);
  const capPromises = relevant.map((e) => fetchCapFile(e.link["@href"]));
  const capResults = await Promise.all(capPromises);
  const parsed = capResults.filter((a): a is ActiveAlert => a !== null);

  const alerts = sanitizeAlertLinks(filterAlertsByArea(parsed, TAIPEI_PREFIXES));
  await redis.set(CACHE_KEY, alerts, { ex: CACHE_TTL });
  return alerts;
}
