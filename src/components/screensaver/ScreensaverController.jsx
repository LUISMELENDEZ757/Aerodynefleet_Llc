import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Screensaver from './Screensaver';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function ScreensaverController() {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIdle(true), IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const onActivity = () => {
      setIdle(false);
      startTimer();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    startTimer();

    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, onActivity));
    };
  }, [startTimer]);

  const dismiss = useCallback(() => {
    setIdle(false);
    startTimer();
  }, [startTimer]);

  return (
    <AnimatePresence>
      {idle && <Screensaver key="screensaver" onDismiss={dismiss} />}
    </AnimatePresence>
  );
}