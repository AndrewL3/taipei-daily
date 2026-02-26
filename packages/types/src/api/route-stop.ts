import { z } from "zod";

const dayFlag = z
  .string()
  .transform((v) => v === "Y");

export const RouteStopRawSchema = z.object({
  city: z.string(),
  lineid: z.string(),
  linename: z.string(),
  rank: z.coerce.number(),
  name: z.string(),
  village: z.string(),
  longitude: z.coerce.number(),
  latitude: z.coerce.number(),
  time: z.string(),
  memo: z.string(),
  garbagesunday: dayFlag,
  garbagemonday: dayFlag,
  garbagetuesday: dayFlag,
  garbagewednesday: dayFlag,
  garbagethursday: dayFlag,
  garbagefriday: dayFlag,
  garbagesaturday: dayFlag,
  recyclingsunday: dayFlag,
  recyclingmonday: dayFlag,
  recyclingtuesday: dayFlag,
  recyclingwednesday: dayFlag,
  recyclingthursday: dayFlag,
  recyclingfriday: dayFlag,
  recyclingsaturday: dayFlag,
  foodscrapssunday: dayFlag,
  foodscrapsmonday: dayFlag,
  foodscrapstuesday: dayFlag,
  foodscrapswednesday: dayFlag,
  foodscrapsthursday: dayFlag,
  foodscrapsfriday: dayFlag,
  foodscrapssaturday: dayFlag,
});

export type RouteStopRaw = z.infer<typeof RouteStopRawSchema>;

export const RouteStopRawArraySchema = z.array(RouteStopRawSchema);

export interface RouteStop {
  city: string;
  lineid: string;
  linename: string;
  rank: number;
  name: string;
  village: string;
  longitude: number;
  latitude: number;
  scheduledTime: string;
  memo: string;
  garbageDays: boolean[];
  recyclingDays: boolean[];
  foodscrapsDays: boolean[];
}

export function transformRouteStop(raw: RouteStopRaw): RouteStop {
  return {
    city: raw.city,
    lineid: raw.lineid,
    linename: raw.linename,
    rank: raw.rank,
    name: raw.name,
    village: raw.village,
    longitude: raw.longitude,
    latitude: raw.latitude,
    scheduledTime: raw.time,
    memo: raw.memo,
    garbageDays: [
      raw.garbagesunday, raw.garbagemonday, raw.garbagetuesday,
      raw.garbagewednesday, raw.garbagethursday, raw.garbagefriday,
      raw.garbagesaturday,
    ],
    recyclingDays: [
      raw.recyclingsunday, raw.recyclingmonday, raw.recyclingtuesday,
      raw.recyclingwednesday, raw.recyclingthursday, raw.recyclingfriday,
      raw.recyclingsaturday,
    ],
    foodscrapsDays: [
      raw.foodscrapssunday, raw.foodscrapsmonday, raw.foodscrapstuesday,
      raw.foodscrapswednesday, raw.foodscrapsthursday, raw.foodscrapsfriday,
      raw.foodscrapssaturday,
    ],
  };
}
