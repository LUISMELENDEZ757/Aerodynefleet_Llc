import { useState } from 'react';
import { MapPin, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GateReassign({ flights, candidateGates, applyGate, isReassigning }) {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedGate,   setSelectedGate]   = useState(null);

  // Only ground ops flights
  const eligible = flights.filter(f =>
    f.status !== 'airborne' && f.status !== 'arrived'
  );

  const gates = selectedFlight ? candidateGates(selectedFlight.origin) : [];

  const handleApply = () => {
    if (!selectedFlight || !selectedGate) return;
    applyGate({ flightId: selectedFlight.id, gate: selectedGate });
    setSelectedFlight(null);
    setSelectedGate(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-secondary/20 border border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Reassign a departure gate for any ground-ops flight. Select flight, then choose an available gate.
        </p>
      </div>

      {/* Flight picker */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Select Flight</p>
        </div>
        {eligible.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No eligible flights</p>
        ) : (
          eligible.map(f => (
            <button
              key={f.id}
              onClick={() => { setSelectedFlight(s => s?.id === f.id ? null : f); setSelectedGate(null); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 text-left transition-colors',
                selectedFlight?.id === f.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-secondary/30'
              )}
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · Current gate: <span className="font-semibold text-foreground">{f.gate || '—'}</span></p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Gate picker */}
      {selectedFlight && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              Available Gates — {selectedFlight.origin}
            </p>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {gates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available gates found</p>
            ) : (
              gates.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGate(sel => sel === g ? null : g)}
                  className={cn(
                    'w-14 h-12 rounded-xl border text-sm font-mono font-bold transition-all',
                    selectedGate === g
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  )}
                >{g}</button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirm */}
      {selectedFlight && selectedGate && (
        <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gate Change</p>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold text-foreground">{selectedFlight.flight_number}</span>
            <span className="text-muted-foreground">Gate {selectedFlight.gate || '—'}</span>
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-primary">Gate {selectedGate}</span>
          </div>
          <button
            onClick={handleApply}
            disabled={isReassigning}
            className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {isReassigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isReassigning ? 'Saving…' : 'Confirm Gate Reassignment'}
          </button>
        </div>
      )}
    </div>
  );
}