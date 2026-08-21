import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from 'react';
import { flatNavPaths } from './navGroups';

// ─── System Simulation store ────────────────────────────────────────────────
// A client-side "system runner" that walks every dashboard route, simulates a
// functional test, and records ok / repair results. State persists to
// localStorage so it survives navigation and reloads. Consumed by:
//   - SandboxDashboard  (full display + repair handling)
//   - Administration     (start/stop controls)
//   - LeftRail           (link glow while operating)
//
// Backend functions are not available on the current plan, so the runner is
// fully client-side; results are simulated deterministically-ish per run.

const STORAGE_KEY = 'aerodyne_sim_state_v1';

const ISSUE_BANK = [
  'Render timeout exceeded on mount',
  'Live query returned stale data',
  'Required entity binding missing',
  'Subscription handshake failed',
  'Null hook dispatcher detected',
  'Layout overflow on tablet viewport',
  'Auth context not hydrated',
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pickIssue(item) {
  const idx = (item.path || '').length % ISSUE_BANK.length;
  return ISSUE_BANK[idx];
}

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const paths = flatNavPaths();
  const initial = loadState() || {};

  const [isRunning, setIsRunning] = useState(initial.isRunning || false);
  const [speed, setSpeed] = useState(initial.speed ?? 1800);
  const [index, setIndex] = useState(initial.index || 0);
  const [statuses, setStatuses] = useState(initial.statuses || {});
  const [log, setLog] = useState(initial.log || []);
  const [currentPath, setCurrentPath] = useState(null);

  const idxRef = useRef(index);
  idxRef.current = index;

  // Persist a compact snapshot.
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isRunning,
        speed,
        index,
        statuses,
        log: log.slice(-100),
      })
    );
  }, [isRunning, speed, index, statuses, log]);

  const runTest = useCallback((item) => {
    const ok = Math.random() > 0.18;
    return {
      status: ok ? 'ok' : 'repair',
      issues: ok ? null : pickIssue(item),
    };
  }, []);

  const start = useCallback(() => {
    setStatuses({});
    setLog([]);
    idxRef.current = 0;
    setIndex(0);
    setCurrentPath(paths[0]?.path || null);
    setIsRunning(true);
  }, [paths]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setCurrentPath(null);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentPath(null);
    setStatuses({});
    setLog([]);
    setIndex(0);
    idxRef.current = 0;
  }, []);

  const repair = useCallback((path) => {
    setStatuses((prev) => ({
      ...prev,
      [path]: { status: 'ok', issues: null, ts: Date.now(), repaired: true },
    }));
    setLog((prev) => [
      ...prev,
      {
        ts: Date.now(),
        path,
        label: path,
        group: 'repair',
        status: 'ok',
        repaired: true,
      },
    ].slice(-100));
  }, []);

  // The runner loop. Runs one full pass over all dashboards, then stops.
  useEffect(() => {
    if (!isRunning) return;
    setCurrentPath(paths[idxRef.current % paths.length]?.path || null);

    const id = setInterval(() => {
      const cur = idxRef.current % paths.length;
      const item = paths[cur];
      const result = runTest(item);
      setStatuses((prev) => ({
        ...prev,
        [item.path]: {
          status: result.status,
          issues: result.issues,
          ts: Date.now(),
        },
      }));
      setLog((prev) =>
        [
          ...prev,
          {
            ts: Date.now(),
            path: item.path,
            label: item.label,
            group: item.group,
            status: result.status,
          },
        ].slice(-100)
      );

      const next = cur + 1;
      idxRef.current = next;
      setIndex(next);

      if (next >= paths.length) {
        setIsRunning(false);
        setCurrentPath(null);
      } else {
        setCurrentPath(paths[next].path);
      }
    }, speed);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, speed]);

  const total = paths.length;
  const tested = Object.keys(statuses).length;
  const okCount = Object.values(statuses).filter((s) => s.status === 'ok').length;
  const repairCount = Object.values(statuses).filter((s) => s.status === 'repair').length;
  const progress = total ? Math.round((tested / total) * 100) : 0;

  const value = {
    isRunning,
    speed,
    setSpeed,
    currentPath,
    statuses,
    log,
    index,
    total,
    tested,
    okCount,
    repairCount,
    progress,
    start,
    stop,
    reset,
    repair,
    paths,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    // Fallback safe no-op so components never crash outside the provider.
    return {
      isRunning: false, speed: 0, setSpeed: () => {}, currentPath: null,
      statuses: {}, log: [], index: 0, total: 0, tested: 0, okCount: 0,
      repairCount: 0, progress: 0, start: () => {}, stop: () => {}, reset: () => {},
      repair: () => {}, paths: [],
    };
  }
  return ctx;
}