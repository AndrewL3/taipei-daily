import { CircleMarker, Tooltip } from "react-leaflet";
import { useTranslation } from "react-i18next";
import type L from "leaflet";
import type { BusStation } from "../api/types";

interface BusStopMarkerProps {
  station: BusStation;
  selected: boolean;
  onSelect: (station: BusStation) => void;
}

export default function BusStopMarker({
  station,
  selected,
  onSelect,
}: BusStopMarkerProps) {
  const { t } = useTranslation();
  const color = "#3b82f6"; // blue-500

  const handleClick = (e: L.LeafletMouseEvent) => {
    const me = e as unknown as { originalEvent?: Event };
    me.originalEvent?.stopPropagation();
    onSelect(station);
  };

  return (
    <CircleMarker
      center={[station.lat, station.lon]}
      radius={selected ? 10 : 6}
      bubblingMouseEvents={false}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: selected ? 3 : 1,
      }}
      eventHandlers={{ click: handleClick }}
    >
      <Tooltip direction="top" offset={[0, -8]}>
        {station.name}
        {" — "}
        {station.routes.length} {t("transit.routesServed")}
      </Tooltip>
    </CircleMarker>
  );
}
