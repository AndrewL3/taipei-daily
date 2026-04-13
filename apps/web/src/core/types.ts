import type { ComponentType } from "react";
import type { RouteObject } from "react-router";
import type { LatLng, Icon } from "leaflet";

export interface ModuleDefinition {
  id: string;
  name: string; // i18n key
  icon: ComponentType<{ className?: string }>; // Lucide icon for nav
  accentClassName?: string;
  mapNavigationLayerId?: string;
  routes: RouteObject[];
  mapLayers?: MapLayerProvider[];
  searchProvider?: SearchProvider;
  dashboardCard?: ComponentType;
  dashboardCardPlacement?: "hero" | "priority" | "nearby";
  dashboardCardOrder?: number;
  favoritesConfig?: {
    storageKey: string;
  };
  quickActions?: {
    label: string; // i18n key
    icon: ComponentType<{ className?: string }>;
    to: string; // route path
  }[];
}

export interface MapLayerProvider {
  id: string;
  name: string; // i18n key for toggle label
  icon: ComponentType<{ className?: string }>;
  activeClassName?: string;
  defaultVisible: boolean;
  MapComponent: ComponentType; // renders inside shared MapContainer
}

export interface MapMarker {
  id: string;
  position: LatLng;
  icon?: Icon;
  [key: string]: unknown; // module-specific data for popups
}

export interface SearchProvider {
  moduleId: string;
  search(query: string, location?: LatLng): Promise<SearchResult[]>;
  getSuggestions?(partial: string): Promise<string[]>;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  position: LatLng;
  moduleId: string;
}
