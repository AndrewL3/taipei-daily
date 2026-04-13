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

const { getYouBikeStationsInBounds } = await import("../../src/youbike/stations.js");

describe("getYouBikeStationsInBounds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("returns filtered stations from cached data", async () => {
    mockRedisGet.mockResolvedValueOnce([
      {
        id: "ntc-0001",
        name: "站內",
        nameEn: "Inside",
        district: "板橋區",
        lat: 25.01,
        lon: 121.49,
        totalDocks: 20,
        availableBikes: 8,
        emptyDocks: 12,
        status: "active",
        address: "Address 1",
        city: "ntc",
        updatedAt: "2026-04-13 10:00:00",
      },
      {
        id: "tpe-0002",
        name: "站外",
        nameEn: "Outside",
        district: "大安區",
        lat: 25.2,
        lon: 121.7,
        totalDocks: 18,
        availableBikes: 3,
        emptyDocks: 15,
        status: "active",
        address: "Address 2",
        city: "tpe",
        updatedAt: "2026-04-13 10:00:00",
      },
    ]);

    const stations = await getYouBikeStationsInBounds({
      north: 25.05,
      south: 24.99,
      east: 121.5,
      west: 121.48,
    });

    expect(stations).toHaveLength(1);
    expect(stations[0].id).toBe("ntc-0001");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it("fetches, merges, and caches NTC and TPE stations on a cache miss", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              sno: "500101001",
              sna: "YouBike2.0_新北站",
              sarea: "板橋區",
              ar: "新北地址",
              snaen: "YouBike2.0_New Taipei Station",
              sareaen: "Banqiao Dist.",
              aren: "New Taipei Address",
              lat: "25.01",
              lng: "121.49",
              tot_quantity: "20",
              sbi_quantity: "8",
              bemp: "12",
              act: "1",
              mday: "2026-04-13 10:00:00",
            },
          ]),
      } as any)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              sno: "000000001",
              sna: "YouBike2.0_台北站",
              sarea: "中正區",
              ar: "台北地址",
              snaen: "YouBike2.0_Taipei Station",
              sareaen: "Zhongzheng Dist.",
              aren: "Taipei Address",
              latitude: 25.04,
              longitude: 121.52,
              Quantity: 30,
              available_rent_bikes: 10,
              available_return_bikes: 20,
              act: "1",
              mday: "2026-04-13 10:00:00",
            },
          ]),
      } as any)
      .mockResolvedValueOnce({
        json: () => Promise.resolve([]),
      } as any);

    const stations = await getYouBikeStationsInBounds({
      north: 25.05,
      south: 24.99,
      east: 121.55,
      west: 121.48,
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining("page=0"));
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json",
    );
    expect(mockFetch).toHaveBeenNthCalledWith(3, expect.stringContaining("page=1"));
    expect(stations).toHaveLength(2);
    expect(stations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ntc-500101001", city: "ntc" }),
        expect.objectContaining({ id: "tpe-000000001", city: "tpe" }),
      ]),
    );
    expect(mockRedisSet).toHaveBeenCalledWith(
      "youbike:stations",
      expect.any(Array),
      { ex: 60 },
    );
  });
});
