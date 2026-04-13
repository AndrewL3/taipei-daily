import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  fetchCapFile,
  parseCapXml,
  preFilterEntries,
} from "../src/data-sources/ncdr.js";
import type { NcdrFeedEntry } from "@tracker/types";

const sampleCap = `<?xml version="1.0" encoding="utf-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>CWA-Weather_test_001</identifier>
  <sender>weather@cwa.gov.tw</sender>
  <sent>2026-03-09T16:00:00+08:00</sent>
  <status>Actual</status>
  <msgType>Update</msgType>
  <scope>Public</scope>
  <info>
    <language>zh-TW</language>
    <category>Met</category>
    <event>強風</event>
    <urgency>Expected</urgency>
    <severity>Moderate</severity>
    <certainty>Likely</certainty>
    <effective>2026-03-09T16:00:00+08:00</effective>
    <expires>2026-03-10T00:00:00+08:00</expires>
    <senderName>中央氣象署</senderName>
    <headline>陸上強風特報</headline>
    <description>東北風明顯偏強</description>
    <instruction>注意安全</instruction>
    <web>https://www.cwa.gov.tw</web>
    <parameter>
      <valueName>website_color</valueName>
      <value>255,255,0</value>
    </parameter>
    <area>
      <areaDesc>新北市板橋區</areaDesc>
      <geocode>
        <valueName>Taiwan_Geocode_103</valueName>
        <value>6500100</value>
      </geocode>
    </area>
    <area>
      <areaDesc>台北市信義區</areaDesc>
      <geocode>
        <valueName>Taiwan_Geocode_103</valueName>
        <value>6300200</value>
      </geocode>
    </area>
  </info>
</alert>`;

describe("parseCapXml", () => {
  it("extracts core fields from CAP XML", () => {
    const alert = parseCapXml(sampleCap);
    expect(alert).not.toBeNull();
    expect(alert!.id).toBe("CWA-Weather_test_001");
    expect(alert!.headline).toBe("陸上強風特報");
    expect(alert!.severity).toBe("Moderate");
    expect(alert!.urgency).toBe("Expected");
    expect(alert!.event).toBe("強風");
    expect(alert!.senderName).toBe("中央氣象署");
    expect(alert!.alertColor).toBe("255,255,0");
    expect(alert!.web).toBe("https://www.cwa.gov.tw");
  });

  it("extracts areas and geocodes", () => {
    const alert = parseCapXml(sampleCap);
    expect(alert!.areas).toEqual(["新北市板橋區", "台北市信義區"]);
    expect(alert!.geocodes).toEqual(["6500100", "6300200"]);
  });

  it("extracts effective and expires timestamps", () => {
    const alert = parseCapXml(sampleCap);
    expect(alert!.effective).toBe("2026-03-09T16:00:00+08:00");
    expect(alert!.expires).toBe("2026-03-10T00:00:00+08:00");
  });

  it("extracts description and instruction", () => {
    const alert = parseCapXml(sampleCap);
    expect(alert!.description).toBe("東北風明顯偏強");
    expect(alert!.instruction).toBe("注意安全");
    expect(alert!.category).toBe("Met");
  });

  it("returns null for invalid XML", () => {
    expect(parseCapXml("not xml")).toBeNull();
  });

  it("returns null for XML without alert element", () => {
    expect(parseCapXml("<root><data/></root>")).toBeNull();
  });

  it("handles single area element", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>SINGLE_AREA</identifier>
  <sent>2026-03-09T12:00:00+08:00</sent>
  <info>
    <event>大雨</event>
    <severity>Moderate</severity>
    <urgency>Immediate</urgency>
    <area>
      <areaDesc>台北市中正區</areaDesc>
      <geocode>
        <valueName>Taiwan_Geocode_103</valueName>
        <value>6300100</value>
      </geocode>
    </area>
  </info>
</alert>`;
    const alert = parseCapXml(xml);
    expect(alert).not.toBeNull();
    expect(alert!.areas).toEqual(["台北市中正區"]);
    expect(alert!.geocodes).toEqual(["6300100"]);
  });

  it("handles missing optional fields gracefully", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>MINIMAL</identifier>
  <sent>2026-03-09T12:00:00+08:00</sent>
  <info>
    <event>Test</event>
    <area>
      <areaDesc>TestArea</areaDesc>
    </area>
  </info>
</alert>`;
    const alert = parseCapXml(xml);
    expect(alert).not.toBeNull();
    expect(alert!.id).toBe("MINIMAL");
    expect(alert!.headline).toBe("Test");
    expect(alert!.web).toBeUndefined();
    expect(alert!.alertColor).toBe("");
    expect(alert!.geocodes).toEqual([]);
  });
});

