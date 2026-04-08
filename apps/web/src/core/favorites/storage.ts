import { del, get, set } from "idb-keyval";

export interface FavoriteItem {
  id: string;
  label: string;
  lat: number;
  lon: number;
  addedAt: number;
}

export type FavoritesMap = Record<string, FavoriteItem[]>;

const FAVORITES_KEY = "favorites";
const MAX_FAVORITES = 50;

export async function loadFavorites(): Promise<FavoritesMap> {
  return (await get<FavoritesMap>(FAVORITES_KEY)) ?? {};
}

export async function saveFavorites(favs: FavoritesMap): Promise<void> {
  await set(FAVORITES_KEY, favs);
}

export async function deleteFavoriteData(
  moduleKey: string,
  id: string,
): Promise<void> {
  await del(`fav-data:${moduleKey}:${id}`);
}

export function getTotalCount(favs: FavoritesMap): number {
  return Object.values(favs).reduce((sum, arr) => sum + arr.length, 0);
}

export function isAtLimit(favs: FavoritesMap): boolean {
  return getTotalCount(favs) >= MAX_FAVORITES;
}
