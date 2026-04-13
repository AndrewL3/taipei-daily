import { Bus, CalendarClock, Map } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import TransitMapLayer from "./map/TransitMapLayer";
import TransitDashboardCard from "./dashboard/TransitDashboardCard";

export const transitModule: ModuleDefinition = {
  id: "transit",
  name: "nav.transit",
  icon: Bus,
  accentClassName: "text-blue-600 dark:text-blue-400",
  routes: [],
  mapLayers: [
    {
      id: "transit",
      name: "map.layers.transit",
      icon: Bus,
      activeClassName: "bg-blue-500 text-white shadow-sm",
      defaultVisible: true,
      MapComponent: TransitMapLayer,
    },
  ],
  dashboardCard: TransitDashboardCard,
  dashboardCardPlacement: "nearby",
  dashboardCardOrder: 20,
  favoritesConfig: { storageKey: "transit" },
  quickActions: [
    { label: "dashboard.quickActions.openOnMap", icon: Map, to: "/map" },
    {
      label: "dashboard.quickActions.viewSchedule",
      icon: CalendarClock,
      to: "/schedules/transit",
    },
  ],
};
