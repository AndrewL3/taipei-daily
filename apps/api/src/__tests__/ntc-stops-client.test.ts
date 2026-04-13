import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fetchStaticStops } from "../ntc-stops-client.js";

const mockFetch = jest.fn<typeof globalThis.fetch>();
globalThis.fetch = mockFetch;

const STOPS_URL =
  "https://data.ntpc.gov.tw/api/datasets/edc3ad26-8ae7-4916-a00b-bc6048d19bf8/json";

describe("fetchStaticStops", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("paginates, validates, and transforms stop data", async () => {
    const page0 = [
      {
        city: "萬里區",
        lineid: "207001",
        linename: "A路線下午",
        rank: "3",
        name: "瑪鋉路216號",
        village: "萬里里",
        longitude: "121.689041",
        latitude: "25.180643",
        time: "12:48",
        memo: "",
        garbagesunday: "",
        garbagemonday: "Y",
        garbagetuesday: "Y",
        garbagewednesday: "",
        garbagethursday: "Y",
        garbagefriday: "Y",
        garbagesaturday: "Y",
        recyclingsunday: "",
        recyclingmonday: "Y",
        recyclingtuesday: "",
        recyclingwednesday: "",
        recyclingthursday: "Y",
        recyclingfriday: "",
        recyclingsaturday: "",
        foodscrapssunday: "",
        foodscrapsmonday: "Y",
        foodscrapstuesday: "Y",
        foodscrapswednesday: "",
        foodscrapsthursday: "Y",
        foodscrapsfriday: "Y",
        foodscrapssaturday: "Y",
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page0,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

    const result = await fetchStaticStops();

    expect(result).toHaveLength(1);
    expect(result[0].lineid).toBe("207001");
    expect(result[0].rank).toBe(3);
    expect(result[0].longitude).toBe(121.689041);
    expect(result[0].scheduledTime).toBe("12:48");
    expect(result[0].garbageDays).toEqual([
      false,
      true,
      true,
      false,
      true,
      true,
      true,
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      `${STOPS_URL}?page=0&size=1000`,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("skips invalid records", async () => {
    const page0 = [
      {
        city: "萬里區",
        lineid: "207001",
        linename: "A路線下午",
        rank: "1",
        name: "stop1",
        village: "萬里里",
        longitude: "121.689",
        latitude: "25.18",
        time: "12:00",
        memo: "",
        garbagesunday: "",
        garbagemonday: "Y",
        garbagetuesday: "",
        garbagewednesday: "",
        garbagethursday: "",
        garbagefriday: "",
        garbagesaturday: "",
        recyclingsunday: "",
        recyclingmonday: "",
        recyclingtuesday: "",
        recyclingwednesday: "",
        recyclingthursday: "",
        recyclingfriday: "",
        recyclingsaturday: "",
        foodscrapssunday: "",
        foodscrapsmonday: "",
        foodscrapstuesday: "",
        foodscrapswednesday: "",
        foodscrapsthursday: "",
        foodscrapsfriday: "",
        foodscrapssaturday: "",
      },
      { broken: "record" },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page0,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

    const result = await fetchStaticStops();
    expect(result).toHaveLength(1);
  });

  it("throws when fetch fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
        text: async () => "",
      } as Response);

    await expect(fetchStaticStops()).rejects.toThrow("NTC Stops API error");
  });
});
