import { useState } from 'react';
import { Plane, ArrowRight, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  scheduled: { color: 'text-muted-foreground', bg: 'bg-muted' },
  boarding:  { color: 'text-primary',          bg: 'bg-primary/15' },
  departed:  { color: 'text-blue-400',         bg: 'bg-blue-500/15' },
  airborne:  { color: 'text-green-400',        bg: 'bg-green-500/15' },
  arrived:   { color: 'text-green-400',        bg: 'bg-green-500/15' },
  cancelled: { color: 'text-destructive',      bg: 'bg-destructive/15' },
  delayed:   { color: 'text-orange-400',       bg: 'bg-orange-500/15' },
};

export default function AircraftSwaps({ flights, spares, pendingSwap, setPendingSwap, applySwap, isSwapping }) {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedSpare,  setSelectedSpare]  = useState(null);

  // Candidates: delayed/cancelled flights that still have an aircraft
  const candidates = flights.filter(f =>
    (f.status === 'delayed' || f.status === 'cancelled' || f.status === 'scheduled') &&
    f.status !== 'airborne' && f.status !== 'arrived'
  );

  const handleApply = () => {
    if (!selectedFlight || !selectedSpare) return;
    applySwap({ flightId: selectedFlight.id, toTail: selectedSpare.tail_number });
    setSelectedFlight(null);
    setSelectedSpare(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-secondary/20 border border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Select a <span className="text-foreground font-semibold">flight</span> to re-tail, then choose a <span className="text-foreground font-semibold">spare aircraft</span> from the available pool.
        </p>
      </div>

      {/* Step 1 — pick flight */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Step 1 — Select Flight to Re-Tail
          </p>
        </div>
        {candidates.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No eligible flights for swap</p>
        ) : (
          candidates.map(f => {
            const cfg = STATUS_CFG[f.status] || STATUS_CFG.scheduled;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFlight(sel => sel?.id === f.id ? null : f)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 text-left transition-colors',
                  selectedFlight?.id === f.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-secondary/30'
                )}
              >
                <Plane className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                  <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · Current: {f.aircraft_tail || '—'}</p>
                </div>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                  {f.status}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Step 2 — pick spare */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Step 2 — Available Spare Aircraft
          </p>
        </div>
        {spares.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No spare aircraft available</p>
        ) : (
          spares.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedSpare(sel => sel?.id === a.id ? null : a)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 text-left transition-colors',
                selectedSpare?.id === a.id ? 'bg-green-500/10 border-l-2 border-l-green-500' : 'hover:bg-secondary/30'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <Plane className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-bold text-foreground">{a.tail_number}</p>
                <p className="text-xs text-muted-foreground">{a.aircraft_type} · {a.base_station || '—'}</p>
              </div>
              <span className="text-xs font-semibold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">Available</span>
            </button>
          ))
        )}
      </div>

      {/* Confirm swap */}
      {selectedFlight && selectedSpare && (
        <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proposed Swap</p>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold text-foreground">{selectedFlight.flight_number}</span>
            <span className="text-muted-foreground">{selectedFlight.aircraft_tail || '—'}</span>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-mono font-bold text-green-400">{selectedSpare.tail_number}</span>
            <span className="text-xs text-muted-foreground">({selectedSpare.aircraft_type})</span>
          </div>
          <button
            onClick={handleApply}
            disabled={isSwapping}
            className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {isSwapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isSwapping ? 'Applying…' : 'Confirm Aircraft Swap'}
          </button>
        </div>
      )}
    </div>
  );
}