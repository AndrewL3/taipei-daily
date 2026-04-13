import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import i18n from "@/i18n";
import {
  loadFavorites,
  saveFavorites,
  deleteFavoriteData,
  isAtLimit,
  type FavoriteItem,
  type FavoritesMap,
} from "./storage";

// Shared in-memory state + listeners for cross-component sync
let cachedFavorites: FavoritesMap | null = null;
const listeners = new Set<() => void>();
let favoritesStorageHealthy = true;

function notify() {
  listeners.forEach((fn) => fn());
}

function reportFavoritesStorageError(error: unknown) {
  console.warn("Favorites storage unavailable:", error);
  if (favoritesStorageHealthy) {
    toast(i18n.t("favorites.storageError"));
    favoritesStorageHealthy = false;
  }
}

async function loadFavoritesSafe(): Promise<FavoritesMap> {
  try {
    const favorites = await loadFavorites();
    favoritesStorageHealthy = true;
    return favorites;
  } catch (error) {
    reportFavoritesStorageError(error);
    return cachedFavorites ?? {};
  }
}

async function saveFavoritesSafe(favorites: FavoritesMap): Promise<void> {
  try {
    await saveFavorites(favorites);
    favoritesStorageHealthy = true;
  } catch (error) {
    reportFavoritesStorageError(error);
  }
}

async function deleteFavoriteDataSafe(
  moduleKey: string,
  itemId: string,
): Promise<void> {
  try {
    await deleteFavoriteData(moduleKey, itemId);
    favoritesStorageHealthy = true;
  } catch (error) {
    reportFavoritesStorageError(error);
  }
}

export async function addFavorite(
  moduleKey: string,
  item: FavoriteItem,
): Promise<void> {
  const current = cachedFavorites ?? (await loadFavoritesSafe());
  const moduleItems = current[moduleKey] ?? [];
  if (moduleItems.some((f) => f.id === item.id)) return;
  if (isAtLimit(current)) return;
  const updated = { ...current, [moduleKey]: [...moduleItems, item] };
  cachedFavorites = updated;
  await saveFavoritesSafe(updated);
  notify();
}

export async function removeFavorite(
  moduleKey: string,
  itemId: string,
): Promise<FavoriteItem | undefined> {
  const current = cachedFavorites ?? (await loadFavoritesSafe());
  const moduleItems = current[moduleKey] ?? [];
  const item = moduleItems.find((f) => f.id === itemId);
  if (!item) return undefined;
  const updated = {
    ...current,
    [moduleKey]: moduleItems.filter((f) => f.id !== itemId),
  };
  cachedFavorites = updated;
  await deleteFavoriteDataSafe(moduleKey, itemId);
  await saveFavoritesSafe(updated);
  notify();
  return item;
}

const DISPLAY_ORDER_KEY = "favorites-display-order";

export function loadDisplayOrder(): string[] {
  try {
    const stored = localStorage.getItem(DISPLAY_ORDER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveDisplayOrder(order: string[]): void {
  localStorage.setItem(DISPLAY_ORDER_KEY, JSON.stringify(order));
}

export function useFavorites(moduleKey: string) {
  const [favorites, setFavorites] = useState<FavoritesMap>(
    cachedFavorites ?? {},
  );

  useEffect(() => {
    if (!cachedFavorites) {
      void loadFavoritesSafe().then((favs) => {
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
    ) => {
      const current = cachedFavorites ?? {};
      const moduleItems = current[moduleKey] ?? [];
      const exists = moduleItems.some((f) => f.id === id);

      let updated: FavoritesMap;
      if (exists) {
        await deleteFavoriteDataSafe(moduleKey, id);
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
      }
      cachedFavorites = updated;
      await saveFavoritesSafe(updated);
      notify();
    },
    [moduleKey],
  );

  return { items, isFavorite, toggle };
}

export function useAllFavorites() {
  const [favorites, setFavorites] = useState<FavoritesMap>(
    cachedFavorites ?? {},
  );

  useEffect(() => {
    if (!cachedFavorites) {
      void loadFavoritesSafe().then((favs) => {
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
