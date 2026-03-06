import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getRegisteredModules } from "../module-registry";

export default function DashboardView() {
  const { t } = useTranslation();
  const { located } = useGeolocation();
  const modules = getRegisteredModules();

  const cards = modules
    .filter((m) => m.dashboardCard)
    .map((m) => ({
      id: m.id,
      Card: m.dashboardCard!,
    }));

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

          {!located && (
            <div className="rounded-xl border border-border/12 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 shrink-0" />
                <p className="text-sm">{t("dashboard.enableLocation")}</p>
              </div>
            </div>
          )}

          {cards.map(({ id, Card }) => (
            <Card key={id} />
          ))}

          {cards.length === 0 && located && (
            <p className="text-center text-sm text-muted-foreground">
              {t("dashboard.noCards")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
