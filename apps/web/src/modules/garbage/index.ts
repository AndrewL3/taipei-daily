import { lazy, createElement } from "react";
import { Trash2 } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import GarbageMapLayer from "./map/MapView";

const SchedulesView = lazy(() => import("./schedules/SchedulesView"));

export const garbageModule: ModuleDefinition = {
  id: "garbage",
  name: "nav.schedules",
  icon: Trash2,
  routes: [
    { path: "schedules", element: createElement(SchedulesView) },
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
};
