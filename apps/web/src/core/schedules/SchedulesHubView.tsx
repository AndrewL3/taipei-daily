import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Trash2, Bus, ChevronRight, Search } from "lucide-react";

const options = [
  {
    path: "/schedules/garbage",
    titleKey: "schedules.hub.garbage",
    descKey: "schedules.hub.garbageDesc",
    Icon: Trash2,
    color: "text-white",
    bg: "gradient-icon bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_2px_8px_rgba(34,197,94,0.3)]",
  },
  {
    path: "/schedules/transit",
    titleKey: "schedules.hub.transit",
    descKey: "schedules.hub.transitDesc",
    Icon: Bus,
    color: "text-white",
    bg: "gradient-icon bg-gradient-to-br from-blue-500 to-indigo-500 shadow-[0_2px_8px_rgba(59,130,246,0.3)]",
  },
] as const;

export default function SchedulesHubView() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="view-enter flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 pb-8 pt-6">
          <div className="space-y-2">
            <div className="section-label">
              <span className="dot" />
              {t("schedules.heading")}
            </div>
            <h1 className="font-display text-2xl">
              {t("schedules.heading")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("schedules.subtitle")}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {options.map((opt) => (
              <button
                key={opt.path}
                onClick={() => navigate(opt.path)}
                className="card-lift flex items-center gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] text-left"
              >
                <div className={`rounded-xl p-3 ${opt.bg}`}>
                  <opt.Icon className={`h-6 w-6 ${opt.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t(opt.titleKey)}</div>
                  <div className="text-sm text-muted-foreground">
                    {t(opt.descKey)}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border/12 px-4 py-3">
            <Search className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("schedules.searchTip")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
