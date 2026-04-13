import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

// Mock fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

const { getParkingRoadSegmentsInBounds } = await import(
  "../../src/parking/spaces.js"
);

describe("getParkingRoadSegmentsInBounds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("returns filtered road segments from cached data", async () => {
    const cachedSegments = [
      {
        roadId: "T63",
        roadName: "建一路",
        latitude: 25.001,
        longitude: 121.487,
        totalSpaces: 5,
        availableSpaces: 3,
        pricing: "30元/時",
        hours: "07:00-20:00",
        days: "週一-週五",
        memo: "",
      },
      {
        roadId: "T99",
        roadName: "遠方路",
        latitude: 26.0,
        longitude: 122.0,
        totalSpaces: 2,
        availableSpaces: 1,
        pricing: "20元/時",
        hours: "07:00-20:00",
        days: "週一-週五",
        memo: "",
      },
    ];
    mockRedisGet.mockResolvedValueOnce(cachedSegments);

    const segments = await getParkingRoadSegmentsInBounds({
      north: 25.01,
      south: 24.99,
      east: 121.5,
      west: 121.48,
    });

    expect(segments).toHaveLength(1);
    expect(segments[0].roadId).toBe("T63");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it("fetches from NTC API when cache is empty", async () => {
    mockRedisGet.mockResolvedValueOnce(null);

    // Mock paginated NTC API response: one page of data, then empty
    mockFetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              ID: "1",
              CELLID: "C1",
              NAME: "建一路001",
              DAY: "週一-週五",
              HOUR: "07:00-20:00",
              PAY: "30",
              PAYCASH: "30元/時",
              MEMO: "",
              ROADID: "R1",
              ROADNAME: "建一路",
              CELLSTATUS: "Y",
              ISNOWCASH: "Y",
              ParkingStatus: "1",
              latitude: "25.001",
              longitude: "121.487",
              CountyCode: "F",
              AreaCode: "01",
            },
          ]),
      } as any)
      .mockResolvedValueOnce({
        json: () => Promise.resolve([]),
      } as any);

    const segments = await getParkingRoadSegmentsInBounds({
      north: 25.01,
      south: 24.99,
      east: 121.5,
      west: 121.48,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=0"));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    expect(mockRedisSet).toHaveBeenCalledWith(
      "parking:spaces",
      expect.any(Array),
      { ex: 120 },
    );
    expect(segments).toHaveLength(1);
    expect(segments[0].roadId).toBe("R1");
  });
});
