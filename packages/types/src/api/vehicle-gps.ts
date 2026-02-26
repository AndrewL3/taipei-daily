import { z } from "zod";

export const VehicleGpsSchema = z.object({
  lineid: z.string(),
  car: z.string(),
  time: z.string(),
  location: z.string(),
  longitude: z.coerce.number(),
  latitude: z.coerce.number(),
  cityid: z.string(),
  cityname: z.string(),
});

export type VehicleGps = z.infer<typeof VehicleGpsSchema>;

export const VehicleGpsArraySchema = z.array(VehicleGpsSchema);
export type VehicleGpsArray = z.infer<typeof VehicleGpsArraySchema>;
