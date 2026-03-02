import { describe, it, expect } from "@jest/globals";
import { inferPassEvents } from "../inference.js";
import type { InferenceInput } from "../inference.js";

// Stop at rank 1: (25.180000, 121.689000)
// Stop at rank 2: (25.182000, 121.689500)  ~230m from rank 1
// Stop at rank 3: (25.184000, 121.690000)  ~230m from rank 2

const STOPS = [
  { rank: 1, latitude: 25.18, longitude: 121.689 },
  { rank: 2, latitude: 25.182, longitude: 121.6895 },
  { rank: 3, latitude: 25.184, longitude: 121.69 },
];

describe("inferPassEvents", () => {
  it("emits a PassEvent when vehicle is within 50m of a stop", () => {
    const input: InferenceInput = {
      lineId: "207001",
      stops: STOPS,
      vehicles: [
        {
          car: "KED-0605",
          latitude: 25.18001, // ~1m from stop rank 1
          longitude: 121.68901,
          time: "2026/02/28 15:00:00",
        },
      ],
      redisState: {},
    };

    const result = inferPassEvents(input);

    expect(result.passEvents).toHaveLength(1);
    expect(result.passEvents[0]).toMatchObject({
      routeLineId: "207001",
      stopRank: 1,
      car: "KED-0605",
      routeDate: "2026-02-28",
    });
    expect(result.redisUpdates).toEqual({ "sync:207001:KED-0605": 1 });
  });

  it("respects monotonic rule — skips stops at or below lastConfirmedStopRank", () => {
    const input: InferenceInput = {
      lineId: "207001",
      stops: STOPS,
      vehicles: [
        {
          car: "KED-0605",
          latitude: 25.18001, // near stop rank 1
          longitude: 121.68901,
          time: "2026/02/28 15:05:00",
        },
      ],
      redisState: { "sync:207001:KED-0605": 1 },
    };

    const result = inferPassEvents(input);

    expect(result.passEvents).toHaveLength(0);
    expect(result.redisUpdates).toEqual({});
  });

  it("advances through multiple stops in a single tick (backfills intermediate)", () => {
    // Vehicle is near stop rank 3 but lastRank is 0
    // Backfill should create pass events for ranks 1, 2, and 3
    const input: InferenceInput = {
      lineId: "207001",
      stops: STOPS,
      vehicles: [
        {
          car: "KED-0605",
          latitude: 25.18401, // ~1m from stop rank 3
          longitude: 121.69001,
          time: "2026/02/28 15:10:00",
        },
      ],
      redisState: {},
    };

    const result = inferPassEvents(input);

    expect(result.passEvents).toHaveLength(3);
    expect(result.passEvents.map((e) => e.stopRank)).toEqual([1, 2, 3]);
    expect(result.redisUpdates).toEqual({ "sync:207001:KED-0605": 3 });
  });

  it("emits nothing when vehicle is not near any stop", () => {
    const input: InferenceInput = {
      lineId: "207001",
      stops: STOPS,
      vehicles: [
        {
          car: "KED-0605",
          latitude: 25.19, // far from all stops
          longitude: 121.7,
          time: "2026/02/28 15:15:00",
        },
      ],
      redisState: {},
    };

    const result = inferPassEvents(input);

    expect(result.passEvents).toHaveLength(0);
    expect(result.redisUpdates).toEqual({});
  });

  it("handles multiple vehicles independently", () => {
    const input: InferenceInput = {
      lineId: "207001",
      stops: STOPS,
      vehicles: [
        {
          car: "AAA-1111",
          latitude: 25.18001, // near rank 1
          longitude: 121.68901,
          time: "2026/02/28 15:00:00",
        },
        {
          car: "BBB-2222",
          latitude: 25.18401, // near rank 3
          longitude: 121.69001,
          time: "2026/02/28 15:00:00",
        },
      ],
      redisState: { "sync:207001:AAA-1111": 0, "sync:207001:BBB-2222": 2 },
    };

    const result = inferPassEvents(input);

    expect(result.passEvents).toHaveLength(2);
    expect(result.passEvents[0]).toMatchObject({
      car: "AAA-1111",
      stopRank: 1,
    });
    expect(result.passEvents[1]).toMatchObject({
      car: "BBB-2222",
      stopRank: 3,
    });
  });

  it("skips vehicles with no matching stops (unknown route)", () => {
    const input: InferenceInput = {
      lineId: "207001",
      stops: [],
      vehicles: [
        {
          car: "KED-0605",
          latitude: 25.18001,
          longitude: 121.68901,
          time: "2026/02/28 15:00:00",
        },
      ],
      redisState: {},
    };

    const result = inferPassEvents(input);

    expect(result.passEvents).toHaveLength(0);
    expect(result.redisUpdates).toEqual({});
  });
});
