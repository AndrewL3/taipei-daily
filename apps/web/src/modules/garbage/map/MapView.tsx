import { useState, useCallback, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  AttributionControl,
} from "react-leaflet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/lib/theme";
import { useNearbyStops, useRouteDetail } from "../api/hooks";
import MapControls from "./MapControls";
import StopMarker from "./StopMarker";
import StopPopup from "./StopPopup";
import RoutePolyline from "./RoutePolyline";
import TruckMarker from "./TruckMarker";
import UserLocationMarker from "./UserLocationMarker";
import StopDetail from "../stops/StopDetail";
import type { NearbyStop } from "../api/client";

const LIGHT_TILES =
  "https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}";
const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://maps.nlsc.gov.tw/">NLSC</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

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
  // Guard: prevent map click from deselecting immediately after marker click
  // (mobile touch devices can fire both marker click and map click in sequence)
  const selectingRef = useRef(false);

  const handleMoveEnd = useCallback((lat: number, lon: number) => {
    setMapCenter({ lat, lon });
  }, []);

  const handleSelect = useCallback((stop: NearbyStop) => {
    selectingRef.current = true;
    setSelectedStop(stop);
    requestAnimationFrame(() => {
      selectingRef.current = false;
    });
  }, []);

  const queryPos = mapCenter ?? position;
  const { data: stops } = useNearbyStops(queryPos.lat, queryPos.lon);

  // Fetch route detail when a stop is selected (for polyline + status colors)
  const { data: routeDetail } = useRouteDetail(selectedStop?.routeLineId);

  const handleDeselect = useCallback(() => {
    if (selectingRef.current) return;
    setSelectedStop(null);
  }, []);

  // Build a status map for stops when route data is available
  const stopStatusMap = useMemo(() => {
    if (!routeDetail || !selectedStop) return new Map<string, "passed" | "active" | "upcoming">();
    const map = new Map<string, "passed" | "active" | "upcoming">();
    for (const s of routeDetail.stops) {
      const key = `${selectedStop.routeLineId}-${s.rank}`;
      if (s.passedAt !== null) {
        map.set(key, "passed");
      } else if (s.rank === routeDetail.progress.leadingStopRank) {
        map.set(key, "active");
      } else {
        map.set(key, "upcoming");
      }
    }
    return map;
  }, [routeDetail, selectedStop]);

  // Find truck position (leading stop coords)
  const truckPosition = useMemo(() => {
    if (!routeDetail || routeDetail.progress.status !== "active") return null;
    const leading = routeDetail.stops.find(
      (s) => s.rank === routeDetail.progress.leadingStopRank,
    );
    if (!leading || leading.latitude == null || leading.longitude == null)
      return null;
    return { lat: leading.latitude, lon: leading.longitude };
  }, [routeDetail]);

  return (
    <div className="h-full w-full overflow-hidden">
      <MapContainer
        center={[position.lat, position.lon]}
        zoom={16}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          key={isDark ? "dark" : "light"}
          url={isDark ? DARK_TILES : LIGHT_TILES}
          attribution={ATTRIBUTION}
        />
        <AttributionControl position="bottomright" prefix={false} />
        <MapEvents onMoveEnd={handleMoveEnd} onDeselect={handleDeselect} />
        <MapControls userLat={position.lat} userLon={position.lon} />
        {located && (
          <UserLocationMarker lat={position.lat} lon={position.lon} />
        )}

        {/* Road-snapped route polyline */}
        {routeDetail?.route.geometry && selectedStop && (
          <RoutePolyline
            geometry={routeDetail.route.geometry}
            lineId={selectedStop.routeLineId}
            leadingStopLat={truckPosition?.lat ?? null}
            leadingStopLon={truckPosition?.lon ?? null}
          />
        )}

        {/* Truck marker */}
        {truckPosition && (
          <TruckMarker lat={truckPosition.lat} lon={truckPosition.lon} />
        )}

        {stops?.map((stop) => {
          const key = `${stop.routeLineId}-${stop.rank}`;
          const status = stopStatusMap.get(key);
          const selectedRouteLineId = selectedStop?.routeLineId ?? null;
          const faded =
            selectedStop !== null &&
            stop.routeLineId !== selectedStop.routeLineId;
          return (
            <StopMarker
              key={key}
              stop={stop}
              selected={
                selectedStop?.routeLineId === stop.routeLineId &&
                selectedStop?.rank === stop.rank
              }
              onSelect={handleSelect}
              status={status}
              faded={faded}
              selectedRouteLineId={selectedRouteLineId}
            />
          );
        })}

        {/* Desktop: Leaflet Popup anchored near the marker */}
        {isDesktop && selectedStop && (
          <StopPopup stop={selectedStop} onClose={handleDeselect} />
        )}
      </MapContainer>
      {/* Mobile: bottom sheet Drawer */}
      {!isDesktop && (
        <StopDetail stop={selectedStop} onClose={handleDeselect} />
      )}
    </div>
  );
}
