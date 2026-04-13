import { useState, useCallback } from "react";

const STORAGE_KEY = "dashboard-card-order";

function loadOrder(defaultOrder: readonly string[]): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [...defaultOrder];
    const parsed = JSON.parse(stored) as string[];
    // Reconcile: keep only IDs that exist in default, append any missing
    const valid = parsed.filter((id) => defaultOrder.includes(id));
    const missing = defaultOrder.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...defaultOrder];
  }
}

export function useDashboardOrder(
  defaultOrder: readonly string[],
): [string[], (order: string[]) => void] {
  const [order, setOrderState] = useState(() => loadOrder(defaultOrder));

  const setOrder = useCallback((newOrder: string[]) => {
    setOrderState(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  }, []);

  return [order, setOrder];
}
