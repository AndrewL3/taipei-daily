import { useTranslation } from "react-i18next";
import { Bike } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useYouBikeStations } from "../api/hooks";
import { getAvailabilityColor } from "../utils/availability";

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

  const { data: stations, isLoading, isError } = useYouBikeStations(bounds);
  const nearest = stations?.[0];

  return (
    <div className="card-lift rounded-2xl border-t-2 border-emerald-500 bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-icon h-6 w-6 bg-gradient-to-br from-emerald-500 to-green-400 shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
            <Bike className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.youbike.title")}
          </h3>
        </div>
        <button
          onClick={() => navigate("/map")}
          className="text-xs font-medium text-primary/70 hover:text-primary"
        >
          {t("dashboard.viewOnMap")}
        </button>
      </div>

      {isLoading && <div className="h-12 animate-pulse rounded-lg bg-muted" />}

      {!isLoading && nearest && (
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${getAvailabilityColor(nearest)}20` }}
          >
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: getAvailabilityColor(nearest) }}
            >
              {nearest.availableBikes}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{nearest.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("youbike.availableBikes")}: {nearest.availableBikes} ·{" "}
              {t("youbike.emptyDocks")}: {nearest.emptyDocks}
            </p>
          </div>
        </div>
      )}

      {!isLoading && (!nearest || isError) && (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.youbike.noStations")}
        </p>
      )}
    </div>
  );
}
