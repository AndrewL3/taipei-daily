import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

const { getTaipeiGarbageStopsInBounds } = await import(
  "../../src/garbage/taipei-stops.js"
);

describe("getTaipeiGarbageStopsInBounds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("returns filtered stops from cached data", async () => {
    mockRedisGet.mockResolvedValueOnce([
      {
        id: "tpe-1-1-1",
        routeId: "tpe-1-1",
        routeName: "1",
        trip: "1",
        rank: 1,
        district: "中正區",
        village: "幸福里",
        address: "站內地址",
        arrivalTime: "09:00",
        departureTime: "09:05",
        lat: 25.03,
        lon: 121.52,
      },
      {
        id: "tpe-2-1-1",
        routeId: "tpe-2-1",
        routeName: "2",
        trip: "1",
        rank: 1,
        district: "士林區",
        village: "站外里",
        address: "站外地址",
        arrivalTime: "09:30",
        departureTime: "09:35",
        lat: 25.2,
        lon: 121.7,
      },
    ]);

    const stops = await getTaipeiGarbageStopsInBounds({
      north: 25.05,
      south: 25.0,
      east: 121.55,
      west: 121.5,
    });

    expect(stops).toHaveLength(1);
    expect(stops[0].id).toBe("tpe-1-1-1");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it("fetches, parses, caches, and filters stops on a cache miss", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve(`district,village,squad,bureauId,vehicleNumber,route,trip,arrivalTime,departureTime,address,lon,lat
中正區,幸福里,1,A1,ABC-123,1,1,900,905,站內地址,121.52,25.03
士林區,站外里,1,A2,DEF-456,2,1,930,935,站外地址,121.7,25.2`),
    } as any);

    const stops = await getTaipeiGarbageStopsInBounds({
      north: 25.05,
      south: 25.0,
      east: 121.55,
      west: 121.5,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=a6e90031-7ec4-4089-afb5-361a4efe7202",
    );
    expect(stops).toHaveLength(1);
    expect(stops[0]).toEqual(
      expect.objectContaining({
        id: "tpe-1-1-1",
        routeId: "tpe-1-1",
        address: "站內地址",
      }),
    );
    expect(mockRedisSet).toHaveBeenCalledWith(
      "garbage:taipei:stops",
      expect.any(Array),
      { ex: 86400 },
    );
  });
});
