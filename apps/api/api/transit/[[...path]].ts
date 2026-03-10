import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleStops } from "../../src/transit/stops.js";
import { handleArrivals } from "../../src/transit/arrivals.js";
import { handleRoute } from "../../src/transit/route.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const pathParam = req.query.path;
  const segments = Array.isArray(pathParam)
    ? pathParam
    : pathParam
      ? [pathParam]
      : [];
  const action = segments[0] ?? "";

  switch (action) {
    case "stops":
      return handleStops(req, res);
    case "arrivals":
      return handleArrivals(req, res);
    case "route":
      return handleRoute(req, res);
    default:
      return res.status(404).json({ ok: false, error: "Not found" });
  }
}
