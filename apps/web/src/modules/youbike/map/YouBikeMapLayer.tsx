import { useState, useCallback, useRef, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useYouBikeStations } from "../api/hooks";
import StationMarker from "./StationMarker";
import StationPopup from "./StationPopup";
import StationDetail from "../stops/StationDetail";
import type { YouBikeStation, MapBounds } from "../api/client";

const MIN_ZOOM = 19;

function YouBikeMapEvents({
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

export default function YouBikeMapLayer() {
  const map = useMap();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [selectedStation, setSelectedStation] = useState<YouBikeStation | null>(
    null,
  );
  const selectingRef = useRef(false);

  // Initialize bounds on mount
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

  const handleSelect = useCallback((station: YouBikeStation) => {
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

  const { data: stations } = useYouBikeStations(zoom >= MIN_ZOOM ? bounds : null);

  return (
    <>
      <YouBikeMapEvents onBoundsUpdate={handleMoveEnd} onZoom={setZoom} onDeselect={handleDeselect} />

      {zoom >= MIN_ZOOM && stations?.map((station) => (
        <StationMarker
          key={station.id}
          station={station}
          selected={selectedStation?.id === station.id}
          onSelect={handleSelect}
        />
      ))}

      {isDesktop && selectedStation && (
        <StationPopup station={selectedStation} onClose={handleDeselect} />
      )}

      {!isDesktop && (
        <StationDetail station={selectedStation} onClose={handleDeselect} />
      )}
    </>
  );
}
