import { useEffect, useRef, useState } from 'react';

/**
 * usePullToRefresh
 * Attach to a scrollable container ref. Calls `onRefresh` when user pulls down
 * beyond `threshold` pixels from the top.
 */
export default function usePullToRefresh({ onRefresh, threshold = 72, containerRef }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  useEffect(() => {
    const el = containerRef?.current || window;
    const isWindow = el === window;

    const getScrollTop = () => (isWindow ? window.scrollY : el.scrollTop);

    const onTouchStart = (e) => {
      if (getScrollTop() <= 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && getScrollTop() <= 0) {
        setPulling(true);
        setPullDistance(Math.min(delta * 0.4, threshold * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (pulling && pullDistance >= threshold) {
        setRefreshing(true);
        setPullDistance(threshold);
        try { await onRefresh(); } finally {
          setRefreshing(false);
        }
      }
      setPulling(false);
      setPullDistance(0);
      startY.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, containerRef, pulling, pullDistance]);

  return { pulling, pullDistance, refreshing };
}