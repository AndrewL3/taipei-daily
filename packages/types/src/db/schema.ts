import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  date,
  unique,
} from "drizzle-orm/pg-core";

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  lineId: text("line_id").notNull().unique(),
  lineName: text("line_name").notNull(),
  city: text("city").notNull(),
});

export const stops = pgTable(
  "stops",
  {
    id: serial("id").primaryKey(),
    routeLineId: text("route_line_id")
      .notNull()
      .references(() => routes.lineId),
    rank: integer("rank").notNull(),
    name: text("name").notNull(),
    village: text("village").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    scheduledTime: text("scheduled_time").notNull(),
    memo: text("memo").notNull().default(""),
    garbageDays: boolean("garbage_days").array().notNull(),
    recyclingDays: boolean("recycling_days").array().notNull(),
    foodscrapsDays: boolean("foodscraps_days").array().notNull(),
  },
  (t) => [unique().on(t.routeLineId, t.rank)],
);

export const passEvents = pgTable(
  "pass_events",
  {
    id: serial("id").primaryKey(),
    routeLineId: text("route_line_id")
      .notNull()
      .references(() => routes.lineId),
    stopRank: integer("stop_rank").notNull(),
    car: text("car").notNull(),
    passedAt: timestamp("passed_at", { withTimezone: true }).notNull(),
    routeDate: date("route_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.routeLineId, t.stopRank, t.car, t.routeDate)],
);
