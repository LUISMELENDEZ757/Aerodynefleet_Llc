import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Plane } from 'lucide-react';

export default function AircraftSelector({ selectedTail, onSelect, flights }) {
  const { data: aircraft = [] } = useQuery({
    queryKey: ['aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
  });

  // Get unique aircraft from today's flights
  const flightAircraft = flights
    ?.flatMap(f => [f.aircraft_tail, f.aircraft_type])
    .filter(Boolean) || [];

  const availableAircraft = aircraft.filter(a =>
    flightAircraft.includes(a.tail_number) || flightAircraft.includes(a.aircraft_type)
  );

  const selected = aircraft.find(a => a.tail_number === selectedTail);

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground block">Aircraft (Auto-detect or Override)</label>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <select
            value={selectedTail || ''}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select aircraft…</option>
            {availableAircraft.length > 0 ? (
              availableAircraft.map(a => (
                <option key={a.id} value={a.tail_number}>
                  {a.tail_number} ({a.aircraft_type})
                </option>
              ))
            ) : (
              aircraft.map(a => (
                <option key={a.id} value={a.tail_number}>
                  {a.tail_number} ({a.aircraft_type})
                </option>
              ))
            )}
          </select>
        </div>
        {selected && (
          <div className="flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap">
            <Plane className="w-3.5 h-3.5" />
            {selected.aircraft_type}
          </div>
        )}
      </div>
    </div>
  );
}