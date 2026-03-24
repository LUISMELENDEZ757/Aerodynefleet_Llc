import { Cloud, Wind, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const FLIGHT_CATEGORIES = {
  VFR: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  MVFR: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  IFR: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  LIFR: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

function WeatherCard({ airport, category, metar }) {
  const cfg = FLIGHT_CATEGORIES[category] || FLIGHT_CATEGORIES.VFR;

  return (
    <div className={cn('rounded-xl border px-4 py-3 space-y-2', cfg.bg, cfg.border)}>
      <div className="flex items-center justify-between">
        <p className={cn('text-sm font-mono font-bold', cfg.color)}>{airport}</p>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
          {category}
        </span>
      </div>
      {metar && (
        <p className="text-xs font-mono text-foreground bg-background/40 rounded px-2 py-1 whitespace-pre-wrap break-all max-h-20 overflow-hidden">
          {metar}
        </p>
      )}
    </div>
  );
}

export default function DispatchWeatherPanel({ flights = [], monitoring = [] }) {
  const airports = new Set();
  flights.forEach(f => {
    airports.add(f.origin);
    airports.add(f.destination);
  });

  return (
    <div className="space-y-4">
      <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
        Dispatch Weather Briefing
      </p>

      {Array.from(airports).length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No airports for today's flights
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from(airports).map(airport => (
            <WeatherCard
              key={airport}
              airport={airport}
              category="MVFR"
              metar="KJFK 241251Z 31008KT 10SM FEW250 23/14 A3012 RMK AO2 SLP201 T02330139"
            />
          ))}
        </div>
      )}

      {/* Weather Alerts */}
      <div>
        <p className="text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Active SIGMETs
        </p>
        <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 px-4 py-3">
          <p className="text-xs font-semibold text-orange-400">No SIGMETs active</p>
        </div>
      </div>

      {/* Reference */}
      <div className="rounded-xl bg-secondary/30 border border-border p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flight Categories</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-green-400 font-bold">VFR:</span> <span className="text-muted-foreground">&gt; 3SM, &gt; 1000'</span></div>
          <div><span className="text-blue-400 font-bold">MVFR:</span> <span className="text-muted-foreground">1-3SM, 500-1000'</span></div>
          <div><span className="text-orange-400 font-bold">IFR:</span> <span className="text-muted-foreground">&lt; 1SM, &lt; 500'</span></div>
          <div><span className="text-destructive font-bold">LIFR:</span> <span className="text-muted-foreground">&lt; ½SM, &lt; 200'</span></div>
        </div>
      </div>
    </div>
  );
}