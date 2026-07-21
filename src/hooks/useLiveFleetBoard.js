/**
 * useLiveFleetBoard — feeds the Fleet Board from the real OS database.
 * Joins Aircraft ⟵ LogbookEntry (open discrepancies) ⟵ MELItem (open MELs) ⟵ Flight (movement)
 * and maps everything into the board card shape. Refreshes every 60s.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_TO_BOARD = {
  active: 'released',
  released: 'released',
  mel_ops: 'released',
  oos: 'oos',
  rts_pending: 'oos',
  maintenance: 'maint',
};

export default function useLiveFleetBoard() {
  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['board-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-updated_date', 500),
    staleTime: 30000, refetchInterval: 60000,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['board-logs'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    staleTime: 30000, refetchInterval: 60000,
  });
  const { data: mels = [] } = useQuery({
    queryKey: ['board-mels'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 500),
    staleTime: 30000, refetchInterval: 60000,
  });
  const { data: flights = [] } = useQuery({
    queryKey: ['board-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 300),
    staleTime: 60000,
  });

  const fleet = useMemo(() => {
    const openLogsByTail = {};
    logs.forEach((e) => {
      if (e.entry_type === 'discrepancy' && e.discrepancy_status !== 'CLOSED' && !e.is_cleared) {
        openLogsByTail[e.aircraft_tail] = (openLogsByTail[e.aircraft_tail] || 0) + 1;
      }
    });
    const openMelByTail = {};
    mels.forEach((m) => {
      if (m.status !== 'cleared' && m.status !== 'voided') {
        openMelByTail[m.aircraft_tail] = (openMelByTail[m.aircraft_tail] || 0) + 1;
      }
    });
    const flightByTail = {};
    flights.forEach((f) => {
      if (f.aircraft_tail && !flightByTail[f.aircraft_tail]) flightByTail[f.aircraft_tail] = f;
    });

    const seen = new Set();
    const list = [];
    for (const a of aircraft) {
      if (!a.tail_number || a.status === 'retired' || seen.has(a.tail_number)) continue;
      seen.add(a.tail_number);
      const boardStatus = STATUS_TO_BOARD[a.status] || 'released';
      const grounded = a.status === 'oos';
      const fl = flightByTail[a.tail_number];
      const gate = grounded ? 'AOG' : a.status === 'maintenance' ? 'MX' : (fl?.gate || a.location_label || '—');
      list.push({
        id: a.id,
        tail: a.tail_number,
        variant: a.aircraft_type || '—',
        base: a.base_station || '—',
        boardStatus,
        grounded,
        openDiscrepancies: openLogsByTail[a.tail_number] || 0,
        openMel: openMelByTail[a.tail_number] || 0,
        fob: 18000, fobMax: 26000, fuelOnBoard: '—',
        gate,
        location: a.location_label || a.base_station || '—',
        arr: { time: fl?.scheduled_arrival || '—', port: fl?.origin || '—', flight: fl?.flight_number || '—' },
        dep: { time: fl?.scheduled_departure || '—', port: fl?.destination || '—', flight: fl?.flight_number || '—' },
        flags: [],
        oosReason: a.oos_reason,
        osStatus: a.status,
      });
    }
    // Grounded / maintenance first, then MEL, then released
    const rank = { oos: 0, maint: 1, released: 2 };
    list.sort((x, y) => (rank[x.boardStatus] - rank[y.boardStatus]) || (y.openMel - x.openMel));
    return list;
  }, [aircraft, logs, mels, flights]);

  return { fleet, isLoading };
}