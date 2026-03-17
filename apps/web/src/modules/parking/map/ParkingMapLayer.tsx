import { useState, useCallback, useRef, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useParkingSpaces } from "../api/hooks";
import ParkingMarker from "./ParkingMarker";
import ParkingPopup from "./ParkingPopup";
import ParkingDetail from "./ParkingDetail";
import type { ParkingRoadSegment, MapBounds } from "../api/types";

const MIN_ZOOM = 16;

function ParkingMapEvents({
  onBoundsUpdate,
  onZoom,
  onDeselect,
}: {
  onBoundsUpdate: () => void;
  onZoom: (zoom: number) => void;
  onDeselect: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useMapEvents({
    moveend() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onBoundsUpdate, 500);
    },
    zoomend() {
      clearTimeout(timerRef.current);
      onBoundsUpdate();
    },
    zoomanim(e) {
      onZoom(e.zoom);
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
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [selectedSegment, setSelectedSegment] =
    useState<ParkingRoadSegment | null>(null);
  const selectingRef = useRef(false);

  useEffect(() => {
    const z = map.getZoom();
    setZoom(z);
    if (z >= MIN_ZOOM) setBounds(getBounds(map));
  }, [map]);

  const handleMoveEnd = useCallback(() => {
    const z = map.getZoom();
    setZoom(z);
    if (z >= MIN_ZOOM) setBounds(getBounds(map));
    else setBounds(null);
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

  const { data: segments } = useParkingSpaces(zoom >= MIN_ZOOM ? bounds : null);

  return (
    <>
      <ParkingMapEvents onBoundsUpdate={handleMoveEnd} onZoom={setZoom} onDeselect={handleDeselect} />

      {zoom >= MIN_ZOOM && segments?.map((segment) => (
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
