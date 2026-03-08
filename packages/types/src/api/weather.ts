import { z } from "zod";

// --- CWA Forecast Response schema ---

const CwaElementValueSchema = z.object({
  value: z.string(),
  measures: z.string(),
});

const CwaTimeSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  elementValue: z.array(CwaElementValueSchema),
});

const CwaWeatherElementSchema = z.object({
  elementName: z.string(),
  time: z.array(CwaTimeSchema),
});

const CwaLocationSchema = z.object({
  locationName: z.string(),
  geocode: z.string(),
  lat: z.string(),
  lon: z.string(),
  weatherElement: z.array(CwaWeatherElementSchema),
});

const CwaLocationsSchema = z.object({
  locationsName: z.string(),
  location: z.array(CwaLocationSchema),
});

export const CwaForecastResponseSchema = z.object({
  success: z.string(),
  records: z.object({
    locations: z.array(CwaLocationsSchema),
  }),
});

export type CwaForecastResponse = z.infer<typeof CwaForecastResponseSchema>;

// --- Transformed types ---

export interface ForecastPeriod {
  startTime: string;
  endTime: string;
  wx: string;
  pop: number;
  temperature: number;
  minT: number;
  maxT: number;
  ci: string;
}

export interface WeatherForecast {
  township: string;
  city: string;
  forecast: ForecastPeriod[];
}

// --- Transform function ---

type CwaWeatherElementType = z.infer<typeof CwaWeatherElementSchema>;
type CwaTimeType = z.infer<typeof CwaTimeSchema>;

function getElementTimes(
  elements: CwaWeatherElementType[],
  name: string,
): CwaTimeType[] {
  return elements.find((e) => e.elementName === name)?.time ?? [];
}

export function transformCwaForecast(
  response: CwaForecastResponse,
  townshipName: string,
): WeatherForecast | null {
  const locationsGroup = response.records.locations[0];
  if (!locationsGroup) return null;

  const location = locationsGroup.location.find(
    (loc) => loc.locationName === townshipName,
  );
  if (!location) return null;

  const wxTimes = getElementTimes(location.weatherElement, "Wx");
  const popTimes = getElementTimes(location.weatherElement, "PoP12h");
  const tTimes = getElementTimes(location.weatherElement, "T");
  const minTTimes = getElementTimes(location.weatherElement, "MinT");
  const maxTTimes = getElementTimes(location.weatherElement, "MaxT");
  const ciTimes = getElementTimes(location.weatherElement, "CI");

  const forecast: ForecastPeriod[] = wxTimes.map((wxTime, i) => ({
    startTime: wxTime.startTime,
    endTime: wxTime.endTime,
    wx: wxTime.elementValue[0]?.value ?? "",
    pop: parseInt(popTimes[i]?.elementValue[0]?.value ?? "0", 10),
    temperature: parseInt(tTimes[i]?.elementValue[0]?.value ?? "0", 10),
    minT: parseInt(minTTimes[i]?.elementValue[0]?.value ?? "0", 10),
    maxT: parseInt(maxTTimes[i]?.elementValue[0]?.value ?? "0", 10),
    ci: ciTimes[i]?.elementValue[0]?.value ?? "",
  }));

  return {
    township: townshipName,
    city: locationsGroup.locationsName,
    forecast,
  };
}
