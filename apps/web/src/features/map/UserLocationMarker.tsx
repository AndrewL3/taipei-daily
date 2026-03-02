import { useEffect, useMemo } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

interface UserLocationMarkerProps {
  lat: number;
  lon: number;
}

export default function UserLocationMarker({
  lat,
  lon,
}: UserLocationMarkerProps) {
  const map = useMap();

  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `
          <div style="position:relative;width:24px;height:24px">
            <div style="
              position:absolute;inset:0;
              border-radius:50%;
              background:rgba(59,130,246,0.25);
              animation:location-pulse 2s ease-out infinite;
            "></div>
            <div style="
              position:absolute;
              top:50%;left:50%;
              width:12px;height:12px;
              transform:translate(-50%,-50%);
              border-radius:50%;
              background:#3b82f6;
              border:2px solid white;
              box-shadow:0 1px 4px rgba(0,0,0,0.3);
            "></div>
          </div>
        `,
      }),
    [],
  );

  // Center map on user location on first render
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Marker
      position={[lat, lon]}
      icon={icon}
      interactive={false}
      bubblingMouseEvents={false}
    />
  );
}
