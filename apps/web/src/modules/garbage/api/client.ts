import { apiFetch } from "@/api/client";

export interface NearbyStop {
  routeLineId: string;
  routeLineName: string;
  rank: number;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface RouteListItem {
  lineId: string;
  lineName: string;
  city: string;
  stopCount: number;
  activeVehicles: number;
  leadingStopRank: number | null;
}

export interface AnnotatedStop {
  rank: number;
  name: string;
  village: string;
  scheduledTime: string;
  collectsToday: string[];
  passedAt: string | null;
  eta: string | null;
  latitude?: number;
  longitude?: number;
}

export interface RouteProgress {
  leadingStopRank: number | null;
  totalStops: number;
  deltaMinutes: number | null;
  status: "active" | "completed" | "inactive";
}

export interface RouteDetail {
  route: {
    lineId: string;
    lineName: string;
    city: string;
    geometry?: string | null;
  };
  stops: AnnotatedStop[];
  progress: RouteProgress;
}

export async function fetchNearbyStops(
  lat: number,
  lon: number,
  radius = 500,
): Promise<NearbyStop[]> {
  const json = await apiFetch<{ ok: true; stops: NearbyStop[] }>(
    `/api/stops?lat=${lat}&lon=${lon}&radius=${radius}`,
  );
  return json.stops;
}

export async function fetchRouteList(): Promise<RouteListItem[]> {
  const json = await apiFetch<{ ok: true; routes: RouteListItem[] }>(
    `/api/routes`,
  );
  return json.routes;
}

export async function fetchRouteDetail(lineId: string): Promise<RouteDetail> {
  const json = await apiFetch<{
    ok: true;
    route: RouteDetail["route"];
    stops: AnnotatedStop[];
    progress: RouteProgress;
  }>(`/api/routes?lineId=${encodeURIComponent(lineId)}`);
  return { route: json.route, stops: json.stops, progress: json.progress };
}
