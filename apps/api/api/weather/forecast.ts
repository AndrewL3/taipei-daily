import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redis } from "../../src/redis.js";
import { cwaFetch } from "../../src/data-sources/cwa.js";
import { sendInternalError } from "../../src/http.js";
import {
  CwaForecastResponseSchema,
  transformCwaForecast,
  type CwaForecastResponse,
} from "@tracker/types";
import { findNearestTownship } from "../../src/data/township-centers.js";

const CACHE_TTL = 1800; // 30 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        ok: false,
        error: "lat and lon query params are required",
      });
    }

    // Find nearest township and its CWA dataset
    const township = findNearestTownship(lat, lon);
    const cacheKey = `weather:forecast:${township.datasetId}`;

    // Check cache for the city-level forecast, parse once
    let parsed: CwaForecastResponse;
    const cached = await redis.get<CwaForecastResponse>(cacheKey);

    if (cached) {
      parsed = CwaForecastResponseSchema.parse(cached);
    } else {
      const raw = await cwaFetch<unknown>(township.datasetId);
      parsed = CwaForecastResponseSchema.parse(raw);
      await redis.set(cacheKey, parsed, { ex: CACHE_TTL });
    }

    // Extract the specific township's forecast
    const forecast = transformCwaForecast(parsed, township.name);

    if (!forecast) {
      return res.status(404).json({
        ok: false,
        error: `No forecast found for township: ${township.name}`,
      });
    }

    return res.status(200).json({ ok: true, forecast });
  } catch (err) {
    return sendInternalError(res, "Weather forecast API error:", err);
  }
}
