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
          <Bike className="h-4 w-4 text-emerald-500" />
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
          <div className="flex items-baseline gap-1.5">
            <div className="h-9 w-12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-1.5 animate-pulse rounded-full bg-muted" />
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      )}

      {!isLoading && nearest && (
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-3xl font-bold tabular-nums tracking-tight"
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
            <p className="min-w-0 truncate text-sm font-semibold">
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
        <div className="flex items-start gap-3">
          <Bike className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500/30" />
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
        </div>
      )}
    </div>
  );
}
