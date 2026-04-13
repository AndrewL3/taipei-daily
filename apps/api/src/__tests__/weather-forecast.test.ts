import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockCwaFetch = jest.fn<any>();
const mockFindNearestTownship = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

jest.unstable_mockModule("../../src/data-sources/cwa.js", () => ({
  cwaFetch: mockCwaFetch,
}));

jest.unstable_mockModule("../../src/data/township-centers.js", () => ({
  findNearestTownship: mockFindNearestTownship,
}));

const { getForecastForLocation } = await import("../../src/weather/forecast.js");

const sampleResponse = {
  success: "true",
  records: {
    Locations: [
      {
        LocationsName: "Taipei City",
        Location: [
          {
            LocationName: "中正區",
            Geocode: "6300100",
            Latitude: "25.0324",
            Longitude: "121.5183",
            WeatherElement: [
              {
                ElementName: "天氣現象",
                Time: [
                  {
                    StartTime: "2026-04-13T12:00:00+08:00",
                    EndTime: "2026-04-13T15:00:00+08:00",
                    ElementValue: [{ Weather: "晴" }],
                  },
                ],
              },
              {
                ElementName: "3小時降雨機率",
                Time: [
                  {
                    StartTime: "2026-04-13T12:00:00+08:00",
                    EndTime: "2026-04-13T15:00:00+08:00",
                    ElementValue: [{ ProbabilityOfPrecipitation: "10" }],
                  },
                ],
              },
              {
                ElementName: "溫度",
                Time: [
                  {
                    DataTime: "2026-04-13T12:00:00+08:00",
                    ElementValue: [{ Temperature: "27" }],
                  },
                  {
                    DataTime: "2026-04-13T13:00:00+08:00",
                    ElementValue: [{ Temperature: "28" }],
                  },
                ],
              },
              {
                ElementName: "舒適度指數",
                Time: [
                  {
                    DataTime: "2026-04-13T12:00:00+08:00",
                    ElementValue: [{ ComfortIndexDescription: "舒適" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe("getForecastForLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindNearestTownship.mockReturnValue({
      name: "中正區",
      city: "Taipei",
      datasetId: "F-D0047-061",
      lat: 25.0324,
      lon: 121.5183,
    });
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("returns a transformed township forecast from cache", async () => {
    mockRedisGet.mockResolvedValue(sampleResponse);

    const result = await getForecastForLocation(25.03, 121.52);

    expect(result.townshipName).toBe("中正區");
    expect(result.forecast).toEqual({
      township: "中正區",
      city: "Taipei City",
      forecast: [
        {
          startTime: "2026-04-13T12:00:00+08:00",
          endTime: "2026-04-13T15:00:00+08:00",
          wx: "晴",
          pop: 10,
          temperature: 27,
          minT: 27,
          maxT: 28,
          ci: "舒適",
        },
      ],
    });
    expect(mockCwaFetch).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it("fetches and caches the city forecast on a cache miss", async () => {
    mockRedisGet.mockResolvedValue(null);
    mockCwaFetch.mockResolvedValue(sampleResponse);

    await getForecastForLocation(25.03, 121.52);

    expect(mockCwaFetch).toHaveBeenCalledWith("F-D0047-061");
    expect(mockRedisSet).toHaveBeenCalledWith(
      "weather:forecast:F-D0047-061",
      sampleResponse,
      { ex: 1800 },
    );
  });
});
