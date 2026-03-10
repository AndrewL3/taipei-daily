import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAedVenues } from "../api/hooks";
import type { AedVenue } from "../api/types";

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = (lat2 - lat1) * 111_320;
  const dLon = (lon2 - lon1) * 111_320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function FacilitiesDashboardCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();

  const bounds = located
    ? {
        north: position.lat + 0.01,
        south: position.lat - 0.01,
        east: position.lon + 0.01,
        west: position.lon - 0.01,
      }
    : null;

  const { data: venues, isLoading, isError } = useAedVenues(bounds);

  const nearest = useMemo<{ venue: AedVenue; distance: number } | null>(() => {
    if (!venues?.length || !located) return null;
    let best = venues[0];
    let bestDist = distanceMeters(
      position.lat,
      position.lon,
      best.lat,
      best.lon,
    );
    for (let i = 1; i < venues.length; i++) {
      const d = distanceMeters(
        position.lat,
        position.lon,
        venues[i].lat,
        venues[i].lon,
      );
      if (d < bestDist) {
        best = venues[i];
        bestDist = d;
      }
    }
    return { venue: best, distance: bestDist };
  }, [venues, located, position.lat, position.lon]);

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
          <h3 className="text-sm font-semibold">
            {t("dashboard.facilities.title")}
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <span className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
              {nearest.venue.aedCount}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{nearest.venue.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistance(nearest.distance)} · {nearest.venue.aedCount} AED
              · {nearest.venue.district}
            </p>
          </div>
        </div>
      )}

      {!isLoading && (!nearest || isError) && (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.facilities.noAed")}
        </p>
      )}
    </div>
  );
}
