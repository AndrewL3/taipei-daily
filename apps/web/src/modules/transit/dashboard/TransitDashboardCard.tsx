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
          <Bus className="h-4 w-4 text-blue-500" />
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
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-5 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && nearby && nearby.length > 0 && (
        <div className="space-y-2">
          {nearby.map((station, idx) => (
            <div
              key={station.stationId}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span
                className={`min-w-0 truncate ${idx === 0 ? "font-semibold" : "font-medium text-muted-foreground"}`}
              >
                {station.name}
              </span>
              <span
                className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-blue-600 dark:text-blue-400"
                aria-label={t("dashboard.transit.routeCount", { count: station.routes.length })}
              >
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
        <div className="flex items-start gap-3">
          <Bus className="mt-0.5 h-5 w-5 shrink-0 text-blue-500/30" />
          <div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.transit.noStops")}
            </p>
            <button
              onClick={() => navigate("/schedules/transit")}
              className="mt-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
            >
              {t("dashboard.transit.noStopsAction")} &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
