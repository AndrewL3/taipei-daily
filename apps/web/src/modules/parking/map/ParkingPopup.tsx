import { Popup } from "react-leaflet";
import ParkingDetailContent from "./ParkingDetailContent";
import type { ParkingRoadSegment } from "../api/types";

interface ParkingPopupProps {
  segment: ParkingRoadSegment;
  onClose: () => void;
}

export default function ParkingPopup({ segment, onClose }: ParkingPopupProps) {
  return (
    <Popup
      position={[segment.latitude, segment.longitude]}
      offset={[0, -8]}
      closeButton
      eventHandlers={{ remove: onClose }}
      className="parking-popup"
    >
      <div className="min-w-64 max-w-80">
        <div className="mb-3">
          <h3 className="text-foreground text-base font-bold leading-tight">
            {segment.roadName}
          </h3>
        </div>
        <ParkingDetailContent segment={segment} />
      </div>
    </Popup>
  );
}
