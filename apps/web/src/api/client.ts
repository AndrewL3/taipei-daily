// Base URL for API requests.
// In production, set VITE_API_URL to the deployed API origin
// (e.g. "https://ntpc-garbage-tracker-api.vercel.app").
// In local dev it defaults to "" so requests go through the Vite proxy.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

// Response types matching the exact shapes from /api/stops and /api/routes

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
}

export interface RouteProgress {
  leadingStopRank: number | null;
  totalStops: number;
  deltaMinutes: number | null;
  status: "active" | "completed" | "inactive";
}

export interface RouteDetail {
  route: { lineId: string; lineName: string; city: string };
  stops: AnnotatedStop[];
  progress: RouteProgress;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "API request failed");
  return json;
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
