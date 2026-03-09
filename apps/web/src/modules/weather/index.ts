import { createElement, lazy } from "react";
import { CloudSun } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import WeatherDashboardCard from "./dashboard/WeatherDashboardCard";

const WeatherDetailView = lazy(() => import("./views/WeatherDetailView"));

export const weatherModule: ModuleDefinition = {
  id: "weather",
  name: "nav.weather",
  icon: CloudSun,
  routes: [
    {
      path: "weather",
      element: createElement(WeatherDetailView),
    },
  ],
  mapLayers: [],
  dashboardCard: WeatherDashboardCard,
};
