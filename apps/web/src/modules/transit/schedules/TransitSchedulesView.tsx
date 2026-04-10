import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Search, Bus, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBusRoutes } from "../api/hooks";
import type { BusRoute } from "../api/types";

/** Numeric-aware sort for route names like "3", "28", "307", "紅5", "棕20" */
function sortRoutes(routes: BusRoute[]): BusRoute[] {
  return [...routes].sort((a, b) =>
    a.routeName.localeCompare(b.routeName, "zh-TW", { numeric: true }),
  );
}

export default function TransitSchedulesView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: routes, isLoading, isError } = useBusRoutes();

  const sorted = useMemo(
    () => (routes ? sortRoutes(routes) : []),
    [routes],
  );

  const filtered = useMemo(() => {
    if (!search) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (r) =>
        r.routeName.toLowerCase().includes(q) ||
        r.routeNameEn.toLowerCase().includes(q) ||
        r.departure.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q),
    );
  }, [sorted, search]);

  return (
    <div className="view-slide-up flex h-full flex-col bg-background">
      <div className="sticky top-0 z-10 space-y-3 bg-background px-4 py-4 shadow-sm md:pl-48">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/schedules")}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <div className="section-label">
              <span className="dot" />
              Transit
            </div>
            <h1 className="font-display text-2xl">
              {t("schedules.hub.transit")}
            </h1>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("schedules.transit.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border-0 bg-muted pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background">
        <div className="flex flex-col gap-2 p-4 md:pl-48">
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}

          {isError && (
            <div className="px-4 py-12 text-center text-sm text-destructive">
              {t("schedules.failedToLoad")}
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {search ? t("schedules.noMatch") : t("schedules.noRoutes")}
            </div>
          )}

          {filtered.map((route) => (
            <button
              key={`${route.city}-${route.routeId}`}
              onClick={() =>
                navigate(
                  `/transit/route/${route.routeId}?city=${route.city}&dir=0`,
                )
              }
              className="card-lift flex items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Bus className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{route.routeName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {route.departure} ↔ {route.destination}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {route.city === "Taipei" ? "北市" : "新北"}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
