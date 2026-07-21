import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, fmtZulu } from './fidsModel';

// Display Model (Board Row): Flight · Route · Scheduled · Estimated · Gate · Status · Aircraft
export default function FidsRow({ flight }) {
  const cfg = STATUS_COLORS[flight.status] || STATUS_COLORS['ON TIME'];
  const estDiffers = flight.estimated && flight.scheduled && fmtZulu(flight.estimated) !== fmtZulu(flight.scheduled);

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border/60', cfg.bg)}>
      {/* Flight */}
      <div className="flex items-center gap-2 w-24 flex-shrink-0">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
        <span className="font-mono font-extrabold text-sm text-foreground">{flight.flight_number}</span>
      </div>

      {/* Route */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-sm text-foreground">{flight.origin}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="font-mono text-sm font-bold text-foreground">{flight.destination}</span>
        {flight.remarks && <span className="text-[10px] text-orange-400 truncate ml-2 hidden md:block">{flight.remarks}</span>}
      </div>

      {/* Scheduled */}
      <div className="w-16 text-right flex-shrink-0">
        <span className="font-mono text-sm text-muted-foreground">{fmtZulu(flight.scheduled)}</span>
      </div>

      {/* Estimated */}
      <div className="w-16 text-right flex-shrink-0">
        <span className={cn('font-mono text-sm font-bold', estDiffers ? 'text-yellow-400' : 'text-foreground')}>
          {fmtZulu(flight.estimated)}
        </span>
      </div>

      {/* Gate */}
      <div className="hidden sm:block w-14 text-center flex-shrink-0">
        <span className="font-mono text-sm text-foreground">{flight.gate}</span>
      </div>

      {/* Status */}
      <div className={cn('text-[10px] font-extrabold px-2 py-1 rounded-md w-24 text-center flex-shrink-0 border border-current/20', cfg.color, cfg.bg)}>
        {flight.status}
      </div>

      {/* Aircraft */}
      <div className="hidden md:flex flex-col items-end w-20 flex-shrink-0 leading-tight">
        <span className="font-mono text-xs text-foreground">{flight.aircraft_type}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{flight.tail_number}</span>
      </div>
    </div>
  );
}