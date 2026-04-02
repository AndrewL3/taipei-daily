import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyStops } from "../api/hooks";

export default function GarbageDashboardCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();
  const {
    data: stops,
    isLoading,
    isError,
    refetch,
  } = useNearbyStops(
    located ? position.lat : null,
    located ? position.lon : null,
    500,
  );

  const nearest = stops?.[0];

  return (
    <div className="card-lift rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-icon h-6 w-6 bg-gradient-to-br from-teal-500 to-sky-500 shadow-[0_2px_8px_rgba(13,148,136,0.3)]">
            <Trash2 className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.garbage.title")}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/schedules/garbage")}
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

      {isLoading && <div className="h-12 animate-pulse rounded-lg bg-muted" />}

      {!isLoading && nearest && (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{nearest.name}</p>
            <p className="text-xs text-muted-foreground">
              {nearest.routeLineName}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-teal-600 dark:text-teal-400">
            {Math.round(nearest.distance)}m
          </span>
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

      {!isLoading && !isError && !nearest && (
        <div>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.garbage.noStops")}
          </p>
          <button
            onClick={() => navigate("/schedules/garbage")}
            className="mt-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
          >
            {t("dashboard.garbage.noStopsAction")} &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
