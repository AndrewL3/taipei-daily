import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

const { default: handler } = await import("../../api/alerts/active.js");

function mockRes() {
  const res: any = {};
  res.status = jest.fn<any>().mockReturnValue(res);
  res.json = jest.fn<any>().mockReturnValue(res);
  res.setHeader = jest.fn<any>().mockReturnValue(res);
  return res;
}

describe("GET /api/alerts/active", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("sanitizes cached alert links before returning them", async () => {
    mockRedisGet.mockResolvedValueOnce([
      {
        id: "cached-alert",
        headline: "Alert",
        description: "Description",
        instruction: "Instruction",
        severity: "Moderate",
        urgency: "Expected",
        category: "Met",
        event: "Heavy Rain",
        senderName: "Agency",
        effective: "2026-04-13T10:00:00+08:00",
        expires: "2026-04-13T12:00:00+08:00",
        alertColor: "",
        areas: ["台北市"],
        geocodes: ["6300100"],
        web: "javascript:alert(1)",
      },
    ]);

    const res = mockRes();

    await handler({} as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      alerts: [
        expect.objectContaining({
          id: "cached-alert",
          web: undefined,
        }),
      ],
    });
    expect(mockRedisSet).not.toHaveBeenCalled();
  });
});
