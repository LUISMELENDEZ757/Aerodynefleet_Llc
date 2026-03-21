import { useEffect, useState } from 'react';

/**
 * Hook to dynamically adjust query polling interval based on document visibility.
 * Returns polling interval: activeInterval when visible, reducedInterval when hidden.
 */
export function useDynamicPolling(activeInterval = 60000, reducedInterval = 300000) {
  const [interval, setInterval] = useState(activeInterval);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setInterval(document.hidden ? reducedInterval : activeInterval);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeInterval, reducedInterval]);

  return interval;
}