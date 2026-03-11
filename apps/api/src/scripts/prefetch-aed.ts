/**
 * Build-time script: fetch MOHW AED CSV and save as local JSON.
 * MOHW's server is unreachable from Vercel Lambda (TCP timeout),
 * so we prefetch during build when network routing may differ.
 * Non-fatal: exits 0 even on failure to avoid breaking the build.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import {
  AedCsvRowArraySchema,
  groupAedsIntoVenues,
} from "@tracker/types";
import { parseCsv } from "../data-sources/aed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/aed-venues.json");
const AED_CSV_URL = "https://tw-aed.mohw.gov.tw/openData?t=csv";
const GREATER_TAIPEI_CITIES = new Set(["臺北市", "新北市"]);

function fetchCsv(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { rejectUnauthorized: false, timeout: 30_000 },
      (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf-8")),
        );
        response.on("error", reject);
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Connection timed out"));
    });
  });
}

async function main() {
  try {
    console.log("[prefetch-aed] Fetching MOHW AED CSV...");
    const text = await fetchCsv(AED_CSV_URL);
    const rawRows = parseCsv(text);
    const parsed = AedCsvRowArraySchema.parse(rawRows);
    const taipeiRows = parsed.filter((r) =>
      GREATER_TAIPEI_CITIES.has(r.場所縣市),
    );
    const venues = groupAedsIntoVenues(taipeiRows);

    mkdirSync(dirname(OUT_PATH), { recursive: true });
    writeFileSync(OUT_PATH, JSON.stringify(venues));
    console.log(
      `[prefetch-aed] Wrote ${venues.length} venues to aed-venues.json`,
    );
  } catch (err) {
    console.warn(
      "[prefetch-aed] Failed to fetch AED data (non-fatal):",
      err instanceof Error ? err.message : err,
    );
    // Non-fatal — the existing JSON (if any) will be used as fallback
  }
}

main();
