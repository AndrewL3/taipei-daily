import { useTranslation } from "react-i18next";
import { ParkingSquare } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useParkingSpaces } from "../api/hooks";
import { getAvailabilityColor } from "../utils/availability";
import DataAge from "@/components/DataAge";

export default function ParkingDashboardCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();

  const bounds = located
    ? {
        north: position.lat + 0.005,
        south: position.lat - 0.005,
        east: position.lon + 0.005,
        west: position.lon - 0.005,
      }
    : null;

  const {
    data: segments,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useParkingSpaces(bounds);
  const nearest = segments?.[0];

  return (
    <div className="card-lift rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-icon h-6 w-6 bg-gradient-to-br from-violet-500 to-purple-500 shadow-[0_2px_8px_rgba(139,92,246,0.3)]">
            <ParkingSquare className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.parking.title")}
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

      {isLoading && <div className="h-12 animate-pulse rounded-lg bg-muted" />}

      {!isLoading && nearest && (
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: getAvailabilityColor(nearest) }}
            >
              {nearest.availableSpaces}
            </span>
            <span className="text-sm text-muted-foreground">
              /{nearest.totalSpaces}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{nearest.roadName}</p>
            <p className="text-xs text-muted-foreground">{nearest.pricing}</p>
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
            {t("dashboard.parking.noSpaces")}
          </p>
          <button
            onClick={() => navigate("/map")}
            className="mt-1 text-xs font-medium text-primary/80 transition-colors hover:text-primary"
          >
            {t("dashboard.parking.noSpacesAction")} &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
