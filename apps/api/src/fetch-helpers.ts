/**
 * Minimal fetch-response interface that works across TypeScript versions.
 *
 * On Vercel (TS 5.9.3) the global `Response` type sometimes resolves to `{}`
 * when `@types/node`'s conditional `undici` re-export is not matched. Typing
 * fetch results through this helper avoids the mismatch.
 */
interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
}

/**
 * Thin wrapper around `globalThis.fetch` that returns a properly-typed response.
 */
export async function fetchJson(url: string): Promise<FetchResponse> {
  const res = await fetch(url);
  return res as unknown as FetchResponse;
}
