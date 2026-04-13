import { eq, asc, isNull } from "drizzle-orm";
import { db } from "../db.js";
import { routes, stops } from "@tracker/types/db";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const RATE_LIMIT_MS = 1100; // slightly over 1s to be courteous

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface OsrmResponse {
  code: string;
  routes: { geometry: string }[];
}

async function fetchGeometry(
  waypoints: { lon: number; lat: number }[],
): Promise<string | null> {
  const coords = waypoints.map((w) => `${w.lon},${w.lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=polyline6`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`OSRM error ${res.status}: ${await res.text()}`);
    return null;
  }

  const data = (await res.json()) as OsrmResponse;
  if (data.code !== "Ok" || !data.routes?.[0]?.geometry) {
    console.error(`OSRM returned code: ${data.code}`);
    return null;
  }

  return data.routes[0].geometry;
}

async function main() {
  // Get routes without geometry
  const routeRows = await db
    .select({ lineId: routes.lineId, lineName: routes.lineName })
    .from(routes)
    .where(isNull(routes.geometry))
    .orderBy(asc(routes.lineId));

  console.log(`Found ${routeRows.length} routes without geometry.`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < routeRows.length; i++) {
    const route = routeRows[i];
    const stopRows = await db
      .select({ longitude: stops.longitude, latitude: stops.latitude })
      .from(stops)
      .where(eq(stops.routeLineId, route.lineId))
      .orderBy(asc(stops.rank));

    if (stopRows.length < 2) {
      console.log(
        `[${i + 1}/${routeRows.length}] ${route.lineName} — skipped (< 2 stops)`,
      );
      continue;
    }

    const waypoints = stopRows.map((s) => ({
      lon: s.longitude,
      lat: s.latitude,
    }));

    const geometry = await fetchGeometry(waypoints);

    if (geometry) {
      await db
        .update(routes)
        .set({ geometry })
        .where(eq(routes.lineId, route.lineId));
      success++;
      console.log(
        `[${i + 1}/${routeRows.length}] ${route.lineName} — OK (${geometry.length} chars)`,
      );
    } else {
      failed++;
      console.log(`[${i + 1}/${routeRows.length}] ${route.lineName} — FAILED`);
    }

    // Rate limit between requests
    if (i < routeRows.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
