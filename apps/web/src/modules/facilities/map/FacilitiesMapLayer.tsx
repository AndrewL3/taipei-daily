import { useState, useCallback, useRef, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAedVenues } from "../api/hooks";
import AedMarker from "./AedMarker";
import AedPopup from "./AedPopup";
import AedDetail from "./AedDetail";
import type { AedVenue, MapBounds } from "../api/types";

function FacilitiesMapEvents({
  onMoveEnd,
  onDeselect,
}: {
  onMoveEnd: () => void;
  onDeselect: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useMapEvents({
    moveend() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onMoveEnd, 500);
    },
    click() {
      onDeselect();
    },
  });
  return null;
}

function getBounds(map: L.Map): MapBounds {
  const b = map.getBounds();
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

export default function FacilitiesMapLayer() {
  const map = useMap();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<AedVenue | null>(null);
  const selectingRef = useRef(false);

  useEffect(() => {
    setBounds(getBounds(map));
  }, [map]);

  const handleMoveEnd = useCallback(() => {
    setBounds(getBounds(map));
  }, [map]);

  const handleSelect = useCallback((venue: AedVenue) => {
    selectingRef.current = true;
    setSelectedVenue(venue);
    requestAnimationFrame(() => {
      selectingRef.current = false;
    });
  }, []);

  const handleDeselect = useCallback(() => {
    if (selectingRef.current) return;
    setSelectedVenue(null);
  }, []);

  const { data: venues } = useAedVenues(bounds);

  return (
    <>
      <FacilitiesMapEvents
        onMoveEnd={handleMoveEnd}
        onDeselect={handleDeselect}
      />

      {venues?.map((venue) => (
        <AedMarker
          key={venue.venueId}
          venue={venue}
          selected={selectedVenue?.venueId === venue.venueId}
          onSelect={handleSelect}
        />
      ))}

      {isDesktop && selectedVenue && (
        <AedPopup venue={selectedVenue} onClose={handleDeselect} />
      )}

      {!isDesktop && (
        <AedDetail venue={selectedVenue} onClose={handleDeselect} />
      )}
    </>
  );
}
