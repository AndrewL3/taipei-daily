import { useParams, useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { ArrowLeft, Truck, Trash2, Recycle, Apple } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouteDetail } from "@/api/hooks";

const COLLECTION_ICONS: Record<string, { icon: typeof Trash2; label: string }> =
  {
    garbage: { icon: Trash2, label: "Garbage" },
    recycling: { icon: Recycle, label: "Recycling" },
    foodScraps: { icon: Apple, label: "Food Scraps" },
  };

export default function RouteProgressView() {
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useRouteDetail(lineId);
  const truckRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to truck position on load
  useEffect(() => {
    if (data && truckRef.current) {
      truckRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col">
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Route not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const { route, stops, progress } = data;

  function formatTime(isoOrSchedule: string): string {
    // Handle both "14:30" (schedule) and "2026-...T14:30:00+08:00" (ISO)
    if (isoOrSchedule.includes("T")) return isoOrSchedule.slice(11, 16);
    return isoOrSchedule;
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <div className="border-border flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{route.lineName}</h1>
          <div className="flex items-center gap-2 text-sm">
            {progress.deltaMinutes != null && (
              <Badge
                variant="secondary"
                className={
                  progress.deltaMinutes > 0
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                }
              >
                {progress.deltaMinutes > 0 ? "+" : ""}
                {progress.deltaMinutes} min
              </Badge>
            )}
            <span className="text-muted-foreground">
              {progress.leadingStopRank ?? 0}/{progress.totalStops} stops
            </span>
          </div>
        </div>
      </div>

      {/* Status banners */}
      {progress.status === "inactive" && (
        <div className="bg-muted px-4 py-2 text-center text-sm">
          No trucks active yet
        </div>
      )}
      {progress.status === "completed" && (
        <div className="bg-green-50 px-4 py-2 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Route complete for today
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          {stops.map((stop, i) => {
            const passed = stop.passedAt !== null;
            const isLeading = stop.rank === progress.leadingStopRank;
            const showTruck =
              progress.status === "active" &&
              isLeading &&
              i < stops.length - 1;

            return (
              <div key={stop.rank}>
                {/* Stop node */}
                <div className="flex items-start gap-3">
                  {/* Timeline dot + line */}
                  <div className="flex w-4 flex-col items-center">
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                        passed
                          ? "border-green-500 bg-green-500"
                          : "border-muted-foreground bg-background border-2"
                      }`}
                    />
                    {i < stops.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${
                          passed && stops[i + 1]?.passedAt
                            ? "bg-green-500"
                            : "bg-border border-border border-l-2 border-dashed bg-transparent"
                        }`}
                        style={{ minHeight: "2rem" }}
                      />
                    )}
                  </div>

                  {/* Stop info */}
                  <div className="min-w-0 flex-1 pb-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium">{stop.name}</span>
                      <span className="text-muted-foreground shrink-0 tabular-nums text-sm">
                        {passed
                          ? formatTime(stop.passedAt!)
                          : stop.eta
                            ? `~${formatTime(stop.eta)}`
                            : stop.scheduledTime}
                      </span>
                    </div>
                    {stop.collectsToday.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {stop.collectsToday.map((type) => {
                          const info = COLLECTION_ICONS[type];
                          if (!info) return null;
                          const Icon = info.icon;
                          return (
                            <Badge
                              key={type}
                              variant="outline"
                              className="gap-1 text-xs"
                            >
                              <Icon className="h-3 w-3" />
                              {info.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Truck indicator */}
                {showTruck && (
                  <div
                    ref={truckRef}
                    className="flex items-center gap-3 py-1 pl-0.5"
                  >
                    <Truck className="h-5 w-5 text-yellow-500" />
                    <span className="text-muted-foreground text-xs">
                      Truck here
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
