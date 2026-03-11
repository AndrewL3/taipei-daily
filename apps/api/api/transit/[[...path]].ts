import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleStops } from "../../src/transit/stops.js";
import { handleArrivals } from "../../src/transit/arrivals.js";
import { handleRoute } from "../../src/transit/route.js";
import { handleRoutes } from "../../src/transit/routes.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Parse action from URL path instead of req.query.path, which may not be
  // populated reliably for [[...path]] catch-all routes on Vercel.
  const urlPath = (req.url ?? "").split("?")[0];
  const action = urlPath.replace(/^\/api\/transit\/?/, "").split("/")[0] ?? "";

  switch (action) {
    case "stops":
      return handleStops(req, res);
    case "arrivals":
      return handleArrivals(req, res);
    case "route":
      return handleRoute(req, res);
    case "routes":
      return handleRoutes(req, res);
    default:
      return res.status(404).json({ ok: false, error: "Not found" });
  }
}
