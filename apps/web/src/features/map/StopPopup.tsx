import { Popup } from "react-leaflet";
import StopDetailContent from "@/features/stops/StopDetailContent";
import type { NearbyStop } from "@/api/client";

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
      <div className="min-w-56 max-w-72">
        <div className="mb-3">
          <h3 className="text-foreground text-base font-semibold leading-tight">
            {stop.name}
          </h3>
          <p className="text-muted-foreground text-sm">{stop.routeLineName}</p>
        </div>
        <StopDetailContent stop={stop} />
      </div>
    </Popup>
  );
}
