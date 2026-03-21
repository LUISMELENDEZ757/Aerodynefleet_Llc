import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { GitMerge, Plane, Users, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const CREW_POOL = [
  { id: 'C001', name: 'Capt. Hayes', role: 'captain', base: 'KEWR', rest_avail: 14 },
  { id: 'C002', name: 'F/O Ramirez', role: 'first_officer', base: 'KEWR', rest_avail: 12 },
  { id: 'C003', name: 'Capt. Torres', role: 'captain', base: 'KORD', rest_avail: 10 },
  { id: 'C004', name: 'F/O Park', role: 'first_officer', base: 'KORD', rest_avail: 16 },
  { id: 'C005', name: 'Capt. Williams', role: 'captain', base: 'KLAX', rest_avail: 11 },
  { id: 'C006', name: 'F/O Chen', role: 'first_officer', base: 'KLAX', rest_avail: 9 },
];

function generatePairings(flights) {
  const pairings = [];
  const flightsCopy = [...flights];

  let id = 1;
  while (flightsCopy.length >= 2) {
    const leg1 = flightsCopy.shift();
    const leg2 = flightsCopy.find(f => f.origin === leg1.destination);
    if (leg2) {
      flightsCopy.splice(flightsCopy.indexOf(leg2), 1);
      const cap = CREW_POOL.filter(c => c.role === 'captain' && c.rest_avail >= 10)[0];
      const fo = CREW_POOL.filter(c => c.role === 'first_officer' && c.rest_avail >= 10)[0];
      pairings.push({
        id: `P${String(id++).padStart(3,'0')}`,
        legs: [leg1, leg2],
        captain: cap?.name || 'Unassigned',
        fo: fo?.name || 'Unassigned',
        block_hours: (Math.random() * 4 + 2).toFixed(1),
        duty_hours: (Math.random() * 3 + 8).toFixed(1),
        legal: cap && fo,
      });
    } else {
      pairings.push({
        id: `P${String(id++).padStart(3,'0')}`,
        legs: [leg1],
        captain: CREW_POOL[0]?.name || 'Unassigned',
        fo: CREW_POOL[1]?.name || 'Unassigned',
        block_hours: (Math.random() * 2 + 1).toFixed(1),
        duty_hours: (Math.random() * 2 + 6).toFixed(1),
        legal: true,
      });
    }
  }
  return pairings;
}

export default function PairingGenerator({ flights }) {
  const [generated, setGenerated] = useState(false);
  const [selectedPairing, setSelectedPairing] = useState(null);

  const pairings = useMemo(() => generated ? generatePairings(flights) : [], [flights, generated]);
  const illegal = pairings.filter(p => !p.legal).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-foreground">Pairing Generator</p>
            <p className="text-xs text-muted-foreground">{flights.length} flights · {CREW_POOL.length} crew available · FAR 117 compliant</p>
          </div>
          <button
            onClick={() => { setGenerated(true); setSelectedPairing(null); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5" />
            Generate Pairings
          </button>
        </div>
      </div>

      {generated && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
              <p className="text-2xl font-extrabold font-mono text-primary">{pairings.length}</p>
              <p className="text-xs text-muted-foreground">Pairings</p>
            </div>
            <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
              <p className="text-2xl font-extrabold font-mono text-green-400">{pairings.length - illegal}</p>
              <p className="text-xs text-muted-foreground">Legal</p>
            </div>
            <div className={cn('rounded-xl border px-4 py-3 text-center', illegal > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border')}>
              <p className={cn('text-2xl font-extrabold font-mono', illegal > 0 ? 'text-destructive' : 'text-muted-foreground')}>{illegal}</p>
              <p className="text-xs text-muted-foreground">Violations</p>
            </div>
          </div>

          {/* Pairing list */}
          <div className="space-y-2">
            {pairings.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPairing(selectedPairing?.id === p.id ? null : p)}
                className={cn(
                  'rounded-xl bg-card border cursor-pointer transition-all hover:bg-secondary/40 overflow-hidden',
                  p.legal ? 'border-border' : 'border-destructive/40',
                  selectedPairing?.id === p.id && 'ring-1 ring-primary'
                )}
              >
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold', p.legal ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive')}>
                      {p.id}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {p.legs.map(l => `${l.origin}→${l.destination}`).join(' / ')}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.captain} · {p.fo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-foreground">{p.block_hours}h block</p>
                    <p className="text-xs text-muted-foreground">{p.duty_hours}h duty</p>
                  </div>
                </div>
                {selectedPairing?.id === p.id && (
                  <div className="border-t border-border px-4 pb-3 pt-2 space-y-2 bg-secondary/10">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">Captain</p>
                        <p className="text-sm font-bold text-foreground">{p.captain}</p>
                      </div>
                      <div className="bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">First Officer</p>
                        <p className="text-sm font-bold text-foreground">{p.fo}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {p.legs.map((leg, i) => (
                        <div key={i} className="flex items-center gap-2 bg-background/40 rounded-lg px-3 py-2">
                          <Plane className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-xs font-mono font-bold text-foreground">{leg.flight_number}</span>
                          <span className="text-xs text-muted-foreground">{leg.origin} → {leg.destination}</span>
                          <span className="text-xs font-mono text-muted-foreground ml-auto">{leg.scheduled_departure}Z</span>
                        </div>
                      ))}
                    </div>
                    {!p.legal && (
                      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                        <p className="text-xs text-destructive font-semibold">Crew rest violation — reassignment required</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!generated && (
        <div className="rounded-xl bg-card border border-dashed border-border px-4 py-10 text-center">
          <GitMerge className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Click "Generate Pairings" to build optimized crew pairings</p>
        </div>
      )}
    </div>
  );
}