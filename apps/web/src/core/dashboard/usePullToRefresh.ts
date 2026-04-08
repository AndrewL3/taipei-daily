import { useRef, useState, useCallback, useEffect } from "react";

const MAX_PULL = 60;
const TRIGGER_THRESHOLD = 50;

interface PullToRefreshResult {
  offset: number;
  isRefreshing: boolean;
}

export function usePullToRefresh(
  scrollRef: React.RefObject<HTMLElement | null>,
  onRefresh: () => Promise<unknown>,
): PullToRefreshResult {
  const [offset, setOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return;
      const el = scrollRef.current;
      if (el && el.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [scrollRef, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setOffset(Math.min(delta * 0.5, MAX_PULL));
      } else {
        pulling.current = false;
        setOffset(0);
      }
    },
    [isRefreshing],
  );

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;
    setOffset((current) => {
      if (current >= TRIGGER_THRESHOLD) {
        setIsRefreshing(true);
        void Promise.resolve(onRefresh())
          .catch(() => {
            // Errors are surfaced by the individual queries/cards.
          })
          .finally(() => {
            setIsRefreshing(false);
            setOffset(0);
          });
        return MAX_PULL;
      }
      return 0;
    });
  }, [onRefresh]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { offset, isRefreshing };
}
