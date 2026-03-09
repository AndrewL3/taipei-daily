import { XMLParser } from "fast-xml-parser";
import {
  NcdrFeedEntryArraySchema,
  type NcdrFeedEntry,
  type ActiveAlert,
} from "@tracker/types";

const FEED_URL = "https://alerts.ncdr.nat.gov.tw/JSONAtomFeeds.ashx";

const TAIPEI_SUMMARY_KEYWORDS = ["台北", "臺北", "新北", "基隆"];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function fetchNcdrFeed(): Promise<NcdrFeedEntry[]> {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`NCDR feed error: ${res.status}`);
  const data = await res.json();

  // Feed may be a single object or array
  const entries = Array.isArray(data) ? data : [data];
  return NcdrFeedEntryArraySchema.parse(entries);
}

export function preFilterEntries(entries: NcdrFeedEntry[]): NcdrFeedEntry[] {
  return entries.filter(
    (e) =>
      e.status === "Actual" &&
      e.msgType !== "Cancel" &&
      TAIPEI_SUMMARY_KEYWORDS.some((kw) => e.summary["#text"].includes(kw)),
  );
}

export async function fetchCapFile(url: string): Promise<ActiveAlert | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const xml = await res.text();
    return parseCapXml(xml);
  } catch {
    return null;
  }
}

export function parseCapXml(xml: string): ActiveAlert | null {
  try {
    const parsed = xmlParser.parse(xml);
    const alert = parsed.alert;
    if (!alert) return null;

    const info = Array.isArray(alert.info) ? alert.info[0] : alert.info;
    if (!info) return null;

    // Extract areas and geocodes
    const areaList = Array.isArray(info.area)
      ? info.area
      : info.area
        ? [info.area]
        : [];
    const areas: string[] = [];
    const geocodes: string[] = [];

    for (const area of areaList) {
      if (area.areaDesc) areas.push(area.areaDesc);
      const gc = area.geocode;
      if (gc) {
        const gcList = Array.isArray(gc) ? gc : [gc];
        for (const g of gcList) {
          if (g.value != null) geocodes.push(String(g.value));
        }
      }
    }

    // Extract alert_color from parameters
    let alertColor = "";
    const params = Array.isArray(info.parameter)
      ? info.parameter
      : info.parameter
        ? [info.parameter]
        : [];
    for (const p of params) {
      if (p.valueName === "website_color") {
        alertColor = String(p.value);
      }
    }

    return {
      id: String(alert.identifier ?? ""),
      headline: String(info.headline ?? info.event ?? ""),
      description: String(info.description ?? ""),
      instruction: String(info.instruction ?? ""),
      severity: info.severity ?? "Unknown",
      urgency: info.urgency ?? "Unknown",
      category: String(info.category ?? ""),
      event: String(info.event ?? ""),
      senderName: String(info.senderName ?? ""),
      effective: String(info.effective ?? alert.sent ?? ""),
      expires: String(info.expires ?? ""),
      alertColor,
      areas,
      geocodes,
      web: info.web ? String(info.web) : undefined,
    };
  } catch {
    return null;
  }
}
