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
  text(): Promise<string>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

export interface FetchPolicyOptions {
  timeoutMs?: number;
  retries?: number;
  retryStatuses?: readonly number[];
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

async function fetchWithPolicy(
  url: string,
  init: RequestInit = {},
  options: FetchPolicyOptions = {},
): Promise<FetchResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryStatuses = new Set(
    options.retryStatuses ?? DEFAULT_RETRY_STATUSES,
  );

  for (let attempt = 0; ; attempt++) {
    const timeoutController = new AbortController();
    const signal = init.signal
      ? AbortSignal.any([init.signal, timeoutController.signal])
      : timeoutController.signal;
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    try {
      const res = (await fetch(url, {
        ...init,
        signal,
      })) as unknown as FetchResponse;

      if (retryStatuses.has(res.status) && attempt < retries) {
        continue;
      }

      return res;
    } catch (error) {
      if (timeoutController.signal.aborted && !init.signal?.aborted) {
        if (attempt < retries) {
          continue;
        }
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }

      if (isNetworkError(error) && attempt < retries) {
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Thin wrapper around `globalThis.fetch` that returns a properly-typed response.
 */
export async function fetchJson(
  url: string,
  init?: RequestInit,
  options?: FetchPolicyOptions,
): Promise<FetchResponse> {
  return fetchWithPolicy(url, init, options);
}
