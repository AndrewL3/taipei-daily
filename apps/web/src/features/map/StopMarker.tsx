import { CircleMarker, Tooltip } from "react-leaflet";
import type { NearbyStop } from "@/api/client";

interface StopMarkerProps {
  stop: NearbyStop;
  selected: boolean;
  onSelect: (stop: NearbyStop) => void;
}

export default function StopMarker({
  stop,
  selected,
  onSelect,
}: StopMarkerProps) {
  return (
    <CircleMarker
      center={[stop.latitude, stop.longitude]}
      radius={selected ? 10 : 6}
      pathOptions={{
        color: selected ? "#ca8a04" : "#eab308",
        fillColor: "#eab308",
        fillOpacity: selected ? 1 : 0.8,
        weight: selected ? 3 : 1,
      }}
      eventHandlers={{
        click: () => onSelect(stop),
      }}
    >
      <Tooltip direction="top" offset={[0, -8]}>
        {stop.name}
      </Tooltip>
    </CircleMarker>
  );
}
