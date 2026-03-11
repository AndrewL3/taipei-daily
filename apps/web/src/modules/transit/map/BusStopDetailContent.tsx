import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Bus, MapPin } from "lucide-react";
import FavoriteButton from "@/core/favorites/FavoriteButton";
import DirectionsButton from "@/components/DirectionsButton";
import { useStationArrivals } from "../api/hooks";
import { formatEta, etaColor } from "../utils/format";
import type { BusStation } from "../api/types";

interface BusStopDetailContentProps {
  station: BusStation;
}

export default function BusStopDetailContent({
  station,
}: BusStopDetailContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: arrivals, isLoading } = useStationArrivals(
    station.stationId,
    station.city,
  );

  return (
    <div className="space-y-4">
      {/* Route arrivals */}
      <div className="rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Bus className="h-4 w-4" />
          {t("transit.arrivals")}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        )}

        {arrivals && arrivals.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            {t("transit.noArrivals")}
          </p>
        )}

        {arrivals && arrivals.length > 0 && (
          <div className="divide-y divide-border">
            {arrivals.map((a, i) => (
              <div
                key={`${a.routeId}-${a.direction}-${i}`}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/transit/route/${a.routeId}?city=${station.city}&dir=${a.direction}`,
                      )
                    }
                    className="rounded bg-blue-500/10 px-2 py-0.5 text-sm font-bold text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                  >
                    {a.routeName}
                  </button>
                  {a.destination && (
                    <span className="text-xs text-muted-foreground">
                      → {a.destination}
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${etaColor(a.estimateMinutes, a.stopStatus)}`}
                >
                  {formatEta(a.estimateMinutes, a.stopStatus, t)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <FavoriteButton
          moduleKey="transit"
          id={station.stationId}
          label={station.name}
          lat={station.lat}
          lon={station.lon}
          data={station}
        />
        <DirectionsButton lat={station.lat} lon={station.lon} />
      </div>

      {/* Station info */}
      <div className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {station.routes.length} {t("transit.routesServed")}
        </span>
      </div>
    </div>
  );
}
