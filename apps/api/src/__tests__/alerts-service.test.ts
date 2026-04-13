import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockFetchNcdrFeed = jest.fn<any>();
const mockPreFilterEntries = jest.fn<any>();
const mockFetchCapFile = jest.fn<any>();

jest.unstable_mockModule("../../src/redis.js", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

jest.unstable_mockModule("../../src/data-sources/ncdr.js", () => ({
  fetchNcdrFeed: mockFetchNcdrFeed,
  preFilterEntries: mockPreFilterEntries,
  fetchCapFile: mockFetchCapFile,
  sanitizeAlertWebUrl: (url: string | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("https://") && url.includes(".gov.tw")) return url;
    return undefined;
  },
}));

const { getActiveAlerts } = await import("../../src/alerts/active.js");

describe("getActiveAlerts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisSet.mockResolvedValue(undefined);
  });

  it("sanitizes cached alert links before returning them", async () => {
    mockRedisGet.mockResolvedValue([
      {
        id: "cached-alert",
        headline: "Alert",
        description: "Description",
        instruction: "Instruction",
        severity: "Moderate",
        urgency: "Expected",
        category: "Met",
        event: "Heavy Rain",
        senderName: "Agency",
        effective: "2026-04-13T10:00:00+08:00",
        expires: "2026-04-13T12:00:00+08:00",
        alertColor: "",
        areas: ["台北市"],
        geocodes: ["6300100"],
        web: "javascript:alert(1)",
      },
    ]);

    const alerts = await getActiveAlerts();

    expect(alerts).toEqual([
      expect.objectContaining({
        id: "cached-alert",
        web: undefined,
      }),
    ]);
    expect(mockFetchNcdrFeed).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it("fetches, filters, caches, and returns live alerts", async () => {
    mockRedisGet.mockResolvedValue(null);
    const relevantEntries = [
      {
        link: { "@href": "https://alerts.ncdr.nat.gov.tw/Capstorage/CWA/2026/a.cap" },
      },
      {
        link: { "@href": "https://alerts.ncdr.nat.gov.tw/Capstorage/CWA/2026/b.cap" },
      },
    ];
    mockFetchNcdrFeed.mockResolvedValue([{ id: "entry" }]);
    mockPreFilterEntries.mockReturnValue(relevantEntries);
    mockFetchCapFile
      .mockResolvedValueOnce({
        id: "alert-a",
        headline: "A",
        description: "",
        instruction: "",
        severity: "Moderate",
        urgency: "Expected",
        category: "Met",
        event: "Rain",
        senderName: "Agency",
        effective: "2026-04-13T10:00:00+08:00",
        expires: "2026-04-13T12:00:00+08:00",
        alertColor: "",
        areas: ["台北市"],
        geocodes: ["6300100"],
        web: "https://www.cwa.gov.tw/warning",
      })
      .mockResolvedValueOnce({
        id: "alert-b",
        headline: "B",
        description: "",
        instruction: "",
        severity: "Moderate",
        urgency: "Expected",
        category: "Met",
        event: "Wind",
        senderName: "Agency",
        effective: "2026-04-13T10:00:00+08:00",
        expires: "2026-04-13T12:00:00+08:00",
        alertColor: "",
        areas: ["台中市"],
        geocodes: ["6600100"],
        web: "https://example.com/phish",
      });

    const alerts = await getActiveAlerts();

    expect(mockFetchNcdrFeed).toHaveBeenCalled();
    expect(mockPreFilterEntries).toHaveBeenCalledWith([{ id: "entry" }]);
    expect(mockFetchCapFile).toHaveBeenCalledTimes(2);
    expect(alerts).toEqual([
      expect.objectContaining({
        id: "alert-a",
        web: "https://www.cwa.gov.tw/warning",
      }),
    ]);
    expect(mockRedisSet).toHaveBeenCalledWith("alerts:active", alerts, {
      ex: 300,
    });
  });
});
