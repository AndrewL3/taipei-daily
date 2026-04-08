// Base URL for API requests.
// In production, set VITE_API_URL to the deployed API origin
// (e.g. "https://ntpc-garbage-tracker-api.vercel.app").
// In local dev it defaults to "" so requests go through the Vite proxy.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "API request failed");
  return json;
}

// --- Admin types ---

export interface ServiceHealth {
  ok: boolean;
  latencyMs: number;
  error?: string;
  vehicleCount?: number;
}

export interface SyncLogEntry {
  timestamp: string;
  vehicles: number;
  routes: number;
  newPassEvents: number;
  durationMs: number;
  error: string | null;
}

export interface AdminRouteStatus {
  lineId: string;
  lineName: string;
  city: string;
  totalStops: number;
  activeVehicles: number;
  leadingStopRank: number | null;
  lastEventAt: string | null;
  status: "active" | "completed" | "inactive";
}

export interface AdminStatus {
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    ntcGpsApi: ServiceHealth & { vehicleCount: number };
  };
  freshness: {
    latestGpsTimestamp: string | null;
    passEventsLastHour: number;
    passEventsToday: number;
  };
  recentSyncs: SyncLogEntry[];
  routes: AdminRouteStatus[];
}

export async function fetchAdminStatus(token: string): Promise<AdminStatus> {
  const res = await fetch(`${API_BASE}/api/admin/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Admin API request failed");
  return json;
}
