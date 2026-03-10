import { Heart } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import FacilitiesMapLayer from "./map/FacilitiesMapLayer";
import FacilitiesDashboardCard from "./dashboard/FacilitiesDashboardCard";

export const facilitiesModule: ModuleDefinition = {
  id: "facilities",
  name: "nav.facilities",
  icon: Heart,
  routes: [],
  mapLayers: [
    {
      id: "facilities",
      name: "map.layers.facilities",
      icon: Heart,
      defaultVisible: false,
      MapComponent: FacilitiesMapLayer,
    },
  ],
  dashboardCard: FacilitiesDashboardCard,
};
