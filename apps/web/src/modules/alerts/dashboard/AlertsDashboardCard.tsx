import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { useActiveAlerts } from "../api/hooks";
import AlertDetailSheet from "../components/AlertDetailSheet";

export default function AlertsDashboardCard() {
  const { t } = useTranslation();
  const { data: alerts, isLoading } = useActiveAlerts();
  const [detailOpen, setDetailOpen] = useState(false);

  const activeAlerts = alerts ?? [];

  // Find highest severity for display
  const severityOrder = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
  const highest =
    activeAlerts.length > 0
      ? activeAlerts.reduce((a, b) =>
          severityOrder.indexOf(a.severity) < severityOrder.indexOf(b.severity)
            ? a
            : b,
        )
      : null;

  return (
    <div className="card-lift rounded-2xl border-t-2 border-rose-500 bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-icon h-6 w-6 bg-gradient-to-br from-rose-500 to-red-500 shadow-[0_2px_8px_rgba(244,63,94,0.3)]">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.alerts.title")}
          </h3>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={() => setDetailOpen(true)}
            className="text-xs font-medium text-primary/70 hover:text-primary"
          >
            {t("alerts.title")}
          </button>
        )}
      </div>

      {isLoading && <div className="h-12 animate-pulse rounded-lg bg-muted" />}

      {!isLoading && activeAlerts.length > 0 && highest && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDetailOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setDetailOpen(true);
            }
          }}
          className="cursor-pointer rounded-lg bg-muted/50 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
              {activeAlerts.length}
            </span>
            <p className="flex-1 truncate text-sm">{highest.headline}</p>
          </div>
        </div>
      )}

      {!isLoading && activeAlerts.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("alerts.noAlerts")}</p>
      )}

      <AlertDetailSheet
        alerts={activeAlerts}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
