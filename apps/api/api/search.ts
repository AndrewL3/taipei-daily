import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendInternalError } from "../src/http.js";
import {
  getSearchResults,
  normalizeSearchQuery,
} from "../src/search/results.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const q = normalizeSearchQuery(req.query.q as string | undefined);
    if (!q || q.length < 1) {
      return res.status(200).json({ ok: true, results: [] });
    }

    const results = await getSearchResults(q);

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    return sendInternalError(res, "Search API error:", err);
  }
}
