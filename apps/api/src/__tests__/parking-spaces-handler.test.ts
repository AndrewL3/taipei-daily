import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetParkingRoadSegmentsInBounds = jest.fn<any>();

jest.unstable_mockModule("../../src/parking/spaces.js", () => ({
  getParkingRoadSegmentsInBounds: mockGetParkingRoadSegmentsInBounds,
}));

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

describe("GET /api/parking/spaces", () => {
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
    expect(mockGetParkingRoadSegmentsInBounds).not.toHaveBeenCalled();
  });

  it("returns segments from the parking service", async () => {
    mockGetParkingRoadSegmentsInBounds.mockResolvedValueOnce([
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
    ]);

    const req = mockReq({
      north: "25.01",
      south: "24.99",
      east: "121.50",
      west: "121.48",
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(mockGetParkingRoadSegmentsInBounds).toHaveBeenCalledWith({
      north: 25.01,
      south: 24.99,
      east: 121.5,
      west: 121.48,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      segments: [expect.objectContaining({ roadId: "T63" })],
    });
  });
});
