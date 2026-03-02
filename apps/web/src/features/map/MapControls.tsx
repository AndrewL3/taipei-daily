import { Plus, Minus, Crosshair } from "lucide-react";
import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";

interface MapControlsProps {
  userLat: number;
  userLon: number;
}

export default function MapControls({ userLat, userLon }: MapControlsProps) {
  const map = useMap();

  return (
    <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-1.5 md:bottom-4">
      <div className="glass flex flex-col overflow-hidden rounded-xl shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none"
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="mx-2 border-t border-border" />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none"
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      <div className="glass overflow-hidden rounded-xl shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-none"
          onClick={() => map.flyTo([userLat, userLon], 16)}
          aria-label="Recenter on my location"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
