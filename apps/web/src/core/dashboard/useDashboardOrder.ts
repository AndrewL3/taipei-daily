import { useState, useCallback } from "react";

const STORAGE_KEY = "dashboard-card-order";
const DEFAULT_ORDER = ["garbage", "transit", "youbike", "parking"];

function loadOrder(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_ORDER;
    const parsed = JSON.parse(stored) as string[];
    // Reconcile: keep only IDs that exist in default, append any missing
    const valid = parsed.filter((id) => DEFAULT_ORDER.includes(id));
    const missing = DEFAULT_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return DEFAULT_ORDER;
  }
}

export function useDashboardOrder(): [string[], (order: string[]) => void] {
  const [order, setOrderState] = useState(loadOrder);

  const setOrder = useCallback((newOrder: string[]) => {
    setOrderState(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  }, []);

  return [order, setOrder];
}
