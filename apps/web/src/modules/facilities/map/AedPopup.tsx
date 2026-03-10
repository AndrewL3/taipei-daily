import { Popup } from "react-leaflet";
import AedDetailContent from "../components/AedDetailContent";
import type { AedVenue } from "../api/types";

interface AedPopupProps {
  venue: AedVenue;
  onClose: () => void;
}

export default function AedPopup({ venue, onClose }: AedPopupProps) {
  return (
    <Popup
      position={[venue.lat, venue.lon]}
      offset={[0, -8]}
      closeButton
      eventHandlers={{ remove: onClose }}
      className="aed-popup"
    >
      <div className="min-w-64 max-w-80">
        <div className="mb-3">
          <h3 className="text-foreground text-base font-bold leading-tight">
            {venue.name}
          </h3>
        </div>
        <AedDetailContent venue={venue} />
      </div>
    </Popup>
  );
}
