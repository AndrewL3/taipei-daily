import { describe, expect, it } from "@jest/globals";
import {
  NtcParkingSpaceRawSchema,
  NtcParkingSpaceRawArraySchema,
  groupSpacesIntoRoadSegments,
} from "../parking.js";

describe("NtcParkingSpaceRawSchema", () => {
  const validSpace = {
    ID: "155355",
    CELLID: "0.0",
    NAME: "汽車停車位",
    DAY: "週一-週五",
    HOUR: "07:00-20:00",
    PAY: "計時收費",
    PAYCASH: "30元/時",
    MEMO: "",
    ROADID: "T63",
    ROADNAME: "建一路",
    CELLSTATUS: "Y",
    ISNOWCASH: "false",
    ParkingStatus: "1",
    latitude: "25.001812",
    longitude: "121.487941",
    CountyCode: "65000",
    AreaCode: "65000030",
  };

  it("parses a valid raw space with coerced lat/lon", () => {
    const result = NtcParkingSpaceRawSchema.parse(validSpace);
    expect(result.latitude).toBe(25.001812);
    expect(result.longitude).toBe(121.487941);
    expect(result.ROADID).toBe("T63");
    expect(result.NAME).toBe("汽車停車位");
  });

  it("parses an array of spaces", () => {
    const result = NtcParkingSpaceRawArraySchema.parse([
      validSpace,
      validSpace,
    ]);
    expect(result).toHaveLength(2);
  });

  it("rejects missing required fields", () => {
    expect(() => NtcParkingSpaceRawSchema.parse({ ID: "1" })).toThrow();
  });
});

describe("groupSpacesIntoRoadSegments", () => {
  const makeSpace = (
    roadId: string,
    roadName: string,
    lat: number,
    lon: number,
    cellStatus: string,
    parkingStatus: string,
  ) => ({
    ID: Math.random().toString(),
    CELLID: "0",
    NAME: "汽車停車位",
    DAY: "週一-週五",
    HOUR: "07:00-20:00",
    PAY: "計時收費",
    PAYCASH: "30元/時",
    MEMO: "",
    ROADID: roadId,
    ROADNAME: roadName,
    CELLSTATUS: cellStatus,
    ISNOWCASH: "false",
    ParkingStatus: parkingStatus,
    latitude: lat,
    longitude: lon,
    CountyCode: "65000",
    AreaCode: "65000030",
  });

  it("groups spaces by ROADID", () => {
    const spaces = [
      makeSpace("T63", "建一路", 25.001, 121.487, "Y", "1"),
      makeSpace("T63", "建一路", 25.002, 121.488, "Y", "3"),
      makeSpace("T99", "中華路", 25.01, 121.5, "Y", "1"),
    ];
    const segments = groupSpacesIntoRoadSegments(spaces);
    expect(segments).toHaveLength(2);
  });

  it("counts available spaces (CELLSTATUS=Y and ParkingStatus=1)", () => {
    const spaces = [
      makeSpace("T63", "建一路", 25.001, 121.487, "Y", "1"),
      makeSpace("T63", "建一路", 25.002, 121.488, "Y", "3"),
      makeSpace("T63", "建一路", 25.003, 121.489, "N", "1"),
    ];
    const segments = groupSpacesIntoRoadSegments(spaces);
    expect(segments[0].totalSpaces).toBe(3);
    expect(segments[0].availableSpaces).toBe(1);
  });

  it("computes center coordinates as average of space positions", () => {
    const spaces = [
      makeSpace("T63", "建一路", 25.0, 121.0, "Y", "1"),
      makeSpace("T63", "建一路", 25.1, 121.1, "Y", "1"),
    ];
    const segments = groupSpacesIntoRoadSegments(spaces);
    expect(segments[0].latitude).toBeCloseTo(25.05, 5);
    expect(segments[0].longitude).toBeCloseTo(121.05, 5);
  });

  it("uses first space for road metadata (pricing, hours, days)", () => {
    const spaces = [makeSpace("T63", "建一路", 25.0, 121.0, "Y", "1")];
    const segments = groupSpacesIntoRoadSegments(spaces);
    expect(segments[0].pricing).toBe("30元/時");
    expect(segments[0].hours).toBe("07:00-20:00");
    expect(segments[0].days).toBe("週一-週五");
  });

  it("returns empty array for empty input", () => {
    expect(groupSpacesIntoRoadSegments([])).toEqual([]);
  });
});
