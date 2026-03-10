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

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
