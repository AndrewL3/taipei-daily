import { fetchJson } from "../fetch-helpers.js";

const CWA_BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
const CWA_FETCH_OPTIONS = { timeoutMs: 10_000, retries: 1 } as const;

function getApiKey(): string {
  const key = process.env.CWA_API_KEY;
  if (!key) throw new Error("CWA_API_KEY environment variable is not set");
  return key;
}

export async function cwaFetch<T>(datasetId: string): Promise<T> {
  const url = `${CWA_BASE_URL}/${datasetId}?Authorization=${getApiKey()}&format=JSON`;
  const res = await fetchJson(url, undefined, CWA_FETCH_OPTIONS);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CWA API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
