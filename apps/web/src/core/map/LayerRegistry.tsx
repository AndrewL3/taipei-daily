import type { MapLayerProvider } from "../types";

interface LayerRegistryProps {
  layers: MapLayerProvider[];
  visibility: Record<string, boolean>;
}

export default function LayerRegistry({
  layers,
  visibility,
}: LayerRegistryProps) {
  return (
    <>
      {layers
        .filter((layer) => visibility[layer.id] !== false)
        .map((layer) => (
          <layer.MapComponent key={layer.id} />
        ))}
    </>
  );
}
