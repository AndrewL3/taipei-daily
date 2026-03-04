import { useMemo } from "react";
import { Polyline } from "react-leaflet";
import polyline from "@mapbox/polyline";
import { getRouteColor } from "@/lib/routeColor";

interface RoutePolylineProps {
  geometry: string;
  lineId: string;
  leadingStopLat: number | null;
  leadingStopLon: number | null;
}

/** Squared Euclidean distance — sufficient for nearest-point comparison. */
function distSq(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dlat = lat1 - lat2;
  const dlon = lon1 - lon2;
  return dlat * dlat + dlon * dlon;
}

export default function RoutePolyline({
  geometry,
  lineId,
  leadingStopLat,
  leadingStopLon,
}: RoutePolylineProps) {
  const routeColor = getRouteColor(lineId);
  const decoded = useMemo(
    () => polyline.decode(geometry, 6) as [number, number][],
    [geometry],
  );

  const { passed, upcoming } = useMemo(() => {
    if (leadingStopLat == null || leadingStopLon == null) {
      return { passed: [] as [number, number][], upcoming: decoded };
    }

    // Find the closest point on the polyline to the leading stop
    let minDist = Infinity;
    let splitIdx = 0;
    for (let i = 0; i < decoded.length; i++) {
      const d = distSq(
        leadingStopLat,
        leadingStopLon,
        decoded[i][0],
        decoded[i][1],
      );
      if (d < minDist) {
        minDist = d;
        splitIdx = i;
      }
    }

    return {
      passed: decoded.slice(0, splitIdx + 1),
      upcoming: decoded.slice(splitIdx),
    };
  }, [decoded, leadingStopLat, leadingStopLon]);

  return (
    <>
      {passed.length >= 2 && (
        <Polyline
          positions={passed}
          pathOptions={{
            color: routeColor,
            weight: 4,
            opacity: 0.7,
          }}
        />
      )}
      {upcoming.length >= 2 && (
        <Polyline
          positions={upcoming}
          pathOptions={{
            color: routeColor,
            weight: 3,
            opacity: 0.3,
            dashArray: "8 6",
          }}
        />
      )}
    </>
  );
}
