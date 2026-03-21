import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, User, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

const RESERVE_CREW = [
  { id: 'R001', name: 'Capt. Mitchell', role: 'captain',       callout_min: 120, rest_hrs: 14, base: 'KEWR', status: 'available' },
  { id: 'R002', name: 'F/O Santos',     role: 'first_officer', callout_min: 90,  rest_hrs: 12, base: 'KEWR', status: 'available' },
  { id: 'R003', name: 'Capt. Johnson',  role: 'captain',       callout_min: 60,  rest_hrs: 16, base: 'KORD', status: 'on_reserve' },
  { id: 'R004', name: 'F/O Kim',        role: 'first_officer', callout_min: 120, rest_hrs: 10, base: 'KORD', status: 'available' },
  { id: 'R005', name: 'Capt. Davis',    role: 'captain',       callout_min: 90,  rest_hrs: 11, base: 'KLAX', status: 'used' },
  { id: 'R006', name: 'F/O Nguyen',     role: 'first_officer', callout_min: 60,  rest_hrs: 15, base: 'KLAX', status: 'available' },
];

const STATUS_CONFIG = {
  available:   { label: 'Available',   color: 'text-green-400',      bg: 'bg-green-500/15' },
  on_reserve:  { label: 'On Reserve',  color: 'text-primary',        bg: 'bg-primary/15' },
  used:        { label: 'Used',        color: 'text-muted-foreground',bg: 'bg-muted' },
  called_out:  { label: 'Called Out',  color: 'text-orange-400',     bg: 'bg-orange-500/15' },
};

export default function ReserveAssignment({ flights }) {
  const [assignments, setAssignments] = useState({});
  const [crew, setCrew] = useState(RESERVE_CREW);

  const callOut = (crewId, flightId) => {
    setAssignments(prev => ({ ...prev, [flightId]: crewId }));
    setCrew(prev => prev.map(c => c.id === crewId ? { ...c, status: 'called_out' } : c));
  };

  const available = crew.filter(c => c.status === 'available' || c.status === 'on_reserve');
  const captains = available.filter(c => c.role === 'captain');
  const fos = available.filter(c => c.role === 'first_officer');

  const uncrewedFlights = flights.filter(f => !assignments[f.id]);

  return (
    <div className="space-y-4">
      {/* Reserve Pool */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Reserve Pool</p>
          <div className="flex gap-2">
            <span className="text-xs font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">{available.length} available</span>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{crew.filter(c => c.status === 'used' || c.status === 'called_out').length} used</span>
          </div>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {crew.map(c => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.available;
            return (
              <div key={c.id} className={cn('rounded-lg border px-3 py-2.5 flex items-center justify-between', c.status === 'available' || c.status === 'on_reserve' ? 'bg-card border-border' : 'bg-muted/30 border-border/50')}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.base} · {c.callout_min}m callout · {c.rest_hrs}h rest</p>
                  </div>
                </div>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', cfg.bg, cfg.color)}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call-out assignments */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Flight Reserve Call-Out</p>
        </div>
        {flights.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No flights loaded</p>
        ) : (
          <div className="p-3 space-y-2">
            {flights.map(f => {
              const assignedId = assignments[f.id];
              const assignedCrew = crew.find(c => c.id === assignedId);
              return (
                <div key={f.id} className={cn(
                  'rounded-lg border px-3 py-2.5',
                  assignedCrew ? 'bg-green-500/10 border-green-500/20' : 'bg-card border-border'
                )}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                      <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.scheduled_departure}Z</p>
                    </div>
                    {assignedCrew ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <p className="text-xs font-semibold text-green-400">{assignedCrew.name}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          onChange={e => { if (e.target.value) callOut(e.target.value, f.id); }}
                          className="h-8 bg-secondary border border-border rounded-lg px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Assign Reserve…</option>
                          {captains.length > 0 && <optgroup label="Captains">{captains.map(c => <option key={c.id} value={c.id}>{c.name} ({c.callout_min}m)</option>)}</optgroup>}
                          {fos.length > 0 && <optgroup label="First Officers">{fos.map(c => <option key={c.id} value={c.id}>{c.name} ({c.callout_min}m)</option>)}</optgroup>}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}