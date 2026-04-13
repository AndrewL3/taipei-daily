import { Map, ParkingSquare } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import ParkingMapLayer from "./map/ParkingMapLayer";
import ParkingDashboardCard from "./dashboard/ParkingDashboardCard";

export const parkingModule: ModuleDefinition = {
  id: "parking",
  name: "nav.parking",
  icon: ParkingSquare,
  accentClassName: "text-violet-600 dark:text-violet-400",
  routes: [],
  mapLayers: [
    {
      id: "parking",
      name: "map.layers.parking",
      icon: ParkingSquare,
      activeClassName: "bg-violet-500 text-white shadow-sm",
      defaultVisible: false,
      MapComponent: ParkingMapLayer,
    },
  ],
  dashboardCard: ParkingDashboardCard,
  favoritesConfig: { storageKey: "parking" },
  quickActions: [
    {
      label: "dashboard.quickActions.openOnMap",
      icon: Map,
      to: "/map?layer=parking",
    },
  ],
};
