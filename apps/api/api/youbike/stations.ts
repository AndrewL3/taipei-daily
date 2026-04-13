import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendInternalError } from "../../src/http.js";
import { getYouBikeStationsInBounds } from "../../src/youbike/stations.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const north = parseFloat(req.query.north as string);
    const south = parseFloat(req.query.south as string);
    const east = parseFloat(req.query.east as string);
    const west = parseFloat(req.query.west as string);

    if ([north, south, east, west].some(isNaN)) {
      return res.status(400).json({
        ok: false,
        error: "north, south, east, west query params are required",
      });
    }

    const stations = await getYouBikeStationsInBounds({
      north,
      south,
      east,
      west,
    });

    return res.status(200).json({ ok: true, stations });
  } catch (err) {
    return sendInternalError(res, "YouBike stations API error:", err);
  }
}
