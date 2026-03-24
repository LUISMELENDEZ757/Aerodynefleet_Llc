import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TODAY = new Date().toISOString().split('T')[0];

/**
 * Aircraft swap logic: finds candidate spares, validates, and applies swaps.
 * Gate reassignment: filters unoccupied gates for a station.
 */
export function useSwapLogic(flights = [], aircraft = [], oos = []) {
  const queryClient = useQueryClient();
  const [pendingSwap, setPendingSwap] = useState(null); // { flightId, fromTail, toTail }
  const [pendingGate, setPendingGate] = useState(null); // { flightId, gate }

  // Active tails (flying today)
  const activeTails = useMemo(() =>
    new Set(flights.map(f => f.aircraft_tail).filter(Boolean)),
    [flights]
  );

  // OOS tails
  const oosTails = useMemo(() =>
    new Set(oos.filter(o => o.status !== 'released').map(o => o.tail_number).filter(Boolean)),
    [oos]
  );

  // Spare aircraft: registered but not flying today and not OOS
  const spares = useMemo(() =>
    aircraft.filter(a => a.status === 'active' && !activeTails.has(a.tail_number) && !oosTails.has(a.tail_number)),
    [aircraft, activeTails, oosTails]
  );

  // Gates used today per station
  const usedGates = useMemo(() => {
    const map = {};
    flights.forEach(f => {
      if (f.gate && f.origin) {
        if (!map[f.origin]) map[f.origin] = new Set();
        map[f.origin].add(f.gate);
      }
    });
    return map;
  }, [flights]);

  // Generate candidate gates for a station (simple A/B/C gates)
  const candidateGates = (station) => {
    const used = usedGates[station] || new Set();
    const all = ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3'];
    return all.filter(g => !used.has(g)).slice(0, 8);
  };

  const swapMutation = useMutation({
    mutationFn: ({ flightId, toTail }) =>
      base44.entities.Flight.update(flightId, { aircraft_tail: toTail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opscenter-flights', TODAY] });
      setPendingSwap(null);
    },
  });

  const gateMutation = useMutation({
    mutationFn: ({ flightId, gate }) =>
      base44.entities.Flight.update(flightId, { gate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opscenter-flights', TODAY] });
      setPendingGate(null);
    },
  });

  return {
    spares,
    pendingSwap, setPendingSwap,
    pendingGate, setPendingGate,
    candidateGates,
    applySwap: swapMutation.mutate,
    applyGate: gateMutation.mutate,
    isSwapping: swapMutation.isPending,
    isReassigning: gateMutation.isPending,
  };
}