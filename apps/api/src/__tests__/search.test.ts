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

function mockGarbageQuery(rows: unknown[]) {
  const limit = jest.fn<any>().mockResolvedValue(rows);
  const where = jest.fn<any>().mockReturnValue({ limit });
  const innerJoin = jest.fn<any>().mockReturnValue({ where });
  const from = jest.fn<any>().mockReturnValue({ innerJoin });
  mockDbSelect.mockReturnValue({ from });
}

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGarbageQuery([]);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("reads transit stations from the current cache key", async () => {
    mockRedisGet.mockImplementation(async (key: string) => {
      if (key === "search:main") return null;
      if (key === "transit:stations:v2") {
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

    const req = mockReq({ q: "main" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            id: "transit-TPE123",
            title: "Main Station",
            moduleId: "transit",
          }),
        ]),
      }),
    );
    expect(mockRedisGet).toHaveBeenCalledWith("transit:stations:v2");
    expect(mockRedisGet).not.toHaveBeenCalledWith("transit:stations");
  });
});
