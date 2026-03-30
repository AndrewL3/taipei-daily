import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { MapPin, ShieldAlert } from "lucide-react";
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
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="stagger mx-auto max-w-lg px-4 pb-8 pt-6">
          {/* Header group — tight spacing within */}
          <div className="space-y-3">
            <h1 className="font-display text-2xl">{t(getGreetingKey())}</h1>
            <SearchBar />
            <AlertBanner />
            <FavoritesDashboardSection />
            {!located && (
              <div className="rounded-xl border border-border/12 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{t("dashboard.enableLocation")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Weather — hero position, generous separation */}
          {heroCards.length > 0 && (
            <div className="mt-6">
              {heroCards.map(({ id, Card }) => (
                <Card key={id} />
              ))}
            </div>
          )}

          {/* Nearby services — labeled section */}
          {hasNearby && (
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
