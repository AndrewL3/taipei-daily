import { useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  AttributionControl,
} from "react-leaflet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTheme } from "@/lib/theme";
import { getRegisteredModules } from "../module-registry";
import MapControls from "./MapControls";
import UserLocationMarker from "./UserLocationMarker";
import LayerRegistry from "./LayerRegistry";
import LayerToggle from "./LayerToggle";
import type { MapLayerProvider } from "../types";

const LIGHT_TILES =
  "https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}";
const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://maps.nlsc.gov.tw/">NLSC</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

function collectMapLayers(): MapLayerProvider[] {
  return getRegisteredModules().flatMap((mod) => mod.mapLayers ?? []);
}

function buildDefaultVisibility(
  layers: MapLayerProvider[],
): Record<string, boolean> {
  const vis: Record<string, boolean> = {};
  for (const layer of layers) {
    vis[layer.id] = layer.defaultVisible;
  }
  return vis;
}

export default function SharedMapView() {
  const { position, located } = useGeolocation();
  const { isDark } = useTheme();
  const [layers] = useState(collectMapLayers);
  const [visibility, setVisibility] = useState(() =>
    buildDefaultVisibility(layers),
  );

  const handleToggle = useCallback((layerId: string) => {
    setVisibility((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      <MapContainer
        center={[position.lat, position.lon]}
        zoom={16}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          key={isDark ? "dark" : "light"}
          url={isDark ? DARK_TILES : LIGHT_TILES}
          attribution={ATTRIBUTION}
        />
        <AttributionControl position="bottomright" prefix={false} />
        <MapControls userLat={position.lat} userLon={position.lon} />
        {located && (
          <UserLocationMarker lat={position.lat} lon={position.lon} />
        )}
        <LayerRegistry layers={layers} visibility={visibility} />
      </MapContainer>
      <LayerToggle
        layers={layers}
        visibility={visibility}
        onToggle={handleToggle}
      />
    </div>
  );
}
