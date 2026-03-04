import { useState, useEffect } from "react";

interface Position {
  lat: number;
  lon: number;
}

// New Taipei City center
const DEFAULT_POSITION: Position = { lat: 25.012, lon: 121.465 };

export function useGeolocation() {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [located, setLocated] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setLocated(true);
    };

    // Try high accuracy first (GPS on mobile), fall back to low accuracy (IP/WiFi on desktop)
    navigator.geolocation.getCurrentPosition(onSuccess, () => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        () => {
          // Both attempts failed — keep default position
        },
        { enableHighAccuracy: false, timeout: 15_000 },
      );
    }, { enableHighAccuracy: true, timeout: 10_000 });
  }, []);

  return { position, located };
}
