import { useState, useCallback, useEffect } from "react";
import { useAdminStatus } from "@/api/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
  Activity,
  Database,
  Radio,
  Truck,
} from "lucide-react";
import type {
  AdminStatus,
  ServiceHealth,
  SyncLogEntry,
  AdminRouteStatus,
} from "@/api/client";

// --- Password Gate ---

function PasswordGate({
  onAuth,
  showError,
}: {
  onAuth: (token: string) => void;
  showError?: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAuth(input.trim());
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-card p-6 shadow-md"
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Lock className="h-5 w-5" />
          Admin Dashboard
        </div>
        <Input
          type="password"
          placeholder="Enter admin password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        {showError && (
          <p className="text-sm text-destructive">Invalid password</p>
        )}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
}

// --- Dashboard Panels ---

function ServiceHealthPanel({
  services,
}: {
  services: AdminStatus["services"];
}) {
  const items: {
    label: string;
    icon: React.ReactNode;
    health: ServiceHealth;
  }[] = [
    {
      label: "Database",
      icon: <Database className="h-4 w-4" />,
      health: services.database,
    },
    {
      label: "Redis",
      icon: <Radio className="h-4 w-4" />,
      health: services.redis,
    },
    {
      label: "NTC GPS API",
      icon: <Truck className="h-4 w-4" />,
      health: services.ntcGpsApi,
    },
  ];

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Service Health
      </h2>
      <div className="space-y-3">
        {items.map(({ label, icon, health }) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${health.ok ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="flex items-center gap-1.5 text-sm">
              {icon} {label}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {health.latencyMs}ms
            </span>
            {health.error && (
              <span className="text-xs text-destructive">{health.error}</span>
            )}
          </div>
        ))}
        {services.ntcGpsApi.ok && (
          <p className="pl-5 text-xs text-muted-foreground">
            {services.ntcGpsApi.vehicleCount} vehicles broadcasting
          </p>
        )}
      </div>
    </div>
  );
}

function DataFreshnessPanel({
  freshness,
}: {
  freshness: AdminStatus["freshness"];
}) {
  const gpsAge = freshness.latestGpsTimestamp
    ? Math.round(
        (Date.now() - new Date(freshness.latestGpsTimestamp).getTime()) /
          60_000,
      )
    : null;

  const ageColor =
    gpsAge === null
      ? "text-muted-foreground"
      : gpsAge <= 5
        ? "text-green-500"
        : gpsAge <= 15
          ? "text-yellow-500"
          : "text-red-500";

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Data Freshness
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Latest GPS</span>
          <span className={`text-sm font-medium ${ageColor}`}>
            {gpsAge !== null ? `${gpsAge} min ago` : "Unknown"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Events (last hour)</span>
          <span className="text-sm font-medium">
            {freshness.passEventsLastHour}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Events (today)</span>
          <span className="text-sm font-medium">
            {freshness.passEventsToday}
          </span>
        </div>
      </div>
    </div>
  );
}

function SyncLogPanel({ syncs }: { syncs: SyncLogEntry[] }) {
  if (syncs.length === 0) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cron Sync Log
        </h2>
        <p className="text-sm text-muted-foreground">No recent sync data</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Cron Sync Log
      </h2>
      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {syncs.map((s, i) => {
          const time = new Date(s.timestamp);
          const timeStr = time.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Taipei",
          });
          return (
            <div
              key={`${s.timestamp}-${i}`}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                s.error ? "bg-red-500/10" : "bg-muted/50"
              }`}
            >
              {s.error ? (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
              )}
              <span className="font-mono">{timeStr}</span>
              {s.error ? (
                <span className="truncate text-red-500">{s.error}</span>
              ) : (
                <span className="text-muted-foreground">
                  {s.vehicles}v · {s.routes}r · {s.newPassEvents}pe ·{" "}
                  {s.durationMs}ms
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RouteStatusPanel({ routes }: { routes: AdminRouteStatus[] }) {
  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="border-0 bg-green-500/15 text-green-600 dark:text-green-400">
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="border-0 bg-primary/15 text-primary">Done</Badge>
        );
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  const active = routes.filter((r) => r.status === "active");
  const completed = routes.filter((r) => r.status === "completed");
  const inactive = routes.filter((r) => r.status === "inactive");
  const sorted = [...active, ...completed, ...inactive];

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm md:col-span-2">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Routes ({active.length} active, {completed.length} done,{" "}
        {inactive.length} idle)
      </h2>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="pb-2">Route</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Progress</th>
              <th className="pb-2 text-right">Vehicles</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.lineId} className="border-t border-muted/30">
                <td className="py-1.5">
                  <div className="font-medium">{r.lineName}</div>
                  <div className="text-xs text-muted-foreground">{r.city}</div>
                </td>
                <td className="py-1.5">{statusBadge(r.status)}</td>
                <td className="py-1.5 text-right font-mono text-xs">
                  {r.leadingStopRank ?? 0}/{r.totalStops}
                </td>
                <td className="py-1.5 text-right">{r.activeVehicles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AdminView() {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem("admin_token"),
  );

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } =
    useAdminStatus(token);

  // Handle 401 — clear token and show gate
  const isUnauthorized =
    isError && error instanceof Error && error.message === "Unauthorized";

  useEffect(() => {
    if (isUnauthorized && token) {
      sessionStorage.removeItem("admin_token");
      setToken(null);
    }
  }, [isUnauthorized, token]);

  const handleAuth = useCallback((pw: string) => {
    sessionStorage.setItem("admin_token", pw);
    setToken(pw);
  }, []);

  if (!token || isUnauthorized) {
    return <PasswordGate onAuth={handleAuth} showError={isUnauthorized} />;
  }

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "Asia/Taipei",
      })
    : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated}
            </span>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-5xl p-4">
          {isLoading && !data && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-card p-4 shadow-sm">
                  <Skeleton className="mb-3 h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          )}

          {isError && !isUnauthorized && (
            <div className="rounded-xl bg-destructive/10 p-4 text-center text-sm text-destructive">
              Failed to load dashboard data.{" "}
              <button onClick={() => refetch()} className="underline">
                Retry
              </button>
            </div>
          )}

          {data && (
            <div className="grid gap-4 md:grid-cols-2">
              <ServiceHealthPanel services={data.services} />
              <DataFreshnessPanel freshness={data.freshness} />
              <SyncLogPanel syncs={data.recentSyncs} />
              <RouteStatusPanel routes={data.routes} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
