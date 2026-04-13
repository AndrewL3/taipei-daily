import { XMLParser } from "fast-xml-parser";
import {
  NcdrFeedEntryArraySchema,
  type NcdrFeedEntry,
  type ActiveAlert,
} from "@tracker/types";

const FEED_URL = "https://alerts.ncdr.nat.gov.tw/JSONAtomFeeds.ashx";
const FEED_HOSTNAME = "alerts.ncdr.nat.gov.tw";
const ALLOWED_CAP_HOSTNAMES = new Set([FEED_HOSTNAME]);
const ALLOWED_ALERT_WEB_HOST_SUFFIX = ".gov.tw";
const CAP_FETCH_TIMEOUT_MS = 5_000;
const MAX_CAP_BYTES = 256 * 1024;

const TAIPEI_SUMMARY_KEYWORDS = ["台北", "臺北", "新北", "基隆"];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // CAP files do not require entity expansion for the fields we consume.
  processEntities: { enabled: false },
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

function isAllowedCapUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && ALLOWED_CAP_HOSTNAMES.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function sanitizeAlertWebUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const hasAllowedHost =
      hostname === "gov.tw" || hostname.endsWith(ALLOWED_ALERT_WEB_HOST_SUFFIX);

    if (
      parsed.protocol !== "https:" ||
      !hasAllowedHost ||
      parsed.username ||
      parsed.password ||
      (parsed.port !== "" && parsed.port !== "443")
    ) {
      return undefined;
    }

    parsed.username = "";
    parsed.password = "";
    if (parsed.port === "443") parsed.port = "";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

async function fetchCapXmlText(url: string): Promise<string | null> {
  if (!isAllowedCapUrl(url)) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CAP_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const contentLength = Number(res.headers.get("content-length") ?? "");
    if (Number.isFinite(contentLength) && contentLength > MAX_CAP_BYTES) {
      return null;
    }

    if (!res.body) {
      const xml = await res.text();
      return Buffer.byteLength(xml, "utf8") <= MAX_CAP_BYTES ? xml : null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let totalBytes = 0;
    let xml = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_CAP_BYTES) {
        await reader.cancel();
        return null;
      }

      xml += decoder.decode(value, { stream: true });
    }

    xml += decoder.decode();
    return xml;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchCapFile(url: string): Promise<ActiveAlert | null> {
  try {
    const xml = await fetchCapXmlText(url);
    if (!xml) return null;
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
      web: sanitizeAlertWebUrl(
        info.web ? String(info.web) : undefined,
      ),
    };
  } catch {
    return null;
  }
}
