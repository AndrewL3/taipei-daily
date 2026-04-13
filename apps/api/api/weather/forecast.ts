import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendInternalError } from "../../src/http.js";
import { getForecastForLocation } from "../../src/weather/forecast.js";

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

    const { townshipName, forecast } = await getForecastForLocation(lat, lon);

    if (!forecast) {
      return res.status(404).json({
        ok: false,
        error: `No forecast found for township: ${townshipName}`,
      });
    }

    return res.status(200).json({ ok: true, forecast });
  } catch (err) {
    return sendInternalError(res, "Weather forecast API error:", err);
  }
}
