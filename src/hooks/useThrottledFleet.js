/**
 * useThrottledFleet
 *
 * Wraps a raw aircraft array with:
 *  - 500 ms throttle so rapid real-time pushes don't cause cascading renders
 *  - Batch-merges multiple aircraft updates into a single state commit
 *  - LRU cache (last 5 viewed tails) persisted to sessionStorage
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const THROTTLE_MS = 500;
const LRU_KEY = 'fleet_lru_tails';
const LRU_MAX = 5;

// ── LRU helpers ──────────────────────────────────────────────────────────────
function readLRU() {
  try { return JSON.parse(sessionStorage.getItem(LRU_KEY) || '[]'); } catch { return []; }
}
function writeLRU(tails) {
  try { sessionStorage.setItem(LRU_KEY, JSON.stringify(tails.slice(0, LRU_MAX))); } catch {}
}

export function useThrottledFleet(rawAircraft) {
  const [aircraft, setAircraft] = useState(rawAircraft);
  const pendingRef = useRef(null);        // holds the latest raw array
  const timerRef   = useRef(null);

  useEffect(() => {
    pendingRef.current = rawAircraft;

    // If a flush is already scheduled, just let it pick up the latest value
    if (timerRef.current) return;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setAircraft(pendingRef.current);
    }, THROTTLE_MS);

    return () => {};
  }, [rawAircraft]);

  // Clean up on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // LRU tail tracking
  const [recentTails, setRecentTails] = useState(readLRU);

  const recordTailView = useCallback((tail) => {
    setRecentTails(prev => {
      const next = [tail, ...prev.filter(t => t !== tail)].slice(0, LRU_MAX);
      writeLRU(next);
      return next;
    });
  }, []);

  return { aircraft, recentTails, recordTailView };
}