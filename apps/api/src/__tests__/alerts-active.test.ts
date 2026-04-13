import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetActiveAlerts = jest.fn<any>();

jest.unstable_mockModule("../../src/alerts/active.js", () => ({
  getActiveAlerts: mockGetActiveAlerts,
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
  });

  it("returns alerts from the alerts service", async () => {
    mockGetActiveAlerts.mockResolvedValueOnce([
      {
        id: "alert-a",
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
        web: "https://www.cwa.gov.tw/warning",
      },
    ]);

    const res = mockRes();

    await handler({} as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      alerts: [
        expect.objectContaining({
          id: "alert-a",
          web: "https://www.cwa.gov.tw/warning",
        }),
      ],
    });
    expect(mockGetActiveAlerts).toHaveBeenCalled();
  });
});
