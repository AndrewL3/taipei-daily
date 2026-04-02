import { useState, useCallback } from "react";

const STORAGE_KEY = "dismissed-tooltips";

function loadDismissed(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useDismissedTooltips() {
  const [dismissed, setDismissed] = useState(loadDismissed);

  const dismiss = useCallback((key: string) => {
    setDismissed((prev) => {
      const next = [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDismissed([]);
  }, []);

  /** Returns the first non-dismissed key from the list, or null. */
  const getActiveTooltip = useCallback(
    (keys: string[]) => keys.find((k) => !dismissed.includes(k)) ?? null,
    [dismissed],
  );

  return { dismiss, resetAll, getActiveTooltip };
}
