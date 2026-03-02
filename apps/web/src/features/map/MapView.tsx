import { useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/lib/theme";
import { useNearbyStops } from "@/api/hooks";
import StopMarker from "./StopMarker";
import StopPopup from "./StopPopup";
import UserLocationMarker from "./UserLocationMarker";
import StopDetail from "@/features/stops/StopDetail";
import type { NearbyStop } from "@/api/client";

const LIGHT_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function MapEvents({
  onMoveEnd,
  onDeselect,
}: {
  onMoveEnd: (lat: number, lon: number) => void;
  onDeselect: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useMapEvents({
    moveend(e) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const center = e.target.getCenter();
        onMoveEnd(center.lat, center.lng);
      }, 500);
    },
    click() {
      onDeselect();
    },
  });
  return null;
}

export default function MapView() {
  const { position, located } = useGeolocation();
  const { isDark } = useTheme();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [selectedStop, setSelectedStop] = useState<NearbyStop | null>(null);

  const handleMoveEnd = useCallback((lat: number, lon: number) => {
    setMapCenter({ lat, lon });
  }, []);

  const queryPos = mapCenter ?? position;
  const { data: stops } = useNearbyStops(queryPos.lat, queryPos.lon);

  const handleDeselect = useCallback(() => setSelectedStop(null), []);

  return (
    <>
      <MapContainer
        center={[position.lat, position.lon]}
        zoom={16}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          key={isDark ? "dark" : "light"}
          url={isDark ? DARK_TILES : LIGHT_TILES}
          attribution={ATTRIBUTION}
        />
        <MapEvents onMoveEnd={handleMoveEnd} onDeselect={handleDeselect} />
        {located && (
          <UserLocationMarker lat={position.lat} lon={position.lon} />
        )}
        {stops?.map((stop) => (
          <StopMarker
            key={`${stop.routeLineId}-${stop.rank}`}
            stop={stop}
            selected={
              selectedStop?.routeLineId === stop.routeLineId &&
              selectedStop?.rank === stop.rank
            }
            onSelect={setSelectedStop}
          />
        ))}
        {/* Desktop: Leaflet Popup anchored near the marker */}
        {isDesktop && selectedStop && (
          <StopPopup stop={selectedStop} onClose={handleDeselect} />
        )}
      </MapContainer>
      {/* Mobile: bottom sheet Drawer */}
      {!isDesktop && (
        <StopDetail stop={selectedStop} onClose={handleDeselect} />
      )}
    </>
  );
}
