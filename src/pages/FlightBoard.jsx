import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plane, RefreshCw, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_CONFIG = {
  scheduled:  { label: 'ON TIME',    color: 'text-green-400',     bg: 'bg-green-500/10',    dot: 'bg-green-400' },
  boarding:   { label: 'BOARDING',   color: 'text-primary',       bg: 'bg-primary/10',      dot: 'bg-primary animate-pulse' },
  departed:   { label: 'DEPARTED',   color: 'text-blue-400',      bg: 'bg-blue-500/10',     dot: 'bg-blue-400' },
  airborne:   { label: 'AIRBORNE',   color: 'text-green-400',     bg: 'bg-green-500/10',    dot: 'bg-green-400 animate-pulse' },
  arrived:    { label: 'ARRIVED',    color: 'text-muted-foreground', bg: 'bg-muted',         dot: 'bg-muted-foreground' },
  cancelled:  { label: 'CANCELLED',  color: 'text-destructive',   bg: 'bg-destructive/10',  dot: 'bg-destructive' },
  delayed:    { label: 'DELAYED',    color: 'text-orange-400',    bg: 'bg-orange-500/10',   dot: 'bg-orange-400' },
};

function BoardRow({ flight }) {
  const cfg = STATUS_CONFIG[flight.status] || STATUS_CONFIG.scheduled;
  const isDelayed = flight.delay_minutes > 0;

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border border-border', cfg.bg)}>
      <div className="flex items-center gap-2 w-24 flex-shrink-0">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
        <span className="font-mono font-extrabold text-sm text-foreground">{flight.flight_number}</span>
      </div>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="font-mono text-sm text-foreground">{flight.origin}</span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="font-mono text-sm font-bold text-foreground">{flight.destination}</span>
      </div>

      <div className="hidden sm:block text-xs text-muted-foreground w-20 text-center flex-shrink-0">
        {flight.aircraft_tail || '—'}
      </div>

      <div className="text-right w-20 flex-shrink-0">
        <p className={cn('text-sm font-mono font-bold', isDelayed ? 'text-orange-400' : 'text-foreground')}>
          {isDelayed
            ? (() => {
                if (!flight.scheduled_departure) return '--:--';
                const [h, m] = flight.scheduled_departure.split(':').map(Number);
                const d = new Date(); d.setHours(h); d.setMinutes(m + (flight.delay_minutes || 0));
                return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
              })()
            : (flight.scheduled_departure || '--:--')}
        </p>
        {isDelayed && <p className="text-xs text-orange-400">+{flight.delay_minutes}m</p>}
      </div>

      <div className={cn('text-xs font-bold px-2 py-1 rounded-lg w-20 text-center flex-shrink-0', cfg.color, cfg.bg, 'border border-current/20')}>
        {cfg.label}
      </div>

      <div className="hidden sm:block text-xs text-muted-foreground w-12 text-right flex-shrink-0">
        {flight.gate || '—'}
      </div>
    </div>
  );
}

export default function FlightBoard() {
  const [zuluTime, setZuluTime] = useState(new Date());
  const [search, setSearch] = useState('');
  const pollingInterval = useDynamicPolling(30000, 120000);

  useEffect(() => {
    const t = setInterval(() => setZuluTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ['flight-board', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const sorted = [...flights]
    .filter(f => !search || f.flight_number?.includes(search.toUpperCase()) || f.destination?.includes(search.toUpperCase()) || f.origin?.includes(search.toUpperCase()))
    .sort((a, b) => (a.scheduled_departure || '').localeCompare(b.scheduled_departure || ''));

  const h = String(zuluTime.getUTCHours()).padStart(2, '0');
  const m = String(zuluTime.getUTCMinutes()).padStart(2, '0');
  const s = String(zuluTime.getUTCSeconds()).padStart(2, '0');

  return (
    <div className="min-h-screen bg-background">
      {/* Header — FIDS style */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Plane className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">DEPARTURE BOARD</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Live FIDS · {TODAY}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-2xl font-mono font-extrabold text-foreground">{h}:{m}:{s}</p>
            <p className="text-xs text-muted-foreground">UTC / Zulu</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary pills */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = flights.filter(f => f.status === key || (key === 'delayed' && f.delay_minutes > 0 && f.status !== 'delayed')).length;
            if (count === 0) return null;
            return (
              <span key={key} className={cn('text-xs font-bold px-3 py-1 rounded-full', cfg.color, cfg.bg)}>
                {count} {cfg.label}
              </span>
            );
          })}
        </div>

        {/* Search */}
        <input
          placeholder="Filter by flight, origin, or destination…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 bg-card border border-border rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-24">Flight</div>
          <div className="flex-1">Route</div>
          <div className="hidden sm:block w-20 text-center">Aircraft</div>
          <div className="w-20 text-right">STD</div>
          <div className="w-20 text-center">Status</div>
          <div className="hidden sm:block w-12 text-right">Gate</div>
        </div>

        {/* Board rows */}
        {isLoading ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">Loading flights…</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No flights scheduled for today
          </div>
        ) : (
          <div className="space-y-1.5">
            {sorted.map(f => <BoardRow key={f.id} flight={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}