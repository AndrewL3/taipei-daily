import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  MapPin,
  ShieldAlert,
  Trash2,
  Bus,
  Bike,
  ParkingSquare,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getRegisteredModules } from "../module-registry";
import SearchBar from "../search/SearchBar";
import AlertBanner from "@/modules/alerts/components/AlertBanner";
import FavoritesDashboardSection from "../favorites/FavoritesDashboardSection";

function getGreetingKey(): string {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Taipei",
    }).format(new Date()),
    10,
  );
  if (hour >= 5 && hour < 12) return "dashboard.greeting.morning";
  if (hour >= 12 && hour < 18) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
}

export default function DashboardView() {
  const { t } = useTranslation();
  const { located } = useGeolocation();
  const modules = getRegisteredModules();

  const allCards = modules
    .filter((m) => m.dashboardCard)
    .map((m) => ({ id: m.id, Card: m.dashboardCard! }));

  // Categorize cards by dashboard role for intentional layout
  const heroCards = allCards.filter((c) => c.id === "weather");
  const nearbyCards = allCards.filter((c) =>
    ["garbage", "transit"].includes(c.id),
  );
  const compactCards = allCards.filter((c) =>
    ["youbike", "parking"].includes(c.id),
  );
  const alertCards = allCards.filter((c) => c.id === "alerts");
  const hasNearby = nearbyCards.length > 0 || compactCards.length > 0;

  return (
    <div className="view-enter flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="stagger mx-auto max-w-lg px-4 pb-8 pt-6">
          {/* Header group — tight spacing within */}
          <div className="space-y-3">
            <h1 className="font-display text-2xl">{t(getGreetingKey())}</h1>
            <SearchBar />
            <AlertBanner />
            <FavoritesDashboardSection />
          </div>

          {/* Weather — hero position, generous separation */}
          {heroCards.length > 0 && (
            <div className="mt-6">
              {heroCards.map(({ id, Card }) => (
                <Card key={id} />
              ))}
            </div>
          )}

          {/* Discovery card — shown when location is off */}
          {!located && hasNearby && (
            <div className="card-lift mt-6 rounded-2xl border-t-2 border-teal-500 bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex gap-2.5">
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-teal-500 to-sky-500 shadow-[0_2px_8px_rgba(13,148,136,0.3)]">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-400 shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-500 shadow-[0_2px_8px_rgba(139,92,246,0.3)]">
                  <ParkingSquare className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold">
                {t("dashboard.discovery.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.discovery.description")}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      () => window.location.reload(),
                      () => {},
                      { enableHighAccuracy: true, timeout: 10_000 },
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
                >
                  <MapPin className="h-4 w-4" />
                  {t("dashboard.discovery.enableLocation")}
                </button>
                <Link
                  to="/schedules"
                  className="text-sm font-medium text-primary/70"
                >
                  {t("dashboard.discovery.browseSchedules")} &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Nearby services — labeled section (only when located) */}
          {located && hasNearby && (
            <div className="mt-6">
              <div className="section-label mb-3">
                <span className="dot" />
                {t("dashboard.nearby")}
              </div>
              <div className="space-y-3">
                {nearbyCards.map(({ id, Card }) => (
                  <Card key={id} />
                ))}
                {compactCards.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {compactCards.map(({ id, Card }) => (
                      <Card key={id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerts — separate from location-based cards */}
          {alertCards.length > 0 && (
            <div className="mt-4">
              {alertCards.map(({ id, Card }) => (
                <Card key={id} />
              ))}
            </div>
          )}

          {/* Emergency info — footer with generous separation */}
          <div className="mt-8">
            <Link
              to="/safety"
              className="flex items-center gap-3 rounded-xl border border-border/12 bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50"
            >
              <ShieldAlert className="h-5 w-5 shrink-0 text-orange-500" />
              <div>
                <p className="text-sm font-medium">
                  {t("safety.dashboardTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("safety.dashboardSubtitle")}
                </p>
              </div>
            </Link>
          </div>

          {allCards.length === 0 && located && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t("dashboard.noCards")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
