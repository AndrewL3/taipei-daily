import { useTranslation } from "react-i18next";
import { Bike } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useYouBikeStations } from "../api/hooks";
import { getAvailabilityColor } from "../utils/availability";
import DataAge from "@/components/DataAge";

export default function YouBikeDashboardCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();

  // Small bounding box around user (~500m)
  const bounds = located
    ? {
        north: position.lat + 0.005,
        south: position.lat - 0.005,
        east: position.lon + 0.005,
        west: position.lon - 0.005,
      }
    : null;

  const {
    data: stations,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useYouBikeStations(bounds);
  const nearest = stations?.[0];

  return (
    <div className="card-lift rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-icon h-6 w-6 bg-gradient-to-br from-emerald-500 to-green-400 shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
            <Bike className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.youbike.title")}
          </h3>
          <DataAge updatedAt={dataUpdatedAt} />
        </div>
        <button
          onClick={() => navigate("/map")}
          className="text-xs font-medium text-primary/80 transition-colors hover:text-primary"
        >
          {t("dashboard.viewOnMap")}
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-1.5 animate-pulse rounded-full bg-muted" />
          <div className="h-5 animate-pulse rounded-lg bg-muted" />
        </div>
      )}

      {!isLoading && nearest && (
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: getAvailabilityColor(nearest) }}
            >
              {nearest.availableBikes}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("youbike.availableBikes")}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${nearest.availableBikes + nearest.emptyDocks > 0 ? (nearest.availableBikes / (nearest.availableBikes + nearest.emptyDocks)) * 100 : 0}%`,
                backgroundColor: getAvailabilityColor(nearest),
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="min-w-0 truncate text-sm font-medium">
              {nearest.name}
            </p>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {nearest.emptyDocks} {t("youbike.emptyDocks")}
            </span>
          </div>
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
            {t("dashboard.youbike.noStations")}
          </p>
          <button
            onClick={() => navigate("/map")}
            className="mt-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
          >
            {t("dashboard.youbike.noStationsAction")} &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
