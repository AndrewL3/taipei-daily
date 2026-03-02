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

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocated(true);
      },
      () => {
        // Permission denied or error — keep default position
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  return { position, located };
}
