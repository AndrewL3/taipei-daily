import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Trash2,
  Bike,
  Bus,
  ParkingSquare,
  HelpCircle,
  X,
} from "lucide-react";

const STORAGE_KEY = "map-legend-dismissed";

const LEGEND_ITEMS = [
  { icon: Trash2, color: "text-teal-500", labelKey: "map.layers.garbage" },
  { icon: Bike, color: "text-lime-600", labelKey: "map.layers.youbike" },
  { icon: Bus, color: "text-blue-500", labelKey: "map.layers.transit" },
  {
    icon: ParkingSquare,
    color: "text-violet-500",
    labelKey: "map.layers.parking",
  },
] as const;

export default function MapLegend() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (dismissed) {
    return (
      <div className="absolute bottom-20 left-3 z-[999] md:bottom-4">
        <button
          onClick={() => setDismissed(false)}
          className="glass rounded-full p-2 shadow-lg transition-colors hover:bg-muted/50"
          aria-label={t("map.legend")}
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-20 left-3 z-[999] md:bottom-4">
      <div className="overlay-enter glass rounded-xl p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("map.legend")}
          </h3>
          <button
            onClick={dismiss}
            className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            aria-label={t("map.legendDismiss")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-1.5">
          {LEGEND_ITEMS.map(({ icon: Icon, color, labelKey }) => (
            <div key={labelKey} className="flex items-center gap-2">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
              <span className="text-xs">{t(labelKey)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("map.legendHint")}
        </p>
      </div>
    </div>
  );
}
