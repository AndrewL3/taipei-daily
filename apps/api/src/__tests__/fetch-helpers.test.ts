import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fetchJson } from "../fetch-helpers.js";

const mockFetch = jest.fn<typeof globalThis.fetch>();
globalThis.fetch = mockFetch;

describe("fetchJson", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("retries once on transient HTTP failures", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({}),
        text: async () => "unavailable",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ ok: true }),
        text: async () => "",
      } as Response);

    const res = await fetchJson("https://example.com/test");

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws a timeout error when the request exceeds the timeout", async () => {
    mockFetch.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal as AbortSignal;
          signal.addEventListener(
            "abort",
            () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" })),
            { once: true },
          );
        }) as ReturnType<typeof globalThis.fetch>,
    );

    await expect(
      fetchJson("https://example.com/slow", undefined, {
        timeoutMs: 1,
        retries: 0,
      }),
    ).rejects.toThrow("Request timed out after 1ms");
  });
});
