// Base URL for API requests.
// In production, set VITE_API_URL to the deployed API origin
// (e.g. "https://ntpc-garbage-tracker-api.vercel.app").
// In local dev it defaults to "" so requests go through the Vite proxy.
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

const INVALID_RESPONSE_MESSAGE = "Invalid server response";

type ApiEnvelope = {
  ok?: boolean;
  error?: string;
};

function isJsonResponse(res: Response): boolean {
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("/json") || contentType.includes("+json");
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }

  return fallback;
}

async function parseApiEnvelope(
  res: Response,
  requestErrorMessage: string,
): Promise<ApiEnvelope> {
  if (!isJsonResponse(res)) {
    if (!res.ok) throw new Error(requestErrorMessage);
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  if (!res.ok) {
    throw new Error(getErrorMessage(payload, requestErrorMessage));
  }

  return payload as ApiEnvelope;
}

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await parseApiEnvelope(res, "API request failed");
  if (!json.ok) throw new Error(json.error ?? "API request failed");
  return json as T;
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
  const json = await parseApiEnvelope(res, "Admin API request failed");
  if (!json.ok) throw new Error(json.error ?? "Admin API request failed");
  return json as AdminStatus;
}
