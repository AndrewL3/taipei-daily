import { useState, useCallback, useRef, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useBusStations } from "../api/hooks";
import BusStopMarker from "./BusStopMarker";
import BusStopPopup from "./BusStopPopup";
import BusStopDetail from "./BusStopDetail";
import type { BusStation, MapBounds } from "../api/types";

const MIN_ZOOM = 19;

function TransitMapEvents({
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
      // Fires BEFORE animation with target zoom — lets React unmount markers early
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

export default function TransitMapLayer() {
  const map = useMap();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [selectedStation, setSelectedStation] = useState<BusStation | null>(
    null,
  );
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

  const handleSelect = useCallback((station: BusStation) => {
    selectingRef.current = true;
    setSelectedStation(station);
    requestAnimationFrame(() => {
      selectingRef.current = false;
    });
  }, []);

  const handleDeselect = useCallback(() => {
    if (selectingRef.current) return;
    setSelectedStation(null);
  }, []);

  const { data: stations } = useBusStations(zoom >= MIN_ZOOM ? bounds : null);

  return (
    <>
      <TransitMapEvents onBoundsUpdate={handleMoveEnd} onZoom={setZoom} onDeselect={handleDeselect} />

      {zoom >= MIN_ZOOM && stations?.map((station) => (
        <BusStopMarker
          key={station.stationId}
          station={station}
          selected={selectedStation?.stationId === station.stationId}
          onSelect={handleSelect}
        />
      ))}

      {isDesktop && selectedStation && (
        <BusStopPopup station={selectedStation} onClose={handleDeselect} />
      )}

      {!isDesktop && (
        <BusStopDetail station={selectedStation} onClose={handleDeselect} />
      )}
    </>
  );
}
