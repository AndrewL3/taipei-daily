import { CircleMarker, Tooltip } from "react-leaflet";
import { useTranslation } from "react-i18next";
import type L from "leaflet";
import type { ParkingRoadSegment } from "../api/types";
import { getAvailabilityColor } from "../utils/availability";

interface ParkingMarkerProps {
  segment: ParkingRoadSegment;
  selected: boolean;
  onSelect: (segment: ParkingRoadSegment) => void;
}

export default function ParkingMarker({
  segment,
  selected,
  onSelect,
}: ParkingMarkerProps) {
  const { t } = useTranslation();
  const color = getAvailabilityColor(segment);

  const handleClick = (e: L.LeafletMouseEvent) => {
    const me = e as unknown as { originalEvent?: Event };
    me.originalEvent?.stopPropagation();
    onSelect(segment);
  };

  return (
    <CircleMarker
      center={[segment.latitude, segment.longitude]}
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
        {segment.roadName}
        {" — "}
        {segment.availableSpaces}/{segment.totalSpaces} {t("parking.spaces")}
      </Tooltip>
    </CircleMarker>
  );
}
