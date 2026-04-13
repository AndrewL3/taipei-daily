import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fetchLiveGps } from "../ntc-client.js";

// Mock global fetch
const mockFetch = jest.fn<typeof globalThis.fetch>();
globalThis.fetch = mockFetch;

const GPS_URL =
  "https://data.ntpc.gov.tw/api/datasets/28ab4122-60e1-4065-98e5-abccb69aaca6/json";

describe("fetchLiveGps", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("paginates and validates GPS data", async () => {
    const page0 = [
      {
        lineid: "207001",
        car: "KED-0605",
        time: "2026/02/28 15:00:00",
        location: "somewhere",
        longitude: "121.689",
        latitude: "25.18",
        cityid: "123",
        cityname: "萬里區",
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

    const result = await fetchLiveGps();

    expect(result).toHaveLength(1);
    expect(result[0].car).toBe("KED-0605");
    expect(result[0].longitude).toBe(121.689);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      `${GPS_URL}?page=0&size=1000`,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      `${GPS_URL}?page=1&size=1000`,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("skips invalid records and keeps valid ones", async () => {
    const page0 = [
      {
        lineid: "207001",
        car: "KED-0605",
        time: "2026/02/28 15:00:00",
        location: "ok",
        longitude: "121.689",
        latitude: "25.18",
        cityid: "123",
        cityname: "萬里區",
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

    const result = await fetchLiveGps();

    expect(result).toHaveLength(1);
    expect(result[0].car).toBe("KED-0605");
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

    await expect(fetchLiveGps()).rejects.toThrow("NTC GPS API error");
  });
});
