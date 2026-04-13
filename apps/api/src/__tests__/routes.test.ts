import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock dependencies before imports
const mockDbSelect = jest.fn<any>();
const mockDbExecute = jest.fn<any>();

jest.unstable_mockModule("../../src/db.js", () => ({
  db: {
    select: mockDbSelect,
    execute: mockDbExecute,
  },
}));

const { default: handler } = await import("../../api/routes.js");

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

describe("GET /api/routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("list mode (no lineId)", () => {
    it("returns routes with live status", async () => {
      mockDbExecute.mockResolvedValue([
        {
          line_id: "207001",
          line_name: "A路線下午",
          city: "永和區",
          stop_count: 24,
          active_vehicles: 2,
          leading_stop_rank: 15,
        },
        {
          line_id: "207002",
          line_name: "B路線晚上",
          city: "永和區",
          stop_count: 18,
          active_vehicles: 0,
          leading_stop_rank: null,
        },
      ]);

      const req = mockReq();
      const res = mockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.ok).toBe(true);
      expect(body.routes).toHaveLength(2);
      expect(body.routes[0]).toEqual({
        lineId: "207001",
        lineName: "A路線下午",
        city: "永和區",
        stopCount: 24,
        activeVehicles: 2,
        leadingStopRank: 15,
      });
      expect(body.routes[1].activeVehicles).toBe(0);
      expect(body.routes[1].leadingStopRank).toBeNull();
    });

    it("returns empty routes array when no routes exist", async () => {
      mockDbExecute.mockResolvedValue([]);

      const req = mockReq();
      const res = mockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.ok).toBe(true);
      expect(body.routes).toEqual([]);
    });
  });

  describe("detail mode (?lineId=)", () => {
    it("returns 404 for unknown lineId", async () => {
      // Mock: route query returns empty
      const mockFrom = jest.fn<any>();
      const mockWhere = jest.fn<any>();
      mockDbSelect.mockReturnValue({ from: mockFrom });
      mockFrom.mockReturnValue({ where: mockWhere });
      mockWhere.mockResolvedValue([]);

      const req = mockReq({ lineId: "999999" });
      const res = mockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false, error: "Route not found" }),
      );
    });
  });

  it("returns 500 on database error", async () => {
    mockDbExecute.mockRejectedValue(new Error("Connection refused"));

    const req = mockReq();
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: "Internal server error",
      }),
    );
  });

  it("sets CORS headers", async () => {
    mockDbExecute.mockResolvedValue([]);

    const req = mockReq();
    const res = mockRes();
    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "*",
    );
  });
});
