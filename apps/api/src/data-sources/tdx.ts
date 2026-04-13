import { redis } from "../redis.js";
import { fetchJson } from "../fetch-helpers.js";

const TDX_AUTH_URL =
  "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
const TDX_API_BASE = "https://tdx.transportdata.tw/api/basic";
const TOKEN_CACHE_KEY = "tdx:token";
const TOKEN_TTL = 86000; // slightly under 24h
const TDX_FETCH_OPTIONS = { timeoutMs: 10_000, retries: 1 } as const;

async function getToken(): Promise<string> {
  const cached = await redis.get<string>(TOKEN_CACHE_KEY);
  if (cached) return cached;

  const clientId = process.env.TDX_CLIENT_ID;
  const clientSecret = process.env.TDX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TDX_CLIENT_ID and TDX_CLIENT_SECRET must be set");
  }

  const res = await fetchJson(
    TDX_AUTH_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
    TDX_FETCH_OPTIONS,
  );

  if (!res.ok) {
    throw new Error(`TDX auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  await redis.set(TOKEN_CACHE_KEY, data.access_token, { ex: TOKEN_TTL });
  return data.access_token;
}

/**
 * Fetch from TDX API with automatic OAuth2 token management.
 * @param path - API path after base URL, e.g. "/v2/Bus/Stop/City/Taipei"
 * @param params - Optional OData query parameters
 */
export async function tdxFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await getToken();
  const url = new URL(`${TDX_API_BASE}${path}`);
  url.searchParams.set("$format", "JSON");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetchJson(
    url.toString(),
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    TDX_FETCH_OPTIONS,
  );

  if (res.status === 401) {
    // Token expired — clear cache and retry once
    await redis.del(TOKEN_CACHE_KEY);
    const newToken = await getToken();
    const retry = await fetchJson(
      url.toString(),
      {
        headers: { Authorization: `Bearer ${newToken}` },
      },
      TDX_FETCH_OPTIONS,
    );
    if (!retry.ok) {
      throw new Error(`TDX API error: ${retry.status} ${await retry.text()}`);
    }
    return (await retry.json()) as T;
  }

  if (!res.ok) {
    throw new Error(`TDX API error: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as T;
}
