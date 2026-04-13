import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockDbSelect = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

jest.unstable_mockModule("../../src/db.js", () => ({
  db: {
    select: mockDbSelect,
  },
}));

const { getSearchResults, normalizeSearchQuery } = await import(
  "../../src/search/results.js"
);

function mockGarbageQuery(rows: unknown[]) {
  const limit = jest.fn<any>().mockResolvedValue(rows);
  const where = jest.fn<any>().mockReturnValue({ limit });
  const innerJoin = jest.fn<any>().mockReturnValue({ where });
  const from = jest.fn<any>().mockReturnValue({ innerJoin });
  mockDbSelect.mockReturnValue({ from });
}

describe("search results service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGarbageQuery([]);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("normalizes raw query input before the handler delegates", () => {
    expect(normalizeSearchQuery("  Main Station  ")).toBe("main station");
    expect(normalizeSearchQuery(undefined)).toBe("");
  });

  it("returns cached search results when the search cache is warm", async () => {
    const cachedResults = [
      {
        id: "cached-1",
        title: "Cached Result",
        subtitle: "Cached Subtitle",
        lat: 25.04,
        lon: 121.51,
        moduleId: "transit",
      },
    ];
    mockRedisGet.mockResolvedValueOnce(cachedResults);

    const results = await getSearchResults("main");

    expect(results).toEqual(cachedResults);
    expect(mockRedisGet).toHaveBeenCalledWith("search:main");
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it("reads transit stations from the current cache key and caches the search result", async () => {
    mockRedisGet.mockImplementation(async (key: string) => {
      if (key === "search:main") return null;
      if (key === "transit:stations:v3") {
        return [
          {
            stationId: "TPE123",
            name: "Main Station",
            nameEn: "Main Station",
            lat: 25.0478,
            lon: 121.517,
            city: "Taipei",
            routes: [
              {
                routeId: "307",
                routeName: "307",
                routeNameEn: "307",
              },
            ],
          },
        ];
      }
      return [];
    });

    const results = await getSearchResults("main");

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "transit-TPE123",
          title: "Main Station",
          moduleId: "transit",
        }),
      ]),
    );
    expect(mockRedisGet).toHaveBeenCalledWith("transit:stations:v3");
    expect(mockRedisGet).not.toHaveBeenCalledWith("transit:stations");
    expect(mockRedisSet).toHaveBeenCalledWith("search:main", results, { ex: 60 });
  });
});
