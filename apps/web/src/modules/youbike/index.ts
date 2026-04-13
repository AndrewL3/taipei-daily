import { Bike, Map } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import YouBikeMapLayer from "./map/YouBikeMapLayer";
import YouBikeDashboardCard from "./dashboard/YouBikeDashboardCard";

export const youbikeModule: ModuleDefinition = {
  id: "youbike",
  name: "nav.youbike",
  icon: Bike,
  accentClassName: "text-lime-600 dark:text-lime-400",
  routes: [],
  mapLayers: [
    {
      id: "youbike",
      name: "map.layers.youbike",
      icon: Bike,
      activeClassName: "bg-lime-600 text-white shadow-sm",
      defaultVisible: true,
      MapComponent: YouBikeMapLayer,
    },
  ],
  dashboardCard: YouBikeDashboardCard,
  favoritesConfig: { storageKey: "youbike" },
  quickActions: [
    { label: "dashboard.quickActions.openOnMap", icon: Map, to: "/map" },
  ],
};
