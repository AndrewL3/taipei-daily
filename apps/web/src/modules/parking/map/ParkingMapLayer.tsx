import { useState, useCallback, useRef, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useParkingSpaces } from "../api/hooks";
import ParkingMarker from "./ParkingMarker";
import ParkingPopup from "./ParkingPopup";
import ParkingDetail from "./ParkingDetail";
import type { ParkingRoadSegment, MapBounds } from "../api/types";

function ParkingMapEvents({
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

export default function ParkingMapLayer() {
  const map = useMap();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedSegment, setSelectedSegment] =
    useState<ParkingRoadSegment | null>(null);
  const selectingRef = useRef(false);

  useEffect(() => {
    setBounds(getBounds(map));
  }, [map]);

  const handleMoveEnd = useCallback(() => {
    setBounds(getBounds(map));
  }, [map]);

  const handleSelect = useCallback((segment: ParkingRoadSegment) => {
    selectingRef.current = true;
    setSelectedSegment(segment);
    requestAnimationFrame(() => {
      selectingRef.current = false;
    });
  }, []);

  const handleDeselect = useCallback(() => {
    if (selectingRef.current) return;
    setSelectedSegment(null);
  }, []);

  const { data: segments } = useParkingSpaces(bounds);

  return (
    <>
      <ParkingMapEvents onMoveEnd={handleMoveEnd} onDeselect={handleDeselect} />

      {segments?.map((segment) => (
        <ParkingMarker
          key={segment.roadId}
          segment={segment}
          selected={selectedSegment?.roadId === segment.roadId}
          onSelect={handleSelect}
        />
      ))}

      {isDesktop && selectedSegment && (
        <ParkingPopup segment={selectedSegment} onClose={handleDeselect} />
      )}

      {!isDesktop && (
        <ParkingDetail segment={selectedSegment} onClose={handleDeselect} />
      )}
    </>
  );
}
