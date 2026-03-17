import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type L from "leaflet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNearbyStops, useRouteDetail, useTaipeiStops } from "../api/hooks";
import type { TaipeiGarbageStop, MapBounds } from "../api/taipei-client";
import StopMarker from "./StopMarker";
import StopPopup from "./StopPopup";
import RoutePolyline from "./RoutePolyline";
import TruckMarker from "./TruckMarker";
import TaipeiStopMarker from "./TaipeiStopMarker";
import TaipeiStopPopup from "./TaipeiStopPopup";
import StopDetail from "../stops/StopDetail";
import TaipeiStopDetail from "../stops/TaipeiStopDetail";
import type { NearbyStop } from "../api/client";

function getBounds(map: L.Map): MapBounds {
  const b = map.getBounds();
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

function GarbageMapEvents({
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

const MIN_ZOOM = 17;

export default function GarbageMapLayer() {
  const map = useMap();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [selectedStop, setSelectedStop] = useState<NearbyStop | null>(null);
  const selectingRef = useRef(false);

  // Bounds for Taipei bounding-box query
  const [bounds, setBounds] = useState<MapBounds | null>(null);

  // Taipei stop selection (separate from NTC selection)
  const [selectedTaipeiStop, setSelectedTaipeiStop] =
    useState<TaipeiGarbageStop | null>(null);
  const selectingTaipeiRef = useRef(false);

  // Initialize bounds on mount
  useEffect(() => {
    const z = map.getZoom();
    setZoom(z);
    if (z >= MIN_ZOOM) setBounds(getBounds(map));
  }, [map]);

  // Fetch Taipei stops
  const { data: taipeiStops } = useTaipeiStops(zoom >= MIN_ZOOM ? bounds : null);

  const handleMoveEnd = useCallback(() => {
    const z = map.getZoom();
    setZoom(z);
    if (z >= MIN_ZOOM) {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lon: center.lng });
      setBounds(getBounds(map));
    } else {
      setMapCenter(null);
      setBounds(null);
    }
  }, [map]);

  const handleSelect = useCallback((stop: NearbyStop) => {
    selectingRef.current = true;
    setSelectedStop(stop);
    setSelectedTaipeiStop(null); // clear Taipei selection
    requestAnimationFrame(() => {
      selectingRef.current = false;
    });
  }, []);

  const handleSelectTaipei = useCallback((stop: TaipeiGarbageStop) => {
    selectingTaipeiRef.current = true;
    setSelectedTaipeiStop(stop);
    setSelectedStop(null); // clear NTC selection
    requestAnimationFrame(() => {
      selectingTaipeiRef.current = false;
    });
  }, []);

  const handleDeselectTaipei = useCallback(() => {
    if (selectingTaipeiRef.current) return;
    setSelectedTaipeiStop(null);
  }, []);

  // Use map center for initial fetch, then track panning
  const initialCenter = map.getCenter();
  const effectiveLat = zoom >= MIN_ZOOM ? (mapCenter?.lat ?? initialCenter.lat) : null;
  const effectiveLon = zoom >= MIN_ZOOM ? (mapCenter?.lon ?? initialCenter.lng) : null;
  const { data: stops } = useNearbyStops(effectiveLat, effectiveLon);

  const { data: routeDetail } = useRouteDetail(selectedStop?.routeLineId);

  const handleDeselect = useCallback(() => {
    if (selectingRef.current || selectingTaipeiRef.current) return;
    setSelectedStop(null);
    setSelectedTaipeiStop(null);
  }, []);

  const stopStatusMap = useMemo(() => {
    if (!routeDetail || !selectedStop)
      return new Map<string, "passed" | "active" | "upcoming">();
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
    <>
      <GarbageMapEvents
        onBoundsUpdate={handleMoveEnd}
        onZoom={setZoom}
        onDeselect={handleDeselect}
      />

      {routeDetail?.route.geometry && selectedStop && (
        <RoutePolyline
          geometry={routeDetail.route.geometry}
          lineId={selectedStop.routeLineId}
          leadingStopLat={truckPosition?.lat ?? null}
          leadingStopLon={truckPosition?.lon ?? null}
        />
      )}

      {truckPosition && (
        <TruckMarker lat={truckPosition.lat} lon={truckPosition.lon} />
      )}

      {zoom >= MIN_ZOOM && stops?.map((stop) => {
        const key = `${stop.routeLineId}-${stop.rank}`;
        const status = stopStatusMap.get(key);
        const selectedRouteLineId = selectedStop?.routeLineId ?? null;
        const faded =
          selectedTaipeiStop !== null ||
          (selectedStop !== null &&
            stop.routeLineId !== selectedStop.routeLineId);
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

      {zoom >= MIN_ZOOM && taipeiStops?.map((stop) => (
        <TaipeiStopMarker
          key={stop.id}
          stop={stop}
          selected={selectedTaipeiStop?.id === stop.id}
          onSelect={handleSelectTaipei}
          faded={selectedStop !== null}
        />
      ))}

      {isDesktop && selectedStop && (
        <StopPopup stop={selectedStop} onClose={handleDeselect} />
      )}

      {!isDesktop && (
        <StopDetail stop={selectedStop} onClose={handleDeselect} />
      )}

      {isDesktop && selectedTaipeiStop && (
        <TaipeiStopPopup
          stop={selectedTaipeiStop}
          onClose={handleDeselectTaipei}
        />
      )}

      {!isDesktop && (
        <TaipeiStopDetail
          stop={selectedTaipeiStop}
          onClose={handleDeselectTaipei}
        />
      )}
    </>
  );
}
