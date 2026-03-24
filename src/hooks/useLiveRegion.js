import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useLiveRegion
 * Manages an ARIA live region for screen-reader announcements.
 *
 * Returns:
 *   announce(message, politeness?)  - queue an announcement
 *   LiveRegion                      - invisible component to mount once in layout
 *
 * Usage:
 *   const { announce, LiveRegion } = useLiveRegion();
 *   // Mount once:  <LiveRegion />
 *   // Anywhere:    announce('3 flights updated');
 */
export function useLiveRegion(defaultPoliteness = 'polite') {
  const [message, setMessage]     = useState('');
  const [politeness, setPoliteness] = useState(defaultPoliteness);
  const clearRef = useRef(null);

  const announce = useCallback((text, level = defaultPoliteness) => {
    // Clear first so repeated same-text announcements re-trigger
    setMessage('');
    setPoliteness(level);
    // Small delay lets screen readers pick up the clear before the new text
    clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => setMessage(text), 50);
  }, [defaultPoliteness]);

  useEffect(() => () => clearTimeout(clearRef.current), []);

  function LiveRegion() {
    return (
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    );
  }

  return { announce, LiveRegion, message };
}