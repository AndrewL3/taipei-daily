import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetTaipeiGarbageStopsInBounds = jest.fn<any>();

jest.unstable_mockModule("../../src/garbage/taipei-stops.js", () => ({
  getTaipeiGarbageStopsInBounds: mockGetTaipeiGarbageStopsInBounds,
}));

const { default: handler } = await import("../../api/garbage/taipei-stops.js");

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

describe("GET /api/garbage/taipei-stops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when bounding box params are missing or invalid", async () => {
    const req = mockReq({
      north: "abc",
      south: "25.0",
      east: "121.55",
      west: "121.5",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "north, south, east, west query params are required",
    });
    expect(mockGetTaipeiGarbageStopsInBounds).not.toHaveBeenCalled();
  });

  it("returns stops from the garbage service", async () => {
    mockGetTaipeiGarbageStopsInBounds.mockResolvedValueOnce([
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
    ]);

    const req = mockReq({
      north: "25.05",
      south: "25.0",
      east: "121.55",
      west: "121.5",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(mockGetTaipeiGarbageStopsInBounds).toHaveBeenCalledWith({
      north: 25.05,
      south: 25,
      east: 121.55,
      west: 121.5,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      stops: [expect.objectContaining({ id: "tpe-1-1-1" })],
    });
  });
});
