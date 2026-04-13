import { CloudSun } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import WeatherDashboardCard from "./dashboard/WeatherDashboardCard";

export const weatherModule: ModuleDefinition = {
  id: "weather",
  name: "nav.weather",
  icon: CloudSun,
  accentClassName: "text-sky-600 dark:text-sky-400",
  routes: [],
  mapLayers: [],
  dashboardCard: WeatherDashboardCard,
  dashboardCardPlacement: "hero",
  dashboardCardOrder: 10,
};
