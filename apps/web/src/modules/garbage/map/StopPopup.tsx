import { Popup } from "react-leaflet";
import StopDetailContent from "../stops/StopDetailContent";
import type { NearbyStop } from "../api/client";

interface StopPopupProps {
  stop: NearbyStop;
  onClose: () => void;
}

export default function StopPopup({ stop, onClose }: StopPopupProps) {
  return (
    <Popup
      position={[stop.latitude, stop.longitude]}
      offset={[0, -8]}
      closeButton
      eventHandlers={{ remove: onClose }}
      className="stop-popup"
    >
      <div className="min-w-64 max-w-80">
        <div className="mb-3">
          <h3 className="text-foreground text-base font-bold leading-tight">
            {stop.name}
          </h3>
          <p className="text-muted-foreground text-sm">{stop.routeLineName}</p>
        </div>
        <StopDetailContent stop={stop} onClose={onClose} />
      </div>
    </Popup>
  );
}
