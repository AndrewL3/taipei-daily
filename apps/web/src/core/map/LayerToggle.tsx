import { useTranslation } from "react-i18next";
import type { MapLayerProvider } from "../types";

interface LayerToggleProps {
  layers: MapLayerProvider[];
  visibility: Record<string, boolean>;
  onToggle: (layerId: string) => void;
}

export default function LayerToggle({
  layers,
  visibility,
  onToggle,
}: LayerToggleProps) {
  const { t } = useTranslation();

  // Don't render if only one layer
  if (layers.length < 2) return null;

  return (
    <div className="absolute right-3 top-14 z-[1000]">
      <div className="glass flex flex-col gap-0.5 rounded-2xl p-1 shadow-lg">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isVisible = visibility[layer.id] !== false;
          return (
            <button
              key={layer.id}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isVisible
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onToggle(layer.id)}
              aria-label={t(layer.name)}
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5">
                <Icon />
              </span>
              <span>{t(layer.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
