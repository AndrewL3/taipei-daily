import { describe, expect, it } from "@jest/globals";
import {
  AedCsvRowSchema,
  AedCsvRowArraySchema,
  groupAedsIntoVenues,
} from "../aed.js";

describe("AedCsvRowSchema", () => {
  const validRow = {
    場所ID: "19172",
    場所名稱: "臺東縣長濱鄉衛生所",
    場所縣市: "臺東縣",
    場所區域: "長濱鄉",
    場所地址: "臺東縣長濱鄉長濱村5鄰15號",
    場所分類: "其他",
    場所類型: "其他場所",
    場所描述: "",
    AEDID: "281",
    AED放置地點: "一樓候診區",
    AED地點描述: "放置於衛生所一樓候診區",
    地點LAT: "23.318852",
    地點LNG: "121.453891",
    周一至周五起: "08:00:00",
    周一至周五迄: "17:00:00",
    周六起: "",
    周六迄: "",
    周日起: "",
    周日迄: "",
    開放使用時間備註: "逢例假日及國定假日關閉。",
    開放時間緊急連絡電話: "089-831022",
  };

  it("parses a valid row with coerced lat/lon", () => {
    const result = AedCsvRowSchema.parse(validRow);
    expect(result.地點LAT).toBe(23.318852);
    expect(result.地點LNG).toBe(121.453891);
    expect(result.場所ID).toBe("19172");
    expect(result.AEDID).toBe("281");
  });

  it("parses an array of rows", () => {
    const result = AedCsvRowArraySchema.parse([validRow, validRow]);
    expect(result).toHaveLength(2);
  });

  it("handles empty optional fields", () => {
    const result = AedCsvRowSchema.parse(validRow);
    expect(result.周六起).toBe("");
    expect(result.場所描述).toBe("");
  });

  it("rejects missing required fields", () => {
    expect(() => AedCsvRowSchema.parse({ 場所ID: "1" })).toThrow();
  });
});

describe("groupAedsIntoVenues", () => {
  const makeRow = (
    venueId: string,
    venueName: string,
    city: string,
    aedId: string,
    lat: number,
    lon: number,
  ) => ({
    場所ID: venueId,
    場所名稱: venueName,
    場所縣市: city,
    場所區域: "中正區",
    場所地址: "Test Address",
    場所分類: "其他",
    場所類型: "其他場所",
    場所描述: "",
    AEDID: aedId,
    AED放置地點: "1F",
    AED地點描述: "大廳",
    地點LAT: lat,
    地點LNG: lon,
    周一至周五起: "08:00:00",
    周一至周五迄: "17:00:00",
    周六起: "",
    周六迄: "",
    周日起: "",
    周日迄: "",
    開放使用時間備註: "",
    開放時間緊急連絡電話: "02-12345678",
  });

  it("groups AEDs by venue ID", () => {
    const rows = [
      makeRow("100", "台大醫院", "臺北市", "1", 25.04, 121.52),
      makeRow("100", "台大醫院", "臺北市", "2", 25.041, 121.521),
      makeRow("200", "市政府", "臺北市", "3", 25.05, 121.56),
    ];
    const venues = groupAedsIntoVenues(rows);
    expect(venues).toHaveLength(2);
    expect(venues.find((v) => v.venueId === "100")!.aedCount).toBe(2);
    expect(venues.find((v) => v.venueId === "200")!.aedCount).toBe(1);
  });

  it("computes center coordinates as average of AED positions", () => {
    const rows = [
      makeRow("100", "台大醫院", "臺北市", "1", 25.0, 121.0),
      makeRow("100", "台大醫院", "臺北市", "2", 25.1, 121.1),
    ];
    const venues = groupAedsIntoVenues(rows);
    expect(venues[0].lat).toBeCloseTo(25.05, 5);
    expect(venues[0].lon).toBeCloseTo(121.05, 5);
  });

  it("preserves individual AED details in aeds array", () => {
    const rows = [
      makeRow("100", "台大醫院", "臺北市", "1", 25.04, 121.52),
      makeRow("100", "台大醫院", "臺北市", "2", 25.041, 121.521),
    ];
    const venues = groupAedsIntoVenues(rows);
    expect(venues[0].aeds).toHaveLength(2);
    expect(venues[0].aeds[0].aedId).toBe("1");
    expect(venues[0].aeds[1].aedId).toBe("2");
  });

  it("formats weekday hours as range", () => {
    const rows = [makeRow("100", "台大醫院", "臺北市", "1", 25.04, 121.52)];
    const venues = groupAedsIntoVenues(rows);
    expect(venues[0].aeds[0].weekdayHours).toBe("08:00-17:00");
  });

  it("returns null hours when times are empty", () => {
    const rows = [makeRow("100", "台大醫院", "臺北市", "1", 25.04, 121.52)];
    const venues = groupAedsIntoVenues(rows);
    expect(venues[0].aeds[0].saturdayHours).toBeNull();
    expect(venues[0].aeds[0].sundayHours).toBeNull();
  });

  it("returns empty array for empty input", () => {
    expect(groupAedsIntoVenues([])).toEqual([]);
  });
});
