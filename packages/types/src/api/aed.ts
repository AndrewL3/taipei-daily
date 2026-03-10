import { z } from "zod";

// --- Raw MOHW AED CSV row schema ---

export const AedCsvRowSchema = z.object({
  場所ID: z.string(),
  場所名稱: z.string(),
  場所縣市: z.string(),
  場所區域: z.string(),
  場所地址: z.string(),
  場所分類: z.string(),
  場所類型: z.string(),
  場所描述: z.string(),
  AEDID: z.string(),
  AED放置地點: z.string(),
  AED地點描述: z.string(),
  地點LAT: z.coerce.number(),
  地點LNG: z.coerce.number(),
  周一至周五起: z.string(),
  周一至周五迄: z.string(),
  周六起: z.string(),
  周六迄: z.string(),
  周日起: z.string(),
  周日迄: z.string(),
  開放使用時間備註: z.string(),
  開放時間緊急連絡電話: z.string(),
});

export const AedCsvRowArraySchema = z.array(AedCsvRowSchema);

export type AedCsvRow = z.infer<typeof AedCsvRowSchema>;

// --- Transformed types ---

export interface AedDevice {
  aedId: string;
  placement: string;
  description: string;
  lat: number;
  lon: number;
  weekdayHours: string | null;
  saturdayHours: string | null;
  sundayHours: string | null;
  hoursNote: string | null;
  phone: string | null;
}

export interface AedVenue {
  venueId: string;
  name: string;
  city: string;
  district: string;
  address: string;
  category: string;
  lat: number;
  lon: number;
  aedCount: number;
  aeds: AedDevice[];
}

// --- Transform function ---

function formatHours(start: string, end: string): string | null {
  if (!start || !end) return null;
  // Strip seconds: "08:00:00" -> "08:00"
  const s = start.slice(0, 5);
  const e = end.slice(0, 5);
  return `${s}-${e}`;
}

export function groupAedsIntoVenues(rows: AedCsvRow[]): AedVenue[] {
  if (rows.length === 0) return [];

  const groups = new Map<string, AedCsvRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.場所ID);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(row.場所ID, [row]);
    }
  }

  const venues: AedVenue[] = [];
  for (const [venueId, venueRows] of groups) {
    const first = venueRows[0];

    const aeds: AedDevice[] = venueRows.map((r) => ({
      aedId: r.AEDID,
      placement: r.AED放置地點,
      description: r.AED地點描述,
      lat: r.地點LAT,
      lon: r.地點LNG,
      weekdayHours: formatHours(r["周一至周五起"], r["周一至周五迄"]),
      saturdayHours: formatHours(r["周六起"], r["周六迄"]),
      sundayHours: formatHours(r["周日起"], r["周日迄"]),
      hoursNote: r.開放使用時間備註 || null,
      phone: r.開放時間緊急連絡電話 || null,
    }));

    // Center coordinates: average of all AED positions
    const lat =
      venueRows.reduce((sum, r) => sum + r.地點LAT, 0) / venueRows.length;
    const lon =
      venueRows.reduce((sum, r) => sum + r.地點LNG, 0) / venueRows.length;

    venues.push({
      venueId,
      name: first.場所名稱,
      city: first.場所縣市,
      district: first.場所區域,
      address: first.場所地址,
      category: first.場所分類,
      lat,
      lon,
      aedCount: aeds.length,
      aeds,
    });
  }

  return venues;
}
