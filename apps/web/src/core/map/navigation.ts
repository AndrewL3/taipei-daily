const MODULE_LAYER_OVERRIDES: Partial<Record<string, string>> = {
  parking: "parking",
};

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
  const layerId = MODULE_LAYER_OVERRIDES[moduleId];
  if (layerId) {
    params.set("layer", layerId);
  }
  return `/map?${params.toString()}`;
}
