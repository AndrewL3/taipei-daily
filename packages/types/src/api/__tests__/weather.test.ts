import { describe, expect, it } from "@jest/globals";
import { CwaForecastResponseSchema, transformCwaForecast } from "../weather.js";

describe("CwaForecastResponseSchema", () => {
  const validResponse = {
    success: "true",
    records: {
      locations: [
        {
          locationsName: "臺北市",
          location: [
            {
              locationName: "中正區",
              geocode: "6300500",
              lat: "25.0324",
              lon: "121.5183",
              weatherElement: [
                {
                  elementName: "Wx",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [
                        { value: "多雲時晴", measures: "天氣現象" },
                      ],
                    },
                  ],
                },
                {
                  elementName: "PoP12h",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "20", measures: "百分比" }],
                    },
                  ],
                },
                {
                  elementName: "T",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "22", measures: "攝氏度" }],
                    },
                  ],
                },
                {
                  elementName: "MinT",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "18", measures: "攝氏度" }],
                    },
                  ],
                },
                {
                  elementName: "MaxT",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "25", measures: "攝氏度" }],
                    },
                  ],
                },
                {
                  elementName: "CI",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "舒適", measures: "舒適度指數" }],
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

  it("parses a valid CWA forecast response", () => {
    const result = CwaForecastResponseSchema.parse(validResponse);
    expect(result.records.locations[0].location[0].locationName).toBe("中正區");
  });

  it("extracts weather elements by name", () => {
    const result = CwaForecastResponseSchema.parse(validResponse);
    const wx = result.records.locations[0].location[0].weatherElement.find(
      (e) => e.elementName === "Wx",
    );
    expect(wx?.time[0].elementValue[0].value).toBe("多雲時晴");
  });
});

describe("transformCwaForecast", () => {
  const makeResponse = (locationName: string) => ({
    success: "true",
    records: {
      locations: [
        {
          locationsName: "臺北市",
          location: [
            {
              locationName,
              geocode: "6300500",
              lat: "25.0324",
              lon: "121.5183",
              weatherElement: [
                {
                  elementName: "Wx",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [
                        { value: "多雲時晴", measures: "天氣現象" },
                      ],
                    },
                  ],
                },
                {
                  elementName: "PoP12h",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "20", measures: "百分比" }],
                    },
                  ],
                },
                {
                  elementName: "T",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "22", measures: "攝氏度" }],
                    },
                  ],
                },
                {
                  elementName: "MinT",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "18", measures: "攝氏度" }],
                    },
                  ],
                },
                {
                  elementName: "MaxT",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "25", measures: "攝氏度" }],
                    },
                  ],
                },
                {
                  elementName: "CI",
                  time: [
                    {
                      startTime: "2026-03-08 06:00:00",
                      endTime: "2026-03-08 18:00:00",
                      elementValue: [{ value: "舒適", measures: "舒適度指數" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  });

  it("transforms CWA response into WeatherForecast for a township", () => {
    const response = CwaForecastResponseSchema.parse(makeResponse("中正區"));
    const forecast = transformCwaForecast(response, "中正區");
    expect(forecast).not.toBeNull();
    expect(forecast!.township).toBe("中正區");
    expect(forecast!.forecast).toHaveLength(1);
    expect(forecast!.forecast[0].wx).toBe("多雲時晴");
    expect(forecast!.forecast[0].pop).toBe(20);
    expect(forecast!.forecast[0].temperature).toBe(22);
    expect(forecast!.forecast[0].minT).toBe(18);
    expect(forecast!.forecast[0].maxT).toBe(25);
    expect(forecast!.forecast[0].ci).toBe("舒適");
  });

  it("returns null when township not found", () => {
    const response = CwaForecastResponseSchema.parse(makeResponse("中正區"));
    const forecast = transformCwaForecast(response, "不存在區");
    expect(forecast).toBeNull();
  });
});
