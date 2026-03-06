import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Bus, MapPin } from "lucide-react";
import { useStationArrivals } from "../api/hooks";
import type { BusStation } from "../api/types";

function formatEta(minutes: number | null, stopStatus: number, t: TFunction): string {
  if (stopStatus === 4) return t("transit.notOperating");
  if (stopStatus === 1) return t("transit.notDeparted");
  if (stopStatus === 3) return t("transit.lastBusLeft");
  if (minutes == null) return "--";
  if (minutes <= 0) return t("transit.arriving");
  return `${minutes} ${t("transit.min")}`;
}

function etaColor(minutes: number | null, stopStatus: number): string {
  if (stopStatus !== 0 || minutes == null) return "text-muted-foreground";
  if (minutes <= 1) return "text-red-500";
  if (minutes <= 5) return "text-amber-500";
  return "text-foreground";
}

interface BusStopDetailContentProps {
  station: BusStation;
}

export default function BusStopDetailContent({
  station,
}: BusStopDetailContentProps) {
  const { t } = useTranslation();
  const { data: arrivals, isLoading } = useStationArrivals(
    station.stationId,
    station.city,
  );

  return (
    <div className="space-y-4">
      {/* Route arrivals */}
      <div className="rounded-xl bg-card px-4 py-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Bus className="h-4 w-4" />
          {t("transit.arrivals")}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded bg-muted"
              />
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
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-sm font-bold text-blue-600 dark:text-blue-400">
                    {a.routeName}
                  </span>
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
