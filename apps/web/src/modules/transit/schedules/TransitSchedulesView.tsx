import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Search, Bus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBusStations } from "../api/hooks";

export default function TransitSchedulesView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();
  const [search, setSearch] = useState("");

  const bounds = located
    ? {
        north: position.lat + 0.005,
        south: position.lat - 0.005,
        east: position.lon + 0.005,
        west: position.lon - 0.005,
      }
    : null;

  const { data: stations, isLoading } = useBusStations(bounds);

  const filtered = stations?.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.routes.some((r) => r.routeName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="sticky top-0 z-10 space-y-3 bg-background px-4 py-4 shadow-sm md:pl-48">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/schedules")}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">
            {t("schedules.hub.transit")}
          </h1>
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

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4 md:pl-48">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}

          {!isLoading && (!filtered || filtered.length === 0) && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {!located
                ? t("dashboard.transit.noStops")
                : search
                  ? t("schedules.noMatch")
                  : t("dashboard.transit.noStops")}
            </div>
          )}

          {filtered?.map((station) => (
            <button
              key={station.stationId}
              onClick={() =>
                navigate(
                  `/map?lat=${station.lat}&lon=${station.lon}&zoom=17`,
                )
              }
              className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm text-left transition-all hover:shadow-md active:scale-[0.99]"
            >
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Bus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{station.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {station.routes
                    .slice(0, 5)
                    .map((r) => r.routeName)
                    .join(", ")}
                  {station.routes.length > 5 &&
                    ` +${station.routes.length - 5}`}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {station.routes.length} {t("transit.routesServed")}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
