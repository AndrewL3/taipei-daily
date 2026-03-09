import { z } from "zod";

// --- Raw NTC Parking API schema ---

export const NtcParkingSpaceRawSchema = z.object({
  ID: z.string(),
  CELLID: z.string(),
  NAME: z.string(),
  DAY: z.string(),
  HOUR: z.string(),
  PAY: z.string(),
  PAYCASH: z.string(),
  MEMO: z.string(),
  ROADID: z.string(),
  ROADNAME: z.string(),
  CELLSTATUS: z.string(),
  ISNOWCASH: z.string(),
  ParkingStatus: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  CountyCode: z.string(),
  AreaCode: z.string(),
});

export const NtcParkingSpaceRawArraySchema = z.array(NtcParkingSpaceRawSchema);

export type NtcParkingSpaceRaw = z.infer<typeof NtcParkingSpaceRawSchema>;

// --- Transformed types ---

export interface ParkingRoadSegment {
  roadId: string;
  roadName: string;
  latitude: number;
  longitude: number;
  totalSpaces: number;
  availableSpaces: number;
  pricing: string;
  hours: string;
  days: string;
  memo: string;
}

// --- Transform function ---

export function groupSpacesIntoRoadSegments(
  spaces: NtcParkingSpaceRaw[],
): ParkingRoadSegment[] {
  if (spaces.length === 0) return [];

  const groups = new Map<string, NtcParkingSpaceRaw[]>();
  for (const space of spaces) {
    const existing = groups.get(space.ROADID);
    if (existing) {
      existing.push(space);
    } else {
      groups.set(space.ROADID, [space]);
    }
  }

  const segments: ParkingRoadSegment[] = [];
  for (const [roadId, roadSpaces] of groups) {
    const first = roadSpaces[0];
    const totalSpaces = roadSpaces.length;
    const availableSpaces = roadSpaces.filter(
      (s) => s.CELLSTATUS === "Y" && s.ParkingStatus === "1",
    ).length;

    // Center coordinates: average of all space positions
    const latitude =
      roadSpaces.reduce((sum, s) => sum + s.latitude, 0) / totalSpaces;
    const longitude =
      roadSpaces.reduce((sum, s) => sum + s.longitude, 0) / totalSpaces;

    segments.push({
      roadId,
      roadName: first.ROADNAME,
      latitude,
      longitude,
      totalSpaces,
      availableSpaces,
      pricing: first.PAYCASH,
      hours: first.HOUR,
      days: first.DAY,
      memo: first.MEMO,
    });
  }

  return segments;
}
