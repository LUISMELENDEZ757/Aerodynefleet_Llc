import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const TODAY = new Date().toISOString().split('T')[0];

/**
 * usePreload
 * Fire-and-forget prefetch for critical entities into the React Query cache.
 * Accepts a list of preload descriptors — runs once on mount.
 *
 * Built-in presets:
 *   usePreload('dashboard')  — flights, crew, releases
 *   usePreload('ops')        — flights, crew, oos, safety
 *   usePreload(['Flight', 'Aircraft'])  — arbitrary entity list names
 *
 * Custom:
 *   usePreload([
 *     { entity: 'Flight', filter: { flight_date: TODAY } },
 *     { entity: 'Aircraft' },
 *   ])
 */

const PRESETS = {
  dashboard: [
    { entity: 'Flight',           filter: { flight_date: TODAY } },
    { entity: 'CrewAssignment',   filter: { flight_date: TODAY } },
    { entity: 'DispatchRelease',  filter: { flight_date: TODAY } },
  ],
  ops: [
    { entity: 'Flight',           filter: { flight_date: TODAY } },
    { entity: 'CrewAssignment',   filter: { flight_date: TODAY } },
    { entity: 'OOSEntry' },
    { entity: 'SafetyReport',     filter: { status: 'open' } },
    { entity: 'Aircraft' },
  ],
  aircraft: [
    { entity: 'Aircraft' },
    { entity: 'OOSEntry' },
    { entity: 'PerformanceProfile' },
  ],
};

function resolveDescriptors(target) {
  if (typeof target === 'string') return PRESETS[target] || [];
  if (Array.isArray(target)) {
    return target.map(item =>
      typeof item === 'string' ? { entity: item } : item
    );
  }
  return [];
}

export function usePreload(target, enabled = true) {
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;

    const descriptors = resolveDescriptors(target);
    if (descriptors.length === 0) return;

    Promise.allSettled(
      descriptors.map(({ entity, filter }) => {
        const repo = base44.entities[entity];
        if (!repo) return Promise.resolve();
        return filter ? repo.filter(filter) : repo.list();
      })
    ).catch(() => {
      // Preload is non-blocking — errors are silently ignored
    });
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}