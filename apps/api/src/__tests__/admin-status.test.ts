import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

const mockRedisPing = jest.fn<any>();
const mockRedisLrange = jest.fn<any>();
const mockFetch = jest.fn<typeof fetch>();
const originalFetch = global.fetch;

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    ping: mockRedisPing,
    lrange: mockRedisLrange,
  },
}));

global.fetch = mockFetch;

const { default: handler } = await import("../../api/admin/status.js");

function mockReq(headers: Record<string, string> = {}): any {
  return {
    method: "GET",
    headers,
  };
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn<any>().mockReturnValue(res);
  res.json = jest.fn<any>().mockReturnValue(res);
  res.setHeader = jest.fn<any>().mockReturnValue(res);
  res.end = jest.fn<any>().mockReturnValue(res);
  return res;
}

describe("GET /api/admin/status", () => {
  const originalAdminPassword = process.env.ADMIN_PASSWORD;
  const originalDbUrl = process.env.SUPABASE_DB_URL;
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_PASSWORD = "secret";
    delete process.env.SUPABASE_DB_URL;

    mockRedisPing.mockResolvedValue(undefined);
    mockRedisLrange.mockResolvedValue([]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ time: "2026-04-13T10:00:00+08:00" }],
    } as Response);
  });

  afterEach(() => {
    if (originalAdminPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalAdminPassword;
    }

    if (originalDbUrl === undefined) {
      delete process.env.SUPABASE_DB_URL;
    } else {
      process.env.SUPABASE_DB_URL = originalDbUrl;
    }
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it("returns degraded database health when SUPABASE_DB_URL is missing", async () => {
    const req = mockReq({ authorization: "Bearer secret" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        services: expect.objectContaining({
          database: expect.objectContaining({
            ok: false,
            error: expect.stringContaining("SUPABASE_DB_URL"),
          }),
          redis: expect.objectContaining({ ok: true }),
          ntcGpsApi: expect.objectContaining({ ok: true, vehicleCount: 1 }),
        }),
        freshness: {
          latestGpsTimestamp: "2026-04-13T10:00:00+08:00",
          passEventsLastHour: 0,
          passEventsToday: 0,
        },
        recentSyncs: [],
        routes: [],
      }),
    );
    expect(mockRedisPing).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
  });
});
