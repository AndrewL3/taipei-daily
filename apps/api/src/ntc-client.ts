import { VehicleGpsSchema, type VehicleGps } from "@tracker/types";
import { paginateAll } from "@tracker/utils";
import { fetchJson } from "./fetch-helpers.js";

const NTC_GPS_URL =
  "https://data.ntpc.gov.tw/api/datasets/28ab4122-60e1-4065-98e5-abccb69aaca6/json";

export async function fetchLiveGps(): Promise<VehicleGps[]> {
  const raw = await paginateAll(async (page, size) => {
    const res = await fetchJson(`${NTC_GPS_URL}?page=${page}&size=${size}`);
    if (!res.ok) {
      throw new Error(`NTC GPS API error: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as unknown[];
  });

  const valid: VehicleGps[] = [];
  for (const item of raw) {
    const parsed = VehicleGpsSchema.safeParse(item);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      console.warn("Skipping invalid GPS record:", parsed.error.message);
    }
  }

  return valid;
}
