import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { buildBusStationId } from "@tracker/types";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockTdxFetch = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

jest.unstable_mockModule("../../src/data-sources/tdx.js", () => ({
  tdxFetch: mockTdxFetch,
}));

const { handleArrivals } = await import("../../src/transit/arrivals.js");

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

describe("GET /api/transit/arrivals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("resolves fallback station ids for stops without StationID", async () => {
    const stationStop = {
      StopUID: "TPE15001",
      StopName: { Zh_tw: "中山站", En: "Zhongshan Sta." },
      StopPosition: { PositionLat: 25.052, PositionLon: 121.52 },
      StationID: undefined,
    };
    const stationId = buildBusStationId(stationStop);

    mockRedisGet.mockResolvedValue(null);
    mockTdxFetch.mockImplementation(async (path: string, params?: any) => {
      if (path === "/v2/Bus/Stop/City/Taipei") {
        return [
          stationStop,
          {
            ...stationStop,
            StopUID: "TPE15002",
          },
          {
            ...stationStop,
            StopUID: "TPE19999",
            StopName: { Zh_tw: "市政府", En: "City Hall" },
            StopPosition: { PositionLat: 25.041, PositionLon: 121.565 },
          },
        ];
      }

      if (path === "/v2/Bus/EstimatedTimeOfArrival/City/Taipei") {
        expect(params?.$filter).toContain("TPE15001");
        expect(params?.$filter).toContain("TPE15002");
        return [
          {
            StopUID: "TPE15001",
            StopName: stationStop.StopName,
            RouteUID: "TPE10307",
            RouteName: { Zh_tw: "307", En: "307" },
            Direction: 0,
            EstimateTime: 180,
            StopStatus: 0,
            NextBusTime: "2026-04-13T18:30:00+08:00",
          },
          {
            StopUID: "TPE15002",
            StopName: stationStop.StopName,
            RouteUID: "TPE10604",
            RouteName: { Zh_tw: "604", En: "604" },
            Direction: 1,
            EstimateTime: 60,
            StopStatus: 0,
            NextBusTime: "2026-04-13T18:28:00+08:00",
          },
        ];
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    const req = mockReq({ stationId, city: "Taipei" });
    const res = mockRes();

    await handleArrivals(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        arrivals: expect.arrayContaining([
          expect.objectContaining({ routeId: "TPE10307" }),
          expect.objectContaining({ routeId: "TPE10604" }),
        ]),
      }),
    );
  });
});
