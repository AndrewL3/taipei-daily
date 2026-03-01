import { describe, expect, it } from "@jest/globals";
import { getCollectsToday } from "../collection.js";

describe("getCollectsToday", () => {
  const allTrue = [true, true, true, true, true, true, true];
  const allFalse = [false, false, false, false, false, false, false];

  it("returns all types when all days are true", () => {
    const result = getCollectsToday(
      { garbageDays: allTrue, recyclingDays: allTrue, foodscrapsDays: allTrue },
      3, // Wednesday
    );
    expect(result).toEqual(["garbage", "recycling", "foodScraps"]);
  });

  it("returns empty array when nothing is collected", () => {
    const result = getCollectsToday(
      { garbageDays: allFalse, recyclingDays: allFalse, foodscrapsDays: allFalse },
      1, // Monday
    );
    expect(result).toEqual([]);
  });

  it("returns only garbage when only garbage is scheduled", () => {
    // Sunday (index 0): garbage only
    const result = getCollectsToday(
      {
        garbageDays: [true, false, false, false, false, false, false],
        recyclingDays: allFalse,
        foodscrapsDays: allFalse,
      },
      0, // Sunday
    );
    expect(result).toEqual(["garbage"]);
  });

  it("uses correct day-of-week index", () => {
    // Saturday (index 6): recycling + foodScraps
    const result = getCollectsToday(
      {
        garbageDays: allFalse,
        recyclingDays: [false, false, false, false, false, false, true],
        foodscrapsDays: [false, false, false, false, false, false, true],
      },
      6, // Saturday
    );
    expect(result).toEqual(["recycling", "foodScraps"]);
  });
});
