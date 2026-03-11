import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Trash2, Bus, ChevronRight } from "lucide-react";

const options = [
  {
    path: "/schedules/garbage",
    titleKey: "schedules.hub.garbage",
    descKey: "schedules.hub.garbageDesc",
    Icon: Trash2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  {
    path: "/schedules/transit",
    titleKey: "schedules.hub.transit",
    descKey: "schedules.hub.transitDesc",
    Icon: Bus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
] as const;

export default function SchedulesHubView() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="px-4 py-4 md:pl-48">
        <h1 className="text-2xl font-bold">{t("schedules.heading")}</h1>
      </div>
      <div className="flex flex-col gap-3 px-4 md:pl-48">
        {options.map((opt) => (
          <button
            key={opt.path}
            onClick={() => navigate(opt.path)}
            className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] text-left"
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
    </div>
  );
}
