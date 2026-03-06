import { Popup } from "react-leaflet";
import BusStopDetailContent from "./BusStopDetailContent";
import type { BusStation } from "../api/types";

interface BusStopPopupProps {
  station: BusStation;
  onClose: () => void;
}

export default function BusStopPopup({ station, onClose }: BusStopPopupProps) {
  return (
    <Popup
      position={[station.lat, station.lon]}
      offset={[0, -8]}
      closeButton
      eventHandlers={{ remove: onClose }}
      className="bus-stop-popup"
    >
      <div className="min-w-64 max-w-80">
        <div className="mb-3">
          <h3 className="text-foreground text-base font-bold leading-tight">
            {station.name}
          </h3>
          {station.nameEn && (
            <p className="text-muted-foreground text-sm">{station.nameEn}</p>
          )}
        </div>
        <BusStopDetailContent station={station} />
      </div>
    </Popup>
  );
}
