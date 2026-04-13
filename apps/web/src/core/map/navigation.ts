import { getRegisteredModule } from "../module-registry";

export function buildMapNavigationTarget(
  moduleId: string,
  lat: number,
  lon: number,
  zoom = 17,
): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    zoom: String(zoom),
  });
  const layerId = getRegisteredModule(moduleId)?.mapNavigationLayerId;
  if (layerId) {
    params.set("layer", layerId);
  }
  return `/map?${params.toString()}`;
}
