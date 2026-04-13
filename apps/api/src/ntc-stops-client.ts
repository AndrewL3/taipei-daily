import {
  RouteStopRawSchema,
  transformRouteStop,
  type RouteStop,
} from "@tracker/types";
import { paginateAll } from "@tracker/utils";
import { fetchJson } from "./fetch-helpers.js";

const NTC_STOPS_URL =
  "https://data.ntpc.gov.tw/api/datasets/edc3ad26-8ae7-4916-a00b-bc6048d19bf8/json";
const NTC_FETCH_OPTIONS = { timeoutMs: 10_000, retries: 1 } as const;
const NTC_MAX_PAGES = 25;

export async function fetchStaticStops(): Promise<RouteStop[]> {
  const raw = await paginateAll(async (page, size) => {
    const res = await fetchJson(
      `${NTC_STOPS_URL}?page=${page}&size=${size}`,
      undefined,
      NTC_FETCH_OPTIONS,
    );
    if (!res.ok) {
      throw new Error(`NTC Stops API error: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as unknown[];
  }, 1000, { maxPages: NTC_MAX_PAGES });

  const valid: RouteStop[] = [];
  for (const item of raw) {
    const parsed = RouteStopRawSchema.safeParse(item);
    if (parsed.success) {
      valid.push(transformRouteStop(parsed.data));
    } else {
      console.warn("Skipping invalid stop record:", parsed.error.message);
    }
  }

  return valid;
}
