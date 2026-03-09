import { describe, expect, it, jest, beforeEach } from "@jest/globals";

// Mock redis before any handler import
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

// Import handler after mocks are set up (top-level await)
const { default: handler } = await import("../../api/parking/spaces.js");

function mockReq(query: Record<string, string> = {}): any {
  return { query };
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn<any>().mockReturnValue(res);
  res.json = jest.fn<any>().mockReturnValue(res);
  res.setHeader = jest.fn<any>().mockReturnValue(res);
  return res;
}

describe("parking/spaces handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("returns 400 when bounding box params are missing", async () => {
    const req = mockReq({});
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
    );
  });

  it("returns 400 when params are non-numeric", async () => {
    const req = mockReq({
      north: "abc",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false }),
    );
  });

  it("returns filtered road segments within bounding box", async () => {
    // Simulate cached data with two road segments
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

    const req = mockReq({
      north: "25.01",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];
    expect(result.ok).toBe(true);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].roadId).toBe("T63");
  });

  it("sets CORS headers", async () => {
    mockRedisGet.mockResolvedValueOnce([]);

    const req = mockReq({
      north: "25.01",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "*",
    );
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

    const req = mockReq({
      north: "25.01",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=0"));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    expect(mockRedisSet).toHaveBeenCalledWith(
      "parking:spaces",
      expect.any(Array),
      { ex: 120 },
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 on internal error", async () => {
    mockRedisGet.mockRejectedValueOnce(new Error("Redis down"));

    const req = mockReq({
      north: "25.01",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: "Redis down" }),
    );
  });
});
