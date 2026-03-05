import { Marker } from "react-leaflet";
import L from "leaflet";

interface TruckMarkerProps {
  lat: number;
  lon: number;
}

const truckIcon = L.divIcon({
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:50%;background:oklch(0.65 0.18 195 / 20%);animation:truck-pulse 2s ease-out infinite;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:oklch(0.65 0.18 195);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgb(0 0 0 / 0.2);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
      </div>
    </div>
  `,
});

export default function TruckMarker({ lat, lon }: TruckMarkerProps) {
  return (
    <Marker
      position={[lat, lon]}
      icon={truckIcon}
      interactive={false}
    />
  );
}
