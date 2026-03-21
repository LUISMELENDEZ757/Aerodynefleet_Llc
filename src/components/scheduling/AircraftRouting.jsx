import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plane, ArrowRight, Clock, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';

const MIN_TURN_MIN = 35; // minimum ground time

function buildRoutes(flights) {
  // Group flights by tail number
  const byTail = {};
  flights.forEach(f => {
    const tail = f.aircraft_tail || 'UNASSIGNED';
    if (!byTail[tail]) byTail[tail] = [];
    byTail[tail].push(f);
  });

  return Object.entries(byTail).map(([tail, legs]) => {
    const sorted = [...legs].sort((a, b) => (a.scheduled_departure || '').localeCompare(b.scheduled_departure || ''));
    const issues = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.destination !== curr.origin) {
        issues.push({ type: 'routing_gap', legs: [prev, curr], msg: `Gap: ${prev.destination} → ${curr.origin} mismatch` });
      }
      if (prev.scheduled_arrival && curr.scheduled_departure) {
        const arrMin = parseInt(prev.scheduled_arrival.split(':')[0]) * 60 + parseInt(prev.scheduled_arrival.split(':')[1]);
        const depMin = parseInt(curr.scheduled_departure.split(':')[0]) * 60 + parseInt(curr.scheduled_departure.split(':')[1]);
        const turnTime = depMin - arrMin;
        if (turnTime < MIN_TURN_MIN) {
          issues.push({ type: 'short_turn', legs: [prev, curr], msg: `Short turn: ${turnTime}m (min ${MIN_TURN_MIN}m)` });
        }
      }
    }
    return { tail, legs: sorted, issues };
  });
}

export default function AircraftRouting({ flights }) {
  const routes = useMemo(() => buildRoutes(flights), [flights]);
  const totalIssues = routes.reduce((s, r) => s + r.issues.length, 0);

  if (flights.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-dashed border-border px-4 py-10 text-center">
        <Plane className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No flights loaded — aircraft routing unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
          <p className="text-2xl font-extrabold font-mono text-primary">{routes.length}</p>
          <p className="text-xs text-muted-foreground">Tails Routing</p>
        </div>
        <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
          <p className="text-2xl font-extrabold font-mono text-foreground">{flights.length}</p>
          <p className="text-xs text-muted-foreground">Legs</p>
        </div>
        <div className={cn('rounded-xl border px-4 py-3 text-center', totalIssues > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-green-500/10 border-green-500/30')}>
          <p className={cn('text-2xl font-extrabold font-mono', totalIssues > 0 ? 'text-destructive' : 'text-green-400')}>{totalIssues}</p>
          <p className="text-xs text-muted-foreground">Routing Issues</p>
        </div>
      </div>

      {/* Per-tail routing */}
      {routes.map(route => (
        <div key={route.tail} className={cn(
          'rounded-xl bg-card border overflow-hidden',
          route.issues.length > 0 ? 'border-orange-500/30' : 'border-border'
        )}>
          <div className="px-4 py-3 bg-secondary/40 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary" />
              <p className="text-sm font-mono font-bold text-foreground">{route.tail}</p>
              <span className="text-xs text-muted-foreground">{route.legs.length} leg{route.legs.length !== 1 ? 's' : ''}</span>
            </div>
            {route.issues.length > 0 ? (
              <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full">
                {route.issues.length} issue{route.issues.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Clear
              </span>
            )}
          </div>
          <div className="p-3">
            {/* Route chain */}
            <div className="flex flex-wrap items-center gap-1 mb-3">
              {route.legs.map((leg, i) => (
                <React.Fragment key={leg.id}>
                  <div className="bg-background/60 rounded-lg px-2 py-1.5 text-xs">
                    <p className="font-mono font-bold text-foreground">{leg.flight_number}</p>
                    <p className="text-muted-foreground">{leg.origin}→{leg.destination}</p>
                    <p className="text-muted-foreground font-mono">{leg.scheduled_departure}Z</p>
                  </div>
                  {i < route.legs.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
            {/* Issues */}
            {route.issues.length > 0 && (
              <div className="space-y-1">
                {route.issues.map((issue, i) => (
                  <div key={i} className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                    issue.type === 'routing_gap' ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                  )}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {issue.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}