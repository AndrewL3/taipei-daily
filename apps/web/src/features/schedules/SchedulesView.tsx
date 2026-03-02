import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, ChevronRight, Circle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouteList } from "@/api/hooks";
import ErrorMessage from "@/components/ErrorMessage";
import type { RouteListItem } from "@/api/client";

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

const STATUS_BAR_COLORS = {
  active: "bg-green-500",
  inactive: "bg-muted-foreground/30",
  completed: "bg-primary",
};

export default function SchedulesView() {
  const { data: routes, isLoading, isError, refetch } = useRouteList();
  const [search, setSearch] = useState("");

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
    <div className="flex h-full flex-col">
      {/* Sticky glass header */}
      <div className="glass sticky top-0 z-10 space-y-3 px-4 py-3">
        <h1 className="text-lg font-semibold">Routes</h1>
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Route list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {isError && (
            <ErrorMessage
              message="Failed to load routes"
              onRetry={() => refetch()}
            />
          )}

          {isLoading &&
            !isError &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}

          {!isLoading && filtered.length === 0 && (
            <div className="text-muted-foreground px-4 py-8 text-center text-sm">
              {search ? "No routes match your search" : "No routes available"}
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
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-md"
              >
                {/* Left accent bar */}
                <div
                  className={`w-1 self-stretch rounded-full ${STATUS_BAR_COLORS[status]} ${
                    status === "active" ? "animate-[bar-pulse_2s_ease-in-out_infinite]" : ""
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{route.lineName}</p>

                  <div className="mt-1.5 flex items-center gap-2 text-sm">
                    {status === "active" && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                      >
                        <Circle className="mr-1 h-2 w-2 fill-current" />
                        Active
                      </Badge>
                    )}
                    {status === "inactive" && (
                      <Badge variant="secondary">
                        <Circle className="mr-1 h-2 w-2" />
                        Inactive
                      </Badge>
                    )}
                    {status === "completed" && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    )}
                  </div>

                  {/* Progress bar */}
                  {status !== "inactive" && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status === "completed" ? "bg-primary" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {route.leadingStopRank ?? 0}/{route.stopCount}
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
