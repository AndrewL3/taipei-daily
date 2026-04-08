import { useEffect, useSyncExternalStore } from "react";

interface Position {
  lat: number;
  lon: number;
}

// New Taipei City center
const DEFAULT_POSITION: Position = { lat: 25.012, lon: 121.465 };

interface GeolocationState {
  position: Position;
  located: boolean;
}

let state: GeolocationState = {
  position: DEFAULT_POSITION,
  located: false,
};
let requestStarted = false;
let requestInFlight = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): GeolocationState {
  return state;
}

function requestPosition(force = false) {
  if (typeof navigator === "undefined" || !navigator.geolocation) return;
  if (!force && requestStarted) return;
  if (requestInFlight) return;

  requestStarted = true;
  requestInFlight = true;

  const onSuccess = (pos: GeolocationPosition) => {
    requestInFlight = false;
    state = {
      position: { lat: pos.coords.latitude, lon: pos.coords.longitude },
      located: true,
    };
    notify();
  };

  const onFailure = () => {
    requestInFlight = false;
  };

  navigator.geolocation.getCurrentPosition(
    onSuccess,
    () => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onFailure,
        { enableHighAccuracy: false, timeout: 15_000 },
      );
    },
    { enableHighAccuracy: true, timeout: 10_000 },
  );
}

export function retryGeolocation() {
  requestPosition(true);
}

export function useGeolocation() {
  const { position, located } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  useEffect(() => {
    requestPosition();
  }, []);

  return { position, located };
}