describe("fetchCapFile", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("rejects CAP URLs outside the NCDR allowlist", async () => {
    const result = await fetchCapFile("https://example.com/test.cap");

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects oversized CAP responses before parsing", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) =>
          name === "content-length" ? String(300 * 1024) : null,
      },
      body: undefined,
      text: async () => sampleCap,
    });

    const result = await fetchCapFile(
      "https://alerts.ncdr.nat.gov.tw/Capstorage/CWA/2026/test.cap",
    );

    expect(result).toBeNull();
  });

  it("parses CAP responses from the allowed host", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) =>
          name === "content-length"
            ? String(Buffer.byteLength(sampleCap, "utf8"))
            : null,
      },
      body: undefined,
      text: async () => sampleCap,
    });

    const result = await fetchCapFile(
      "https://alerts.ncdr.nat.gov.tw/Capstorage/CWA/2026/test.cap",
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe("CWA-Weather_test_001");
  });
});

describe("preFilterEntries", () => {
  const makeEntry = (
    status: string,
    msgType: string,
    summary: string,
  ): NcdrFeedEntry => ({
    id: "test",
    title: "test",
    updated: "2026-03-09T00:00:00+08:00",
    author: { name: "test" },
    link: { "@rel": "alternate", "@href": "https://example.com/test.cap" },
    summary: { "@type": "html", "#text": summary },
    category: { "@term": "test" },
    status,
    msgType,
  });

  it("keeps Actual non-Cancel entries mentioning 新北", () => {
    const entries = [makeEntry("Actual", "Update", "新北市沿海強風")];
    expect(preFilterEntries(entries)).toHaveLength(1);
  });

  it("keeps entries mentioning 台北", () => {
    const entries = [makeEntry("Actual", "Alert", "台北市暴雨特報")];
    expect(preFilterEntries(entries)).toHaveLength(1);
  });

  it("keeps entries mentioning 臺北 (traditional form)", () => {
    const entries = [makeEntry("Actual", "Alert", "臺北地區大雨")];
    expect(preFilterEntries(entries)).toHaveLength(1);
  });

  it("keeps entries mentioning 基隆", () => {
    const entries = [makeEntry("Actual", "Alert", "基隆市暴雨")];
    expect(preFilterEntries(entries)).toHaveLength(1);
  });

  it("filters out Cancel messages", () => {
    const entries = [makeEntry("Actual", "Cancel", "新北市解除警報")];
    expect(preFilterEntries(entries)).toHaveLength(0);
  });

  it("filters out non-Actual status", () => {
    const entries = [makeEntry("Test", "Alert", "台北市暴雨")];
    expect(preFilterEntries(entries)).toHaveLength(0);
  });

  it("filters out entries not mentioning Greater Taipei", () => {
    const entries = [makeEntry("Actual", "Alert", "台中市地區降雨")];
    expect(preFilterEntries(entries)).toHaveLength(0);
  });

  it("handles empty array", () => {
    expect(preFilterEntries([])).toEqual([]);
  });

  it("handles mixed entries correctly", () => {
    const entries = [
      makeEntry("Actual", "Alert", "台北市暴雨"),
      makeEntry("Actual", "Cancel", "新北市解除"),
      makeEntry("Test", "Alert", "台北市測試"),
      makeEntry("Actual", "Update", "高雄市大雨"),
      makeEntry("Actual", "Update", "基隆市強風"),
    ];
    const result = preFilterEntries(entries);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(entries[0]);
    expect(result[1]).toBe(entries[4]);
  });
});
