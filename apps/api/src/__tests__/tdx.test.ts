import { afterAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockRedisDel = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
  },
}));

const mockFetch = jest.fn<typeof globalThis.fetch>();
globalThis.fetch = mockFetch;

const { tdxFetch } = await import("../../src/data-sources/tdx.js");

describe("tdxFetch", () => {
  const originalClientId = process.env.TDX_CLIENT_ID;
  const originalClientSecret = process.env.TDX_CLIENT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TDX_CLIENT_ID = "test-client";
    process.env.TDX_CLIENT_SECRET = "test-secret";
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
    mockRedisDel.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env.TDX_CLIENT_ID = originalClientId;
    process.env.TDX_CLIENT_SECRET = originalClientSecret;
  });

  it("retries transient auth and api failures before succeeding", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({}),
        text: async () => "auth down",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ access_token: "token-a" }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({}),
        text: async () => "api down",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [{ RouteUID: "route-1" }],
        text: async () => "",
      } as Response);

    const result = await tdxFetch<{ RouteUID: string }[]>(
      "/v2/Bus/Route/City/Taipei",
    );

    expect(result).toEqual([{ RouteUID: "route-1" }]);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockRedisSet).toHaveBeenCalledWith("tdx:token", "token-a", {
      ex: 86000,
    });
  });
});
