import { CircleMarker, Tooltip } from "react-leaflet";
import { useTranslation } from "react-i18next";
import type L from "leaflet";
import type { AedVenue } from "../api/types";

interface AedMarkerProps {
  venue: AedVenue;
  selected: boolean;
  onSelect: (venue: AedVenue) => void;
}

export default function AedMarker({
  venue,
  selected,
  onSelect,
}: AedMarkerProps) {
  const { t } = useTranslation();
  const color = "#ef4444"; // red

  const handleClick = (e: L.LeafletMouseEvent) => {
    const me = e as unknown as { originalEvent?: Event };
    me.originalEvent?.stopPropagation();
    onSelect(venue);
  };

  return (
    <CircleMarker
      center={[venue.lat, venue.lon]}
      radius={selected ? 12 : venue.aedCount > 1 ? 10 : 8}
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
        {venue.name}
        {" — "}
        {venue.aedCount === 1
          ? t("facilities.aedSingle")
          : t("facilities.aedCount", { count: venue.aedCount })}
      </Tooltip>
    </CircleMarker>
  );
}
