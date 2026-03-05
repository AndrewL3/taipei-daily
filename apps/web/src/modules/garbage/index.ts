import { lazy, createElement } from "react";
import { Trash2 } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";

const SchedulesView = lazy(() => import("./schedules/SchedulesView"));

export const garbageModule: ModuleDefinition = {
  id: "garbage",
  name: "nav.routes",
  icon: Trash2,
  routes: [
    { path: "schedules", element: createElement(SchedulesView) },
  ],
};
