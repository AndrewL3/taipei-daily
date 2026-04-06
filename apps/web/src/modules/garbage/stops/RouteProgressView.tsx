import { useParams, useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Truck, Trash2, Recycle, Apple, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouteDetail } from "../api/hooks";
import ErrorMessage from "@/components/ErrorMessage";

export default function RouteProgressView() {
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useRouteDetail(lineId);
  const truckRef = useRef<HTMLDivElement>(null);

  const COLLECTION_ICONS: Record<
    string,
    { icon: typeof Trash2; title: string }
  > = {
    garbage: { icon: Trash2, title: t("collection.garbage") },
    recycling: { icon: Recycle, title: t("collection.recycling") },
    foodScraps: { icon: Apple, title: t("collection.foodScraps") },
  };

  useEffect(() => {
    if (data && truckRef.current) {
      truckRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <div className="flex items-center gap-3 bg-background px-4 py-3 shadow-sm">
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

  if (isError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-background">
        <ErrorMessage
          message={t("route.failedToLoad")}
          onRetry={() => refetch()}
        />
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-2">
          {t("route.goBack")}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">{t("route.notFound")}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t("route.goBack")}
        </Button>
      </div>
    );
  }

  const { route, stops, progress } = data;

  function formatTime(isoOrSchedule: string): string {
    if (isoOrSchedule.includes("T")) return isoOrSchedule.slice(11, 16);
    return isoOrSchedule;
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Sticky header — solid surface with shadow */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background px-4 py-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl">{route.lineName}</h1>
          <div className="flex items-center gap-2 text-sm">
            {progress.deltaMinutes != null && (
              <Badge
                variant="secondary"
                className={
                  progress.deltaMinutes > 0
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                }
              >
                {progress.deltaMinutes > 0 ? "+" : ""}
                {progress.deltaMinutes} {t("unit.min")}
              </Badge>
            )}
            <span className="text-muted-foreground">
              {t("route.stopsProgress", {
                passed: progress.leadingStopRank ?? 0,
                total: progress.totalStops,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Status banners */}
      {progress.status === "inactive" && (
        <div className="bg-muted px-4 py-2 text-center text-sm">
          {t("route.noTrucksActive")}
        </div>
      )}
      {progress.status === "completed" && (
        <div className="bg-primary/10 px-4 py-2 text-center text-sm text-primary">
          {t("route.completeForToday")}
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="bg-background px-4 py-4">
          {stops.map((stop, i) => {
            const passed = stop.passedAt !== null;
            const isLeading = stop.rank === progress.leadingStopRank;
            const isActive = isLeading && progress.status === "active";
            const showTruck = isActive && i < stops.length - 1;

            return (
              <div key={stop.rank}>
                {/* Stop node */}
                <div
                  className={`flex items-start gap-3 ${passed && !isActive ? "opacity-50" : ""}`}
                >
                  {/* Timeline dot + line */}
                  <div className="flex w-6 flex-col items-center">
                    {/* Dot */}
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-full ${
                        isActive
                          ? "h-7 w-7 border-2 border-primary bg-primary/20"
                          : passed
                            ? "h-6 w-6 bg-primary text-primary-foreground"
                            : "h-6 w-6 border-2 border-muted-foreground/50 bg-background"
                      }`}
                    >
                      {passed && !isActive && (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      )}
                    </div>
                    {/* Connecting line */}
                    {i < stops.length - 1 && (
                      <div
                        className={`flex-1 ${
                          passed && stops[i + 1]?.passedAt
                            ? "w-1 bg-primary"
                            : "w-0.5 border-l-2 border-dashed border-muted-foreground/20 bg-transparent"
                        }`}
                        style={{ minHeight: "2.5rem" }}
                      />
                    )}
                  </div>

                  {/* Stop info */}
                  <div className="min-w-0 flex-1 pb-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate ${isActive ? "text-base font-bold" : "font-medium"}`}
                      >
                        {stop.name}
                      </span>
                      <span
                        className={`shrink-0 tabular-nums text-sm ${
                          passed
                            ? "text-muted-foreground"
                            : stop.eta
                              ? "font-medium text-primary"
                              : ""
                        }`}
                      >
                        {passed
                          ? formatTime(stop.passedAt!)
                          : stop.eta
                            ? `~${formatTime(stop.eta)}`
                            : stop.scheduledTime}
                      </span>
                    </div>
                    {/* Collection type icons — compact row */}
                    {stop.collectsToday.length > 0 && (
                      <div className="mt-1 flex gap-1.5">
                        {stop.collectsToday.map((type) => {
                          const info = COLLECTION_ICONS[type];
                          if (!info) return null;
                          const Icon = info.icon;
                          return (
                            <Icon
                              key={type}
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-label={info.title}
                            />
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
                    className="ml-8 mb-3 flex items-center gap-2 rounded-xl border-l-4 border-primary bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2.5"
                  >
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {t("route.truckIsHere")}
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
