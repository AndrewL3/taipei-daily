import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../../src/redis.js";
import {
  fetchNcdrFeed,
  preFilterEntries,
  fetchCapFile,
} from "../../src/data-sources/ncdr.js";
import { filterAlertsByArea, type ActiveAlert } from "@tracker/types";

const CACHE_KEY = "alerts:active";
const CACHE_TTL = 300; // 5 minutes

const TAIPEI_PREFIXES = ["63", "65"];

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const cached = await redis.get<ActiveAlert[]>(CACHE_KEY);
    if (cached) {
      return res.status(200).json({ ok: true, alerts: cached });
    }

    // 1. Fetch NCDR JSON feed
    const entries = await fetchNcdrFeed();

    // 2. Pre-filter by summary text (Greater Taipei keywords)
    const relevant = preFilterEntries(entries);

    // 3. Fetch and parse CAP XML for each relevant entry
    const capPromises = relevant.map((e) => fetchCapFile(e.link["@href"]));
    const capResults = await Promise.all(capPromises);
    const parsed = capResults.filter((a): a is ActiveAlert => a !== null);

    // 4. Final filter by geocode (Taipei 63, New Taipei 65)
    const alerts = filterAlertsByArea(parsed, TAIPEI_PREFIXES);

    // 5. Cache and return
    await redis.set(CACHE_KEY, alerts, { ex: CACHE_TTL });
    return res.status(200).json({ ok: true, alerts });
  } catch (err) {
    console.error("Alerts API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, error: message });
  }
}
