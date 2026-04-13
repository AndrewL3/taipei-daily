import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { routes, stops } from "@tracker/types/db";
import { fetchStaticStops } from "../ntc-stops-client.js";
import type { RouteStop } from "@tracker/types";

const BATCH_SIZE = 500;

async function upsertRoutes(allStops: RouteStop[]) {
  const uniqueRoutes = new Map<
    string,
    { lineId: string; lineName: string; city: string }
  >();
  for (const stop of allStops) {
    if (!uniqueRoutes.has(stop.lineid)) {
      uniqueRoutes.set(stop.lineid, {
        lineId: stop.lineid,
        lineName: stop.linename,
        city: stop.city,
      });
    }
  }

  const routeRows = [...uniqueRoutes.values()];
  let upserted = 0;

  for (let i = 0; i < routeRows.length; i += BATCH_SIZE) {
    const batch = routeRows.slice(i, i + BATCH_SIZE);
    try {
      await db
        .insert(routes)
        .values(batch)
        .onConflictDoUpdate({
          target: routes.lineId,
          set: {
            lineName: sql.raw(`excluded.${routes.lineName.name}`),
            city: sql.raw(`excluded.${routes.city.name}`),
          },
        });
      upserted += batch.length;
    } catch (err) {
      console.error(
        `Failed to upsert routes batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        err,
      );
    }
  }

  return upserted;
}

async function upsertStops(allStops: RouteStop[]) {
  const stopRows = allStops.map((s) => ({
    routeLineId: s.lineid,
    rank: s.rank,
    name: s.name,
    village: s.village,
    longitude: s.longitude,
    latitude: s.latitude,
    scheduledTime: s.scheduledTime,
    memo: s.memo,
    garbageDays: s.garbageDays,
    recyclingDays: s.recyclingDays,
    foodscrapsDays: s.foodscrapsDays,
  }));

  let upserted = 0;

  for (let i = 0; i < stopRows.length; i += BATCH_SIZE) {
    const batch = stopRows.slice(i, i + BATCH_SIZE);
    try {
      await db
        .insert(stops)
        .values(batch)
        .onConflictDoUpdate({
          target: [stops.routeLineId, stops.rank],
          set: {
            name: sql.raw(`excluded.${stops.name.name}`),
            village: sql.raw(`excluded.${stops.village.name}`),
            longitude: sql.raw(`excluded.${stops.longitude.name}`),
            latitude: sql.raw(`excluded.${stops.latitude.name}`),
            scheduledTime: sql.raw(`excluded.${stops.scheduledTime.name}`),
            memo: sql.raw(`excluded.${stops.memo.name}`),
            garbageDays: sql.raw(`excluded.${stops.garbageDays.name}`),
            recyclingDays: sql.raw(`excluded.${stops.recyclingDays.name}`),
            foodscrapsDays: sql.raw(`excluded.${stops.foodscrapsDays.name}`),
          },
        });
      upserted += batch.length;
    } catch (err) {
      console.error(
        `Failed to upsert stops batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        err,
      );
    }
  }

  return upserted;
}

async function main() {
  console.log("Fetching static stops from NTC API...");

  let allStops: RouteStop[];
  try {
    allStops = await fetchStaticStops();
  } catch (err) {
    console.error("Failed to fetch NTC stops:", err);
    process.exit(1);
  }

  console.log(`Fetched ${allStops.length} valid stops.`);

  if (allStops.length === 0) {
    console.log("No stops to insert. Exiting.");
    process.exit(0);
  }

  console.log("Upserting routes...");
  const routeCount = await upsertRoutes(allStops);
  console.log(`Upserted ${routeCount} routes.`);

  console.log("Upserting stops...");
  const stopCount = await upsertStops(allStops);
  console.log(`Upserted ${stopCount} stops.`);

  console.log("Done!");
  process.exit(0);
}

main();
