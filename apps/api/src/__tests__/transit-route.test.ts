import { beforeEach, describe, expect, it, jest } from "@jest/globals";

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

const { handleRoute } = await import("../../src/transit/route.js");

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

describe("GET /api/transit/route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("returns 400 when direction is missing", async () => {
    const req = mockReq({ routeId: "TPE10307", city: "Taipei" });
    const res = mockRes();

    await handleRoute(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "direction query param is required",
    });
    expect(mockRedisGet).not.toHaveBeenCalled();
    expect(mockTdxFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when direction is not 0 or 1", async () => {
    const req = mockReq({
      routeId: "TPE10307",
      direction: "foo",
      city: "Taipei",
    });
    const res = mockRes();

    await handleRoute(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "direction must be 0 or 1",
    });
    expect(mockRedisGet).not.toHaveBeenCalled();
    expect(mockTdxFetch).not.toHaveBeenCalled();
  });
});
