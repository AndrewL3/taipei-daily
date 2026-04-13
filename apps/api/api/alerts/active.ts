import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendInternalError } from "../../src/http.js";
import { getActiveAlerts } from "../../src/alerts/active.js";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const alerts = await getActiveAlerts();
    return res.status(200).json({ ok: true, alerts });
  } catch (err) {
    return sendInternalError(res, "Alerts API error:", err);
  }
}
