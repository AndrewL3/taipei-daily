import { useState, useEffect, useCallback, useMemo } from "react";
import {
  loadFavorites,
  saveFavorites,
  saveCachedData,
  loadCachedData,
  isAtLimit,
  type FavoriteItem,
  type FavoritesMap,
} from "./storage";

// Shared in-memory state + listeners for cross-component sync
let cachedFavorites: FavoritesMap | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function useFavorites(moduleKey: string) {
  const [favorites, setFavorites] = useState<FavoritesMap>(
    cachedFavorites ?? {},
  );

  useEffect(() => {
    if (!cachedFavorites) {
      loadFavorites().then((favs) => {
        cachedFavorites = favs;
        setFavorites(favs);
        notify();
      });
    }
    const update = () => {
      if (cachedFavorites) setFavorites({ ...cachedFavorites });
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const items: FavoriteItem[] = useMemo(
    () => favorites[moduleKey] ?? [],
    [favorites, moduleKey],
  );

  const isFavorite = useCallback(
    (id: string) => items.some((f) => f.id === id),
    [items],
  );

  const toggle = useCallback(
    async (
      id: string,
      label: string,
      lat: number,
      lon: number,
      data?: unknown,
    ) => {
      const current = cachedFavorites ?? {};
      const moduleItems = current[moduleKey] ?? [];
      const exists = moduleItems.some((f) => f.id === id);

      let updated: FavoritesMap;
      if (exists) {
        updated = {
          ...current,
          [moduleKey]: moduleItems.filter((f) => f.id !== id),
        };
      } else {
        if (isAtLimit(current)) return;
        updated = {
          ...current,
          [moduleKey]: [
            ...moduleItems,
            { id, label, lat, lon, addedAt: Date.now() },
          ],
        };
        if (data) {
          await saveCachedData(moduleKey, id, data);
        }
      }
      cachedFavorites = updated;
      await saveFavorites(updated);
      notify();
    },
    [moduleKey],
  );

  const getCachedData = useCallback(
    <T,>(id: string) => loadCachedData<T>(moduleKey, id),
    [moduleKey],
  );

  return { items, isFavorite, toggle, getCachedData };
}

export function useAllFavorites() {
  const [favorites, setFavorites] = useState<FavoritesMap>(
    cachedFavorites ?? {},
  );

  useEffect(() => {
    if (!cachedFavorites) {
      loadFavorites().then((favs) => {
        cachedFavorites = favs;
        setFavorites(favs);
        notify();
      });
    }
    const update = () => {
      if (cachedFavorites) setFavorites({ ...cachedFavorites });
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return favorites;
}
