import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetForecastForLocation = jest.fn<any>();

jest.unstable_mockModule("../../src/weather/forecast.js", () => ({
  getForecastForLocation: mockGetForecastForLocation,
}));

const { default: handler } = await import("../../api/weather/forecast.js");

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

describe("GET /api/weather/forecast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when lat/lon are invalid", async () => {
    const req = mockReq({ lat: "abc", lon: "121.5" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "lat and lon query params are required",
    });
    expect(mockGetForecastForLocation).not.toHaveBeenCalled();
  });

  it("returns 404 when the forecast service cannot find township data", async () => {
    mockGetForecastForLocation.mockResolvedValue({
      townshipName: "中正區",
      forecast: null,
    });

    const req = mockReq({ lat: "25.03", lon: "121.52" });
    const res = mockRes();

    await handler(req, res);

    expect(mockGetForecastForLocation).toHaveBeenCalledWith(25.03, 121.52);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: "No forecast found for township: 中正區",
    });
  });
});
