import { CloudSun } from "lucide-react";
import type { ModuleDefinition } from "@/core/types";
import WeatherDashboardCard from "./dashboard/WeatherDashboardCard";

export const weatherModule: ModuleDefinition = {
  id: "weather",
  name: "nav.weather",
  icon: CloudSun,
  routes: [],
  mapLayers: [],
  dashboardCard: WeatherDashboardCard,
};
