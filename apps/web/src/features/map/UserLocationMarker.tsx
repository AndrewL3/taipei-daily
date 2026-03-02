import { useEffect } from "react";
import { CircleMarker, useMap } from "react-leaflet";

interface UserLocationMarkerProps {
  lat: number;
  lon: number;
}

export default function UserLocationMarker({
  lat,
  lon,
}: UserLocationMarkerProps) {
  const map = useMap();

  // Center map on user location on first render
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Outer glow ring */}
      <CircleMarker
        center={[lat, lon]}
        radius={16}
        interactive={false}
        bubblingMouseEvents={false}
        pathOptions={{
          color: "transparent",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          weight: 0,
        }}
      />
      {/* Solid blue dot with white border */}
      <CircleMarker
        center={[lat, lon]}
        radius={7}
        interactive={false}
        bubblingMouseEvents={false}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#3b82f6",
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}
