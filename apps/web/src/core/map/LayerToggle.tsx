import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
    <div className="absolute top-4 right-4 z-[1000]">
      <div className="glass flex rounded-full p-1 shadow-lg">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isVisible = visibility[layer.id] !== false;
          return (
            <Button
              key={layer.id}
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full transition-colors ${
                isVisible
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onToggle(layer.id)}
              aria-label={t(layer.name)}
              title={t(layer.name)}
            >
              <Icon />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
