import { lazy, createElement } from "react";
import { CalendarClock, Map, Trash2 } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import GarbageMapLayer from "./map/MapView";
import GarbageDashboardCard from "./dashboard/GarbageDashboardCard";

const SchedulesHubView = lazy(
  () => import("@/core/schedules/SchedulesHubView"),
);
const GarbageSchedulesView = lazy(() => import("./schedules/SchedulesView"));

export const garbageModule: ModuleDefinition = {
  id: "garbage",
  name: "nav.schedules",
  icon: CalendarClock,
  routes: [
    { path: "schedules", element: createElement(SchedulesHubView) },
    { path: "schedules/garbage", element: createElement(GarbageSchedulesView) },
  ],
  mapLayers: [
    {
      id: "garbage",
      name: "map.layers.garbage",
      icon: Trash2,
      defaultVisible: true,
      MapComponent: GarbageMapLayer,
    },
  ],
  dashboardCard: GarbageDashboardCard,
  favoritesConfig: { storageKey: "garbage" },
  quickActions: [
    { label: "dashboard.quickActions.openOnMap", icon: Map, to: "/map" },
    {
      label: "dashboard.quickActions.viewSchedule",
      icon: CalendarClock,
      to: "/schedules/garbage",
    },
  ],
};
