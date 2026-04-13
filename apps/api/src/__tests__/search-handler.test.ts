import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetSearchResults = jest.fn<any>();
const mockNormalizeSearchQuery = jest.fn<any>();

jest.unstable_mockModule("../../src/search/results.js", () => ({
  getSearchResults: mockGetSearchResults,
  normalizeSearchQuery: mockNormalizeSearchQuery,
}));

const { default: handler } = await import("../../api/search.js");

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

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an empty result set when the normalized query is blank", async () => {
    mockNormalizeSearchQuery.mockReturnValueOnce("");

    const req = mockReq({ q: "   " });
    const res = mockRes();

    await handler(req, res);

    expect(mockNormalizeSearchQuery).toHaveBeenCalledWith("   ");
    expect(mockGetSearchResults).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, results: [] });
  });

  it("returns results from the search service", async () => {
    mockNormalizeSearchQuery.mockReturnValueOnce("main");
    mockGetSearchResults.mockResolvedValueOnce([
      {
        id: "transit-TPE123",
        title: "Main Station",
        subtitle: "307",
        lat: 25.0478,
        lon: 121.517,
        moduleId: "transit",
      },
    ]);

    const req = mockReq({ q: "Main" });
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(mockNormalizeSearchQuery).toHaveBeenCalledWith("Main");
    expect(mockGetSearchResults).toHaveBeenCalledWith("main");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      results: [expect.objectContaining({ id: "transit-TPE123" })],
    });
  });
});
