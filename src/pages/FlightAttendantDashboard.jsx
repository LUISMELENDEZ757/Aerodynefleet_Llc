import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Plane, ClipboardList, ShieldCheck, RefreshCw, ChevronDown, ChevronRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'text-muted-foreground', bg: 'bg-muted' },
  boarding:  { label: 'Boarding',  color: 'text-primary',          bg: 'bg-primary/15' },
  departed:  { label: 'Departed',  color: 'text-blue-400',         bg: 'bg-blue-500/15' },
  airborne:  { label: 'Airborne',  color: 'text-green-400',        bg: 'bg-green-500/15' },
  arrived:   { label: 'Arrived',   color: 'text-green-400',        bg: 'bg-green-500/15' },
  cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
  delayed:   { label: 'Delayed',   color: 'text-orange-400',       bg: 'bg-orange-500/15' },
};

const CABIN_CHECKS = [
  'Emergency exit row briefing completed',
  'Seatbelt demo / safety video ready',
  'Galley equipment secured',
  'Overhead bins latched pre-departure',
  'First aid kit accessible & sealed',
  'Fire extinguisher location confirmed',
  'Lavatory smoke detectors functional',
  'Passenger count & manifest reconciled',
];

function FlightCard({ flight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[flight.status] || STATUS_CONFIG.scheduled;

  const fa = useQuery({
    queryKey: ['crew-fa', flight.flight_number],
    queryFn: () => base44.entities.CrewAssignment.filter({
      flight_number: flight.flight_number,
      flight_date: TODAY,
    }),
    select: (data) => data.filter(c => c.role === 'flight_attendant'),
  });

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Plane className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-mono font-bold text-foreground">{flight.flight_number}</p>
            <p className="text-xs text-muted-foreground">
              {flight.origin} → {flight.destination}
              {flight.gate ? ` · Gate ${flight.gate}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono text-foreground">{flight.scheduled_departure || '--:--'}</p>
            {flight.delay_minutes > 0 && (
              <p className="text-xs text-orange-400 font-semibold">+{flight.delay_minutes} min</p>
            )}
          </div>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4 bg-secondary/10">
          {/* Aircraft & timing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {flight.aircraft_tail && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Aircraft</p>
                <p className="text-sm font-mono font-bold text-foreground">{flight.aircraft_tail}</p>
                {flight.aircraft_type && <p className="text-xs text-muted-foreground">{flight.aircraft_type}</p>}
              </div>
            )}
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">STD / STA</p>
              <p className="text-sm font-mono font-bold text-foreground">
                {flight.scheduled_departure || '--'} / {flight.scheduled_arrival || '--'}
              </p>
            </div>
            {flight.actual_departure && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">ATD</p>
                <p className="text-sm font-mono font-bold text-foreground">{flight.actual_departure}</p>
              </div>
            )}
            {flight.delay_reason && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Delay Reason</p>
                <p className="text-xs text-orange-400 font-semibold">{flight.delay_reason}</p>
              </div>
            )}
          </div>

          {/* FA crew */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Cabin Crew
            </p>
            {fa.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : fa.data?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No flight attendants assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fa.data?.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-background/40 rounded-lg px-3 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{c.crew_name}</p>
                      <p className="text-xs text-muted-foreground">{c.duty_start}–{c.duty_end}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-bold px-1.5 py-0.5 rounded-full',
                      c.legal_status === 'legal' ? 'text-green-400 bg-green-500/15' :
                      c.legal_status === 'near_limit' ? 'text-orange-400 bg-orange-500/15' :
                      'text-destructive bg-destructive/15'
                    )}>
                      {c.legal_status === 'legal' ? 'Legal' : c.legal_status === 'near_limit' ? 'Near Limit' : 'ILLEGAL'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {flight.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ops Notes</p>
              <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2">{flight.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CabinChecklist() {
  const [checked, setChecked] = useState({});

  const toggle = (item) => setChecked(prev => ({ ...prev, [item]: !prev[item] }));
  const total = CABIN_CHECKS.length;
  const done = Object.values(checked).filter(Boolean).length;
  const allDone = done === total;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Pre-Departure Cabin Check</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <span className={cn('text-xs font-bold', allDone ? 'text-green-400' : 'text-muted-foreground')}>
            {done}/{total}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1">
        {CABIN_CHECKS.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
              checked[item] ? 'bg-green-500/10' : 'hover:bg-secondary/50'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
              checked[item] ? 'border-green-500 bg-green-500' : 'border-border'
            )}>
              {checked[item] && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={cn(
              'text-sm transition-colors',
              checked[item] ? 'text-muted-foreground line-through' : 'text-foreground'
            )}>
              {item}
            </span>
          </button>
        ))}
      </div>
      {allDone && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-400">All cabin checks complete — ready for boarding</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function FlightAttendantDashboard() {
  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ['fa-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const boarding = flights.filter(f => f.status === 'boarding').length;
  const airborne = flights.filter(f => f.status === 'airborne').length;
  const delayed  = flights.filter(f => f.status === 'delayed' || f.delay_minutes > 0).length;
  const cancelled = flights.filter(f => f.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide leading-tight">
                AERODYNE FLEET LLC
              </h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Cabin Crew · Flight Attendant</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-2xl font-mono font-bold text-foreground">{timeStr}</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh data
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stat bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Plane}        label="Airborne"  value={airborne}  color={airborne > 0 ? 'text-green-400' : 'text-muted-foreground'} />
          <StatCard icon={Clock}        label="Boarding"  value={boarding}  color={boarding > 0 ? 'text-primary' : 'text-muted-foreground'} />
          <StatCard icon={AlertTriangle} label="Delayed"  value={delayed}   color={delayed > 0 ? 'text-orange-400' : 'text-muted-foreground'} />
          <StatCard icon={ShieldCheck}  label="Cancelled" value={cancelled} color={cancelled > 0 ? 'text-destructive' : 'text-muted-foreground'} />
        </div>

        {/* Today's flights */}
        <div>
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today's Flights</p>
          {isLoading ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Loading flights…
            </div>
          ) : flights.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No flights scheduled for today
            </div>
          ) : (
            <div className="space-y-2">
              {flights.map(f => <FlightCard key={f.id} flight={f} />)}
            </div>
          )}
        </div>

        {/* Pre-departure checklist */}
        <CabinChecklist />
      </div>
    </div>
  );
}