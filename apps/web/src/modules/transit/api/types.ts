export interface BusStation {
  stationId: string;
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
  city: string;
  routes: { routeId: string; routeName: string; routeNameEn: string }[];
}

export interface BusArrival {
  routeId: string;
  routeName: string;
  routeNameEn: string;
  destination: string;
  direction: number;
  estimateMinutes: number | null;
  stopStatus: number;
  nextBusTime: string | null;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
