import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouteList } from "../api/hooks";
import ErrorMessage from "@/components/ErrorMessage";
import type { RouteListItem } from "../api/client";

function getRouteStatus(
  route: RouteListItem,
): "active" | "completed" | "inactive" {
  if (route.activeVehicles === 0) return "inactive";
  if (
    route.leadingStopRank !== null &&
    route.leadingStopRank >= route.stopCount
  )
    return "completed";
  return "active";
}

function statusOrder(status: string): number {
  if (status === "active") return 0;
  if (status === "inactive") return 1;
  return 2;
}

const STATUS_DOT_COLORS = {
  active: "bg-green-500",
  inactive: "bg-muted-foreground/40",
  completed: "bg-primary",
};

const PROGRESS_FILL_COLORS = {
  active: "bg-green-500/20",
  completed: "bg-primary/20",
  inactive: "",
};

export default function SchedulesView() {
  const { data: routes, isLoading, isError, refetch } = useRouteList();
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    if (!routes) return [];
    const q = search.toLowerCase();
    return routes
      .filter((r) => !q || r.lineName.toLowerCase().includes(q))
      .sort((a, b) => {
        const sa = statusOrder(getRouteStatus(a));
        const sb = statusOrder(getRouteStatus(b));
        if (sa !== sb) return sa - sb;
        return a.lineName.localeCompare(b.lineName, "zh-Hant");
      });
  }, [routes, search]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header — solid surface, shadow */}
      <div className="sticky top-0 z-10 space-y-3 bg-background px-4 py-4 shadow-sm md:pl-48">
        <div className="space-y-1">
          <div className="section-label">
            <span className="dot" />
            Routes
          </div>
          <h1 className="font-display text-2xl">{t("schedules.heading")}</h1>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("schedules.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border-0 bg-muted pl-9"
          />
        </div>
      </div>

      {/* Route list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 bg-background p-4 md:pl-48">
          {isError && (
            <ErrorMessage
              message={t("schedules.failedToLoad")}
              onRetry={() => refetch()}
            />
          )}

          {isLoading &&
            !isError &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}

          {!isLoading && filtered.length === 0 && (
            <div className="text-muted-foreground px-4 py-12 text-center text-sm">
              {search ? t("schedules.noMatch") : t("schedules.noRoutes")}
            </div>
          )}

          {filtered.map((route) => {
            const status = getRouteStatus(route);
            const progress =
              status !== "inactive" && route.leadingStopRank !== null
                ? Math.round((route.leadingStopRank / route.stopCount) * 100)
                : 0;

            return (
              <Link
                key={route.lineId}
                to={`/route/${route.lineId}`}
                className="card-lift group rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-3">
                  {/* Status dot */}
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_COLORS[status]}`}
                  />
                  {/* Route name */}
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">
                    {route.lineName}
                  </span>
                  {/* Progress pill */}
                  {status !== "inactive" && (
                    <div className="relative inline-flex h-6 shrink-0 items-center overflow-hidden rounded-full bg-muted">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${PROGRESS_FILL_COLORS[status]}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                      <span className="relative px-2.5 text-xs font-medium tabular-nums text-foreground">
                        {route.leadingStopRank ?? 0}/{route.stopCount}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
