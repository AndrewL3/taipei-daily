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

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
