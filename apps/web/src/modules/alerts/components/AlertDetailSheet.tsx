import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { ActiveAlert } from "../api/types";

interface AlertDetailSheetProps {
  alerts: ActiveAlert[];
  open: boolean;
  onClose: () => void;
}

const severityStyles: Record<string, string> = {
  Extreme: "bg-red-600 text-white",
  Severe: "bg-orange-500 text-white",
  Moderate: "bg-yellow-400 text-black",
  Minor: "bg-blue-400 text-white",
  Unknown: "bg-muted text-muted-foreground",
};

function formatRelativeExpiry(
  expires: string,
  now: number,
  language: string,
  expiredLabel: string,
): string {
  const diff = new Date(expires).getTime() - now;
  if (diff <= 0) return expiredLabel;

  const rtf = new Intl.RelativeTimeFormat(language, {
    numeric: "auto",
    style: "short",
  });
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) {
    return rtf.format(minutes, "minute");
  }
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) {
    return rtf.format(hours, "hour");
  }
  const days = Math.round(diff / 86_400_000);
  return rtf.format(days, "day");
}

export default function AlertDetailSheet({
  alerts,
  open,
  onClose,
}: AlertDetailSheetProps) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} modal={false}>
      <DrawerContent>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/20" />
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("alerts.title")}</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-5 pb-8">
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("alerts.noAlerts")}
            </p>
          )}
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-border/30 bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityStyles[alert.severity] ?? severityStyles.Unknown}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-sm font-semibold">{alert.event}</span>
                </div>

                <p className="mb-1 text-sm font-medium">{alert.headline}</p>

                <p className="mb-1 text-xs text-muted-foreground">
                  {t("alerts.sender")}: {alert.senderName}
                </p>

                {alert.description && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                )}

                {alert.instruction && (
                  <div className="mb-2">
                    <p className="text-xs font-medium">
                      {t("alerts.instruction")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {alert.instruction}
                    </p>
                  </div>
                )}

                {alert.areas.length > 0 && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {t("alerts.areas")}: {alert.areas.join(", ")}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {t("alerts.expires")}:{" "}
                    {formatRelativeExpiry(
                      alert.expires,
                      now,
                      i18n.resolvedLanguage ?? i18n.language,
                      t("alerts.expired"),
                    )}
                  </p>
                  {alert.web && (
                    <a
                      href={alert.web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {t("alerts.viewOfficial")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
