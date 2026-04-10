import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bus } from "lucide-react";
import { useRouteDetail } from "../api/route-hooks";
import { formatEta } from "../utils/format";
import type { BusRouteStop } from "../api/route-types";

function stopStatusColor(minutes: number | null, stopStatus: number): string {
  if (stopStatus !== 0 || minutes == null)
    return "bg-muted text-muted-foreground";
  if (minutes <= 1) return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (minutes <= 5) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
}

function StopRow({ stop }: { stop: BusRouteStop }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Timeline node */}
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full border-2 border-blue-500 bg-background" />
      </div>

      {/* Stop info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{stop.name}</p>
      </div>

      {/* ETA badge */}
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${stopStatusColor(stop.estimateMinutes, stop.stopStatus)}`}
      >
        {formatEta(stop.estimateMinutes, stop.stopStatus, t)}
      </span>
    </div>
  );
}

export default function RouteView() {
  const { routeId } = useParams<{ routeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const city = searchParams.get("city") ?? "Taipei";
  const [direction, setDirection] = useState(
    searchParams.get("dir") === "1" ? 1 : 0,
  );

  const { data, isLoading, error } = useRouteDetail(routeId, direction, city);

  return (
    <div className="view-slide-up flex h-full flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/12 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-1.5 hover:bg-muted"
            aria-label={t("route.back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 shrink-0 text-blue-500" />
              <h1 className="truncate font-display text-lg">
                {data?.route.routeName ?? routeId}
              </h1>
            </div>
            {data?.route && (
              <p className="truncate text-xs text-muted-foreground">
                {data.route.departure} → {data.route.destination}
              </p>
            )}
          </div>
        </div>

        {/* Direction toggle */}
        <div className="flex border-t border-border/12">
          {[0, 1].map((dir) => (
            <button
              key={dir}
              onClick={() => setDirection(dir)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                direction === dir
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dir === 0 ? t("transit.outbound") : t("transit.return")}
            </button>
          ))}
        </div>
      </div>

      {/* Stop list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-1 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-sm text-destructive">
            {t("error.generic")}
          </div>
        )}

        {data?.stops && (
          <div className="divide-y divide-border/8">
            {data.stops.map((stop) => (
              <StopRow key={stop.stopId} stop={stop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
