import { useState, useMemo } from 'react';
import { Users, Plane, ArrowRight, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Passenger Re-accommodation tool.
 * Identifies cancelled/severely-delayed flights and suggests re-accommodation
 * options from same-day flights with available capacity (estimated).
 */

// Rough pax capacity by aircraft type
const PAX_CAPACITY = {
  'B737-700':   128,
  'B737-800':   162,
  'B737-900':   178,
  'B737 MAX 8': 162,
  'B737 MAX 9': 178,
  'B757':       200,
  'B767':       218,
  'B777':       314,
  'B787':       242,
  'A320':       150,
  'A350':       315,
  'E190':        98,
  'CRJ700':      70,
};

function estimateLoad(flight) {
  const cap = PAX_CAPACITY[flight.aircraft_type] || 150;
  // Simulate ~75% load for demo purposes
  return Math.round(cap * 0.75);
}

function estimateAvailable(flight) {
  const cap = PAX_CAPACITY[flight.aircraft_type] || 150;
  return Math.round(cap * 0.25);
}

export default function PassengerReaccom({ flights }) {
  const [search, setSearch] = useState('');
  const [selectedDisrupted, setSelectedDisrupted] = useState(null);

  // Disrupted flights
  const disrupted = useMemo(() =>
    flights.filter(f => f.status === 'cancelled' || (f.delay_minutes >= 120)),
    [flights]
  );

  // Alternative flights: same destination, not cancelled
  const alternatives = useMemo(() => {
    if (!selectedDisrupted) return [];
    return flights.filter(f =>
      f.id !== selectedDisrupted.id &&
      f.destination === selectedDisrupted.destination &&
      f.status !== 'cancelled' &&
      f.status !== 'airborne' &&
      f.status !== 'arrived'
    );
  }, [selectedDisrupted, flights]);

  const filtered = disrupted.filter(f => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.flight_number?.toLowerCase().includes(q) || f.destination?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-secondary/20 border border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Identify passengers on <span className="text-destructive font-semibold">cancelled</span> or <span className="text-orange-400 font-semibold">severely delayed</span> flights and locate re-accommodation options.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search flight or destination…"
          className="w-full h-9 bg-card border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Disrupted flights */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            Disrupted Flights ({filtered.length})
          </p>
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No disrupted flights today</p>
        ) : (
          filtered.map(f => {
            const isCancelled = f.status === 'cancelled';
            const pax = estimateLoad(f);
            return (
              <button
                key={f.id}
                onClick={() => setSelectedDisrupted(s => s?.id === f.id ? null : f)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 text-left transition-colors',
                  selectedDisrupted?.id === f.id ? 'bg-destructive/10 border-l-2 border-l-destructive' : 'hover:bg-secondary/30'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <Plane className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                  <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · ~{pax} pax affected</p>
                </div>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                  isCancelled ? 'text-destructive bg-destructive/15' : 'text-orange-400 bg-orange-500/15'
                )}>
                  {isCancelled ? 'Cancelled' : `+${f.delay_minutes}m`}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Re-accommodation options */}
      {selectedDisrupted && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              Re-Accommodation Options → {selectedDisrupted.destination}
            </p>
          </div>
          {alternatives.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No alternative flights to {selectedDisrupted.destination} today</p>
          ) : (
            alternatives.map(f => {
              const avail = estimateAvailable(f);
              const paxNeed = estimateLoad(selectedDisrupted);
              const canAccom = avail >= paxNeed;
              return (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', canAccom ? 'bg-green-500/15' : 'bg-orange-500/15')}>
                    <Plane className={cn('w-4 h-4', canAccom ? 'text-green-400' : 'text-orange-400')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.origin} → {f.destination} · STD {f.scheduled_departure || '—'} · {f.aircraft_type || '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-xs font-bold', canAccom ? 'text-green-400' : 'text-orange-400')}>
                      ~{avail} seats
                    </p>
                    <p className="text-[10px] text-muted-foreground">{canAccom ? 'Can accommodate' : 'Partial'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}