import { cn } from '@/lib/utils';
import { Plane, ArrowRight, AlertTriangle } from 'lucide-react';

const STATUS_COLORS = {
  scheduled: 'text-muted-foreground bg-muted',
  boarding:  'text-primary bg-primary/15',
  departed:  'text-blue-400 bg-blue-500/15',
  airborne:  'text-green-400 bg-green-500/15',
  arrived:   'text-green-400 bg-green-500/15',
  cancelled: 'text-destructive bg-destructive/15',
  delayed:   'text-orange-400 bg-orange-500/15',
};

export default function IROPSDominoes({ events, flights }) {
  // Find all flights impacted by any active IROPS event
  const affectedFlightNumbers = new Set(events.flatMap(e => e.affected_flights || []));
  const impactedFlights = flights.filter(f => affectedFlightNumbers.has(f.flight_number));
  const unaffectedFlights = flights.filter(f => !affectedFlightNumbers.has(f.flight_number));

  if (impactedFlights.length === 0) return null;

  // Group cascades: flights that share same aircraft as impacted flights
  const impactedTails = new Set(impactedFlights.map(f => f.aircraft_tail).filter(Boolean));
  const cascadeFlights = unaffectedFlights.filter(f =>
    f.aircraft_tail && impactedTails.has(f.aircraft_tail) && f.status === 'scheduled'
  );

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-destructive/10 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <p className="text-xs font-mono font-semibold text-destructive uppercase tracking-wider">
          Domino Effect — {impactedFlights.length} Direct + {cascadeFlights.length} Cascade Impact{cascadeFlights.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Direct impacts */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Directly Impacted Flights</p>
          <div className="flex flex-wrap gap-2">
            {impactedFlights.map(f => {
              const colorClass = STATUS_COLORS[f.status] || STATUS_COLORS.scheduled;
              return (
                <div key={f.id} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border border-destructive/30 bg-destructive/10')}>
                  <Plane className="w-3.5 h-3.5 text-destructive" />
                  <div>
                    <p className="text-xs font-mono font-bold text-foreground">{f.flight_number}</p>
                    <p className="text-xs text-muted-foreground">{f.origin} → {f.destination}</p>
                  </div>
                  <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full ml-1', colorClass)}>
                    {f.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cascade impacts */}
        {cascadeFlights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Cascade Risk — Same Aircraft</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cascadeFlights.map(f => (
                <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10">
                  <Plane className="w-3.5 h-3.5 text-orange-400" />
                  <div>
                    <p className="text-xs font-mono font-bold text-foreground">{f.flight_number}</p>
                    <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.aircraft_tail}</p>
                  </div>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400">at risk</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {impactedFlights.length + cascadeFlights.length} total flights at risk across {[...impactedTails].length} aircraft
        </p>
      </div>
    </div>
  );
}