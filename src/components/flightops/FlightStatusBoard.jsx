import React from 'react';
import { Plane, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  scheduled:  { label: 'Scheduled',  color: 'text-muted-foreground',  bg: 'bg-muted',             icon: Clock },
  boarding:   { label: 'Boarding',   color: 'text-primary',           bg: 'bg-primary/15',         icon: Plane },
  departed:   { label: 'Departed',   color: 'text-blue-400',          bg: 'bg-blue-500/15',        icon: Plane },
  airborne:   { label: 'Airborne',   color: 'text-green-400',         bg: 'bg-green-500/15',       icon: Plane },
  arrived:    { label: 'Arrived',    color: 'text-green-400',         bg: 'bg-green-500/15',       icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-destructive',       bg: 'bg-destructive/15',     icon: XCircle },
  delayed:    { label: 'Delayed',    color: 'text-orange-400',        bg: 'bg-orange-500/15',      icon: AlertTriangle },
};

function FlightRow({ flight }) {
  const cfg = STATUS_CONFIG[flight.status] || STATUS_CONFIG.scheduled;
  const Icon = cfg.icon;

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3 border-b border-border/50 hover:bg-secondary/40 transition-colors text-sm">
      <div>
        <p className="font-mono font-bold text-foreground">{flight.flight_number}</p>
        <p className="text-xs text-muted-foreground">{flight.aircraft_tail} · {flight.aircraft_type}</p>
      </div>
      <div>
        <p className="font-mono font-semibold text-foreground">{flight.origin} → {flight.destination}</p>
        {flight.gate && <p className="text-xs text-muted-foreground">Gate {flight.gate}</p>}
      </div>
      <div>
        <p className="font-mono text-foreground">{flight.scheduled_departure || '--:--'}</p>
        {flight.actual_departure && (
          <p className="text-xs text-muted-foreground">Act: {flight.actual_departure}</p>
        )}
      </div>
      <div>
        {flight.delay_minutes > 0 && (
          <span className="text-xs font-semibold text-orange-400">+{flight.delay_minutes} min</span>
        )}
        {flight.delay_reason && (
          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{flight.delay_reason}</p>
        )}
      </div>
      <div>
        <span className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

export default function FlightStatusBoard({ flights, isLoading }) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 bg-secondary/60 border-b border-border">
        {['Flight / A/C', 'Route', 'STD', 'Delay', 'Status'].map(h => (
          <p key={h} className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{h}</p>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-sm">Loading flights…</div>
      ) : flights.length === 0 ? (
        <div className="flex justify-center py-10 text-muted-foreground text-sm">No flights for today</div>
      ) : (
        flights.map(f => <FlightRow key={f.id} flight={f} />)
      )}
    </div>
  );
}