import { afterAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { cwaFetch } from "../data-sources/cwa.js";

const mockFetch = jest.fn<typeof globalThis.fetch>();
globalThis.fetch = mockFetch;

describe("cwaFetch", () => {
  const originalApiKey = process.env.CWA_API_KEY;

  beforeEach(() => {
    mockFetch.mockReset();
    process.env.CWA_API_KEY = "test-key";
  });

  afterAll(() => {
    process.env.CWA_API_KEY = originalApiKey;
  });

  it("retries transient upstream failures once before succeeding", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({}),
        text: async () => "down",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ success: true }),
        text: async () => "",
      } as Response);

    const result = await cwaFetch<{ success: boolean }>("F-D0047-061");

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=test-key&format=JSON",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
