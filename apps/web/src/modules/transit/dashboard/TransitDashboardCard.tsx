import { useTranslation } from "react-i18next";
import { Bus } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBusStations } from "../api/hooks";

export default function TransitDashboardCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();

  const bounds = located
    ? {
        north: position.lat + 0.003,
        south: position.lat - 0.003,
        east: position.lon + 0.003,
        west: position.lon - 0.003,
      }
    : null;

  const { data: stations, isLoading, isError, refetch } = useBusStations(bounds);
  const nearby = stations?.slice(0, 3);

  return (
    <div className="card-lift rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-icon h-6 w-6 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
            <Bus className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.transit.title")}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/schedules/transit")}
            className="text-xs font-medium text-primary/80 transition-colors hover:text-primary"
          >
            {t("dashboard.actionSchedule")}
          </button>
          <span className="text-muted-foreground/30">·</span>
          <button
            onClick={() => navigate("/map")}
            className="text-xs font-medium text-primary/80 transition-colors hover:text-primary"
          >
            {t("dashboard.actionMap")}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && nearby && nearby.length > 0 && (
        <div className="space-y-2">
          {nearby.map((station) => (
            <div
              key={station.stationId}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium">
                {station.name}
              </span>
              <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-blue-600 dark:text-blue-400">
                {station.routes.length}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t("error.generic")}</p>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium text-primary"
          >
            {t("error.retry")}
          </button>
        </div>
      )}

      {!isLoading && !isError && (!nearby || nearby.length === 0) && (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.transit.noStops")}
        </p>
      )}
    </div>
  );
}
