import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetYouBikeStationsInBounds = jest.fn<any>();

jest.unstable_mockModule("../../src/youbike/stations.js", () => ({
  getYouBikeStationsInBounds: mockGetYouBikeStationsInBounds,
}));

const { default: handler } = await import("../../api/youbike/stations.js");

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

describe("GET /api/youbike/stations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when bounding box params are missing or invalid", async () => {
    const req = mockReq({
      north: "abc",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "north, south, east, west query params are required",
    });
    expect(mockGetYouBikeStationsInBounds).not.toHaveBeenCalled();
  });

  it("returns stations from the youbike service", async () => {
    mockGetYouBikeStationsInBounds.mockResolvedValueOnce([
      {
        id: "ntc-500101001",
        name: "新北站",
        nameEn: "New Taipei Station",
        district: "板橋區",
        lat: 25.01,
        lon: 121.49,
        totalDocks: 20,
        availableBikes: 8,
        emptyDocks: 12,
        status: "active",
        address: "新北地址",
        city: "ntc",
        updatedAt: "2026-04-13 10:00:00",
      },
    ]);

    const req = mockReq({
      north: "25.05",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(mockGetYouBikeStationsInBounds).toHaveBeenCalledWith({
      north: 25.05,
      south: 24.99,
      east: 121.5,
      west: 121.48,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      stations: [expect.objectContaining({ id: "ntc-500101001" })],
    });
  });
});
