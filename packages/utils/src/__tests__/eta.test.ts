import { describe, expect, it } from "@jest/globals";
import { computeEtaDelta, type RouteStop, type PassEvent } from "../eta.js";

const makeStop = (rank: number, scheduledTime: string): RouteStop => ({
  rank,
  name: `Stop ${rank}`,
  village: "村里",
  scheduledTime,
  garbageDays: [true, true, true, true, true, true, true],
  recyclingDays: [false, false, false, false, false, false, false],
  foodscrapsDays: [false, false, false, false, false, false, false],
});

describe("computeEtaDelta", () => {
  const today = "2026-03-01"; // Sunday (dow = 0)
  const dow = 0;

  it("returns inactive status when no pass events exist", () => {
    const stops = [makeStop(1, "15:30"), makeStop(2, "15:35")];
    const result = computeEtaDelta(stops, [], today, dow);

    expect(result.progress.status).toBe("inactive");
    expect(result.progress.deltaMinutes).toBeNull();
    expect(result.progress.leadingStopRank).toBeNull();
    expect(result.stops[0].passedAt).toBeNull();
    expect(result.stops[0].eta).toBeNull();
    expect(result.stops[0].collectsToday).toEqual(["garbage"]);
  });

  it("computes delta when vehicle is 2 minutes late", () => {
    const stops = [
      makeStop(1, "15:30"),
      makeStop(2, "15:35"),
      makeStop(3, "15:40"),
    ];
    const events: PassEvent[] = [
      {
        stopRank: 1,
        car: "KED-0605",
        passedAt: new Date("2026-03-01T07:32:00.000Z"),
      }, // 15:32 Taipei = +2 min
    ];
    const result = computeEtaDelta(stops, events, today, dow);

    expect(result.progress.status).toBe("active");
    expect(result.progress.deltaMinutes).toBe(2);
    expect(result.progress.leadingStopRank).toBe(1);

    // Stop 1: passed
    expect(result.stops[0].passedAt).toBe("2026-03-01T15:32:00+08:00");
    expect(result.stops[0].eta).toBeNull();

    // Stop 2: ETA = 15:35 + 2min = 15:37
    expect(result.stops[1].passedAt).toBeNull();
    expect(result.stops[1].eta).toBe("2026-03-01T15:37:00+08:00");

    // Stop 3: ETA = 15:40 + 2min = 15:42
    expect(result.stops[2].eta).toBe("2026-03-01T15:42:00+08:00");
  });

  it("uses leading vehicle (highest rank) for delta across multiple cars", () => {
    const stops = [
      makeStop(1, "15:30"),
      makeStop(2, "15:35"),
      makeStop(3, "15:40"),
    ];
    const events: PassEvent[] = [
      {
        stopRank: 1,
        car: "KED-0605",
        passedAt: new Date("2026-03-01T07:32:00.000Z"),
      },
      {
        stopRank: 2,
        car: "KED-0605",
        passedAt: new Date("2026-03-01T07:38:00.000Z"),
      }, // 15:38, +3 min
      {
        stopRank: 1,
        car: "ABC-1234",
        passedAt: new Date("2026-03-01T07:33:00.000Z"),
      }, // behind
    ];
    const result = computeEtaDelta(stops, events, today, dow);

    expect(result.progress.leadingStopRank).toBe(2);
    expect(result.progress.deltaMinutes).toBe(3); // based on stop 2: 15:38 - 15:35

    // Stop 3: ETA = 15:40 + 3 = 15:43
    expect(result.stops[2].eta).toBe("2026-03-01T15:43:00+08:00");
  });

  it("returns completed status when all stops are passed", () => {
    const stops = [makeStop(1, "15:30"), makeStop(2, "15:35")];
    const events: PassEvent[] = [
      {
        stopRank: 1,
        car: "KED-0605",
        passedAt: new Date("2026-03-01T07:30:00.000Z"),
      },
      {
        stopRank: 2,
        car: "KED-0605",
        passedAt: new Date("2026-03-01T07:35:00.000Z"),
      },
    ];
    const result = computeEtaDelta(stops, events, today, dow);

    expect(result.progress.status).toBe("completed");
    expect(result.stops[0].passedAt).not.toBeNull();
    expect(result.stops[1].passedAt).not.toBeNull();
    expect(result.stops[0].eta).toBeNull();
    expect(result.stops[1].eta).toBeNull();
  });

  it("handles negative delta (truck early)", () => {
    const stops = [makeStop(1, "15:30"), makeStop(2, "15:35")];
    const events: PassEvent[] = [
      {
        stopRank: 1,
        car: "KED-0605",
        passedAt: new Date("2026-03-01T07:27:00.000Z"),
      }, // 15:27, -3 min
    ];
    const result = computeEtaDelta(stops, events, today, dow);

    expect(result.progress.deltaMinutes).toBe(-3);
    // Stop 2: ETA = 15:35 - 3 = 15:32
    expect(result.stops[1].eta).toBe("2026-03-01T15:32:00+08:00");
  });

  it("skips ETA for stops with unparseable scheduledTime", () => {
    const stops = [
      makeStop(1, "15:30"),
      { ...makeStop(2, "bad"), scheduledTime: "bad" },
    ];
    const events: PassEvent[] = [
      {
        stopRank: 1,
        car: "KED-0605",
        passedAt: new Date("2026-03-01T07:32:00.000Z"),
      },
    ];
    const result = computeEtaDelta(stops, events, today, dow);

    expect(result.stops[1].eta).toBeNull();
  });
});
