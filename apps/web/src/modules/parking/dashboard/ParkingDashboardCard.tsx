import { useTranslation } from "react-i18next";
import { ParkingSquare } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useParkingSpaces } from "../api/hooks";
import { getAvailabilityColor } from "../utils/availability";

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

  const { data: segments, isLoading, isError } = useParkingSpaces(bounds);
  const nearest = segments?.[0];

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ParkingSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold">
            {t("dashboard.parking.title")}
          </h3>
        </div>
        <button
          onClick={() => navigate("/map")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("dashboard.viewOnMap")}
        </button>
      </div>

      {isLoading && <div className="h-12 animate-pulse rounded-lg bg-muted" />}

      {!isLoading && nearest && (
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${getAvailabilityColor(nearest)}20`,
            }}
          >
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: getAvailabilityColor(nearest) }}
            >
              {nearest.availableSpaces}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{nearest.roadName}</p>
            <p className="text-xs text-muted-foreground">
              {nearest.availableSpaces}/{nearest.totalSpaces}{" "}
              {t("parking.spaces")} · {nearest.pricing}
            </p>
          </div>
        </div>
      )}

      {!isLoading && (!nearest || isError) && (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.parking.noSpaces")}
        </p>
      )}
    </div>
  );
}
