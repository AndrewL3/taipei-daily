import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { useActiveAlerts } from "../api/hooks";
import AlertDetailSheet from "./AlertDetailSheet";

export default function AlertBanner() {
  const { t } = useTranslation();
  const { data: alerts } = useActiveAlerts();
  const [dismissed, setDismissed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  if (!alerts || alerts.length === 0 || dismissed) return null;

  // Use highest severity alert for banner color
  const severityOrder = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
  const highest = alerts.reduce((a, b) =>
    severityOrder.indexOf(a.severity) < severityOrder.indexOf(b.severity)
      ? a
      : b,
  );

  const bgClass =
    highest.severity === "Extreme" || highest.severity === "Severe"
      ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
      : highest.severity === "Moderate"
        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
        : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";

  return (
    <>
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
        className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border p-3 text-left text-sm ${bgClass}`}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">
          {alerts.length === 1
            ? highest.headline
            : t("alerts.bannerMultiple", { count: alerts.length })}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="shrink-0 rounded-full p-1.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={t("alerts.dismiss")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Link
        to="/safety"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>{t("safety.emergencyInfo")}</span>
      </Link>

      <AlertDetailSheet
        alerts={alerts}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
