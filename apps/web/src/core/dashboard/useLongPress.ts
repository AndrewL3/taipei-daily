import { useRef, useCallback } from "react";

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useLongPress(
  onLongPress: () => void,
  threshold = 500,
): LongPressHandlers {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      timer.current = setTimeout(() => {
        navigator.vibrate?.(10);
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.touches[0].clientX - startPos.current.x;
      const dy = e.touches[0].clientY - startPos.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clear();
      }
    },
    [clear],
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
