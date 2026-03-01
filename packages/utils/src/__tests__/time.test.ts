import { describe, expect, it } from "@jest/globals";
import {
  parseNtcTimestamp,
  getTaipeiDayOfWeek,
  toTaipeiDateString,
  getNextMidnightTaipei,
  parseScheduleTime,
} from "../time.js";

describe("parseNtcTimestamp", () => {
  it("parses a valid NTC timestamp string", () => {
    const date = parseNtcTimestamp("2026/02/26 14:30:00");
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(1); // 0-indexed → February
    expect(date.getUTCDate()).toBe(26);
    // 14:30 in +08:00 → 06:30 UTC
    expect(date.getUTCHours()).toBe(6);
    expect(date.getUTCMinutes()).toBe(30);
  });

  it("throws on invalid timestamp format", () => {
    expect(() => parseNtcTimestamp("2026-02-26 14:30:00")).toThrow(
      "Invalid NTC timestamp",
    );
  });
});

describe("getTaipeiDayOfWeek", () => {
  it("returns 0 (Sunday) for 2026-03-01", () => {
    // 2026-03-01 is a Sunday
    const date = new Date("2026-03-01T00:00:00+08:00");
    expect(getTaipeiDayOfWeek(date)).toBe(0);
  });

  it("returns 4 (Thursday) for 2026-02-26", () => {
    // 2026-02-26 is a Thursday
    const date = new Date("2026-02-26T12:00:00+08:00");
    expect(getTaipeiDayOfWeek(date)).toBe(4);
  });
});

describe("toTaipeiDateString", () => {
  it("returns YYYY-MM-DD in Asia/Taipei timezone", () => {
    // 2026-02-28T23:30:00+08:00 is still Feb 28 in Taipei
    const d = new Date("2026-02-28T23:30:00+08:00");
    expect(toTaipeiDateString(d)).toBe("2026-02-28");
  });

  it("handles date boundary — UTC is next day but Taipei is still today", () => {
    // 2026-02-28T20:00:00+08:00 = 2026-02-28T12:00:00Z
    const d = new Date("2026-02-28T20:00:00+08:00");
    expect(toTaipeiDateString(d)).toBe("2026-02-28");
  });

  it("handles date boundary — Taipei crosses to next day", () => {
    // 2026-02-28T16:30:00Z = 2026-03-01T00:30:00+08:00
    const d = new Date("2026-02-28T16:30:00Z");
    expect(toTaipeiDateString(d)).toBe("2026-03-01");
  });
});

describe("getNextMidnightTaipei", () => {
  it("returns a Unix timestamp after the input date", () => {
    const now = new Date("2026-02-28T15:00:00+08:00");
    const midnight = getNextMidnightTaipei(now);
    expect(midnight).toBeGreaterThan(Math.floor(now.getTime() / 1000));
  });

  it("returns midnight of the same day in Taipei time", () => {
    const now = new Date("2026-02-28T15:00:00+08:00");
    const midnight = getNextMidnightTaipei(now);
    // Midnight 2026-03-01T00:00:00+08:00 = 2026-02-28T16:00:00Z
    expect(midnight).toBe(
      Math.floor(new Date("2026-02-28T16:00:00Z").getTime() / 1000),
    );
  });

  it("if called exactly at midnight, returns next midnight (24h later)", () => {
    const now = new Date("2026-03-01T00:00:00+08:00");
    const midnight = getNextMidnightTaipei(now);
    // Should be 2026-03-02T00:00:00+08:00
    expect(midnight).toBe(
      Math.floor(new Date("2026-03-01T16:00:00Z").getTime() / 1000),
    );
  });
});

describe("parseScheduleTime", () => {
  it("parses HH:MM into a full Date in Asia/Taipei", () => {
    const date = parseScheduleTime("15:30", "2026-03-01");
    // 15:30 in +08:00 → 07:30 UTC
    expect(date.toISOString()).toBe("2026-03-01T07:30:00.000Z");
  });

  it("parses single-digit hour", () => {
    const date = parseScheduleTime("9:05", "2026-03-01");
    // 09:05 in +08:00 → 01:05 UTC
    expect(date.toISOString()).toBe("2026-03-01T01:05:00.000Z");
  });

  it("throws on invalid time format", () => {
    expect(() => parseScheduleTime("invalid", "2026-03-01")).toThrow(
      "Invalid schedule time",
    );
  });

  it("throws on invalid date string", () => {
    expect(() => parseScheduleTime("15:30", "not-a-date")).toThrow(
      "Invalid schedule time",
    );
  });
});
