import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockDbSelect = jest.fn<any>();

jest.unstable_mockModule("../../src/db.js", () => ({
  db: {
    select: mockDbSelect,
  },
}));

const { default: handler } = await import("../../api/stops.js");

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

describe("GET /api/stops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when lat is missing", async () => {
    const req = mockReq({ lon: "121.52" });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: "lat and lon are required" }),
    );
  });

  it("returns 400 when lon is missing", async () => {
    const req = mockReq({ lat: "25.01" });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: "lat and lon are required" }),
    );
  });

  it("returns 400 for non-numeric coordinates", async () => {
    const req = mockReq({ lat: "abc", lon: "121.52" });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: "Invalid coordinates" }),
    );
  });

  it("returns nearby stops sorted by distance", async () => {
    const mockFrom = jest.fn<any>();
    const mockInnerJoin = jest.fn<any>();
    const mockWhere = jest.fn<any>();
    mockDbSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue([
      {
        routeLineId: "207001",
        rank: 5,
        name: "福和路1號",
        latitude: 25.0101,
        longitude: 121.5267,
        lineName: "A路線下午",
      },
      {
        routeLineId: "207001",
        rank: 6,
        name: "中正路200號",
        latitude: 25.015,
        longitude: 121.527,
        lineName: "A路線下午",
      },
    ]);

    const req = mockReq({ lat: "25.0101", lon: "121.5267", radius: "1000" });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.ok).toBe(true);
    expect(body.stops.length).toBeGreaterThanOrEqual(1);
    expect(body.stops[0]).toEqual(
      expect.objectContaining({
        routeLineId: "207001",
        routeLineName: "A路線下午",
        name: "福和路1號",
        latitude: 25.0101,
        longitude: 121.5267,
      }),
    );
    expect(typeof body.stops[0].distance).toBe("number");
  });

  it("returns empty array when no stops nearby", async () => {
    const mockFrom = jest.fn<any>();
    const mockInnerJoin = jest.fn<any>();
    const mockWhere = jest.fn<any>();
    mockDbSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue([]);

    const req = mockReq({ lat: "0", lon: "0" });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.stops).toEqual([]);
  });

  it("sets CORS headers", async () => {
    const mockFrom = jest.fn<any>();
    const mockInnerJoin = jest.fn<any>();
    const mockWhere = jest.fn<any>();
    mockDbSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue([]);

    const req = mockReq({ lat: "25.01", lon: "121.52" });
    const res = mockRes();
    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "*",
    );
  });
});
