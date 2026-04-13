import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock dependencies before imports
const mockDbSelect = jest.fn();
const mockDbInsert = jest.fn();
const mockRedisMget = jest.fn<any>();
const mockRedisPipeline = jest.fn<any>();
const mockPipelineSet = jest.fn<any>();
const mockPipelineExec = jest.fn<any>();

jest.unstable_mockModule("../../src/db.js", () => ({
  db: {
    select: mockDbSelect,
    insert: mockDbInsert,
  },
}));

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    mget: mockRedisMget,
    pipeline: mockRedisPipeline,
  },
}));

jest.unstable_mockModule("../../src/ntc-client.js", () => ({
  fetchLiveGps: jest.fn(),
}));

const { default: handler } = await import("../../api/cron/sync.js");
const { fetchLiveGps } = await import("../../src/ntc-client.js");
const mockFetchLiveGps = fetchLiveGps as jest.MockedFunction<
  typeof fetchLiveGps
>;

function mockRes() {
  const res: any = {};
  res.status = jest.fn<any>().mockReturnValue(res);
  res.json = jest.fn<any>().mockReturnValue(res);
  res.setHeader = jest.fn<any>().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Record<string, any> = {}) {
  return { method: "POST", headers: {}, ...overrides } as any;
}

describe("/api/cron/sync", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;
    mockRedisPipeline.mockReturnValue({
      set: mockPipelineSet,
      exec: mockPipelineExec,
    });
    mockPipelineSet.mockReturnThis();
    mockPipelineExec.mockResolvedValue([]);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects non-POST requests with 405", async () => {
    const res = mockRes();
    await handler(mockReq({ method: "GET" }), res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "Method not allowed",
    });
  });

  it("rejects requests with invalid CRON_SECRET with 401", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = mockRes();
    await handler(
      mockReq({ headers: { authorization: "Bearer wrong-secret" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "Unauthorized",
    });
  });

  it("rejects requests with missing Authorization header when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = mockRes();
    await handler(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("allows requests when CRON_SECRET matches", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockFetchLiveGps.mockResolvedValue([]);
    const res = mockRes();
    await handler(
      mockReq({ headers: { authorization: "Bearer correct-secret" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, vehicles: 0 });
  });

  it("rejects requests when CRON_SECRET env var is not set", async () => {
    mockFetchLiveGps.mockResolvedValue([]);
    const res = mockRes();
    await handler(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "Service unavailable",
    });
  });

  it("returns early with vehicles: 0 when no GPS data", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockFetchLiveGps.mockResolvedValue([]);
    const res = mockRes();

    await handler(
      mockReq({ headers: { authorization: "Bearer correct-secret" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, vehicles: 0 });
  });

  it("returns 500 when NTC API fails", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockFetchLiveGps.mockRejectedValue(new Error("Network error"));
    const res = mockRes();

    await handler(
      mockReq({ headers: { authorization: "Bearer correct-secret" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: "NTC API unreachable" }),
    );
  });

  it("processes GPS data end-to-end", async () => {
    process.env.CRON_SECRET = "correct-secret";
    mockFetchLiveGps.mockResolvedValue([
      {
        lineid: "207001",
        car: "KED-0605",
        time: "2026/02/28 15:00:00",
        location: "somewhere",
        longitude: 121.689,
        latitude: 25.18001,
        cityid: "123",
        cityname: "萬里區",
      },
    ]);

    // Mock DB: stops query
    const mockFrom = jest.fn<any>();
    const mockWhere = jest.fn<any>();
    const mockOrderBy = jest.fn<any>();
    mockDbSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValue([
      {
        routeLineId: "207001",
        rank: 1,
        latitude: 25.18,
        longitude: 121.689,
      },
    ]);

    // Mock Redis: no prior state
    mockRedisMget.mockResolvedValue([null]);

    // Mock DB: insert
    const mockValues = jest.fn<any>();
    const mockOnConflict = jest.fn<any>();
    mockDbInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ onConflictDoNothing: mockOnConflict });
    mockOnConflict.mockResolvedValue(undefined);

    const res = mockRes();
    await handler(
      mockReq({ headers: { authorization: "Bearer correct-secret" } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, newPassEvents: 1 }),
    );
    expect(mockValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          routeLineId: "207001",
          stopRank: 1,
          car: "KED-0605",
          routeDate: "2026-02-28",
        }),
      ]),
    );
    expect(mockPipelineSet).toHaveBeenCalled();
  });
});
