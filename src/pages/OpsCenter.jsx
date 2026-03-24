import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';
import {
  LayoutDashboard, Plane, Wrench, Users, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Zap, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

function StatTile({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', color)} />
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={cn('text-3xl font-extrabold font-mono', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FlightRow({ flight }) {
  const STATUS = {
    scheduled: { label: 'Scheduled', color: 'text-muted-foreground', bg: 'bg-muted' },
    boarding:  { label: 'Boarding',  color: 'text-primary',          bg: 'bg-primary/15' },
    departed:  { label: 'Departed',  color: 'text-blue-400',         bg: 'bg-blue-500/15' },
    airborne:  { label: 'Airborne',  color: 'text-green-400',        bg: 'bg-green-500/15' },
    arrived:   { label: 'Arrived',   color: 'text-green-400',        bg: 'bg-green-500/15' },
    cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
    delayed:   { label: 'Delayed',   color: 'text-orange-400',       bg: 'bg-orange-500/15' },
  };
  const cfg = STATUS[flight.status] || STATUS.scheduled;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
      <Plane className="w-4 h-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-bold text-foreground">{flight.flight_number}</p>
        <p className="text-xs text-muted-foreground">{flight.origin} → {flight.destination} · {flight.aircraft_tail || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
        {flight.delay_minutes > 0 && (
          <p className="text-xs text-orange-400 mt-0.5">+{flight.delay_minutes}m</p>
        )}
      </div>
    </div>
  );
}

function OOSRow({ entry }) {
  const STATUS_COLOR = {
    in_work: 'text-orange-400 bg-orange-500/15',
    waiting_on_parts: 'text-destructive bg-destructive/15',
    released: 'text-green-400 bg-green-500/15',
    deferred: 'text-muted-foreground bg-muted',
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
      <Wrench className="w-4 h-4 text-orange-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{entry.tail_number}</p>
        <p className="text-xs text-muted-foreground truncate">{entry.work_description}</p>
      </div>
      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', STATUS_COLOR[entry.status] || 'text-muted-foreground bg-muted')}>
        {entry.status?.replace('_', ' ')}
      </span>
    </div>
  );
}

export default function OpsCenter() {
  const pollingInterval = useDynamicPolling(30000, 300000);

  const { data: flights = [], refetch: refetchFlights } = useQuery({
    queryKey: ['opscenter-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: crew = [], refetch: refetchCrew } = useQuery({
    queryKey: ['opscenter-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: oos = [], refetch: refetchOOS } = useQuery({
    queryKey: ['opscenter-oos'],
    queryFn: () => base44.entities.OOSEntry.list(),
    refetchInterval: pollingInterval,
  });

  const { data: safety = [], refetch: refetchSafety } = useQuery({
    queryKey: ['opscenter-safety'],
    queryFn: () => base44.entities.SafetyReport.filter({ status: 'open' }),
    refetchInterval: pollingInterval,
  });

  const refetch = () => { refetchFlights(); refetchCrew(); refetchOOS(); refetchSafety(); };

  const airborne  = flights.filter(f => f.status === 'airborne').length;
  const delayed   = flights.filter(f => f.status === 'delayed' || f.delay_minutes > 0).length;
  const illegal   = crew.filter(c => c.legal_status === 'illegal').length;
  const activeOOS = oos.filter(o => o.status === 'in_work' || o.status === 'waiting_on_parts').length;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">OPS CENTER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Unified Ops · Live Status · Command View</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={refetch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {/* Critical alerts */}
        {(illegal > 0 || activeOOS > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {illegal > 0 && (
              <div className="flex items-center gap-1.5 bg-destructive/15 border border-destructive/30 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" /> {illegal} Crew Violation{illegal > 1 ? 's' : ''}
              </div>
            )}
            {activeOOS > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold text-orange-400">
                <Wrench className="w-3.5 h-3.5" /> {activeOOS} Active MX
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon={Plane}         label="Airborne"      value={airborne}         color={airborne > 0 ? 'text-green-400' : 'text-muted-foreground'} sub={`${flights.length} total today`} />
          <StatTile icon={Clock}         label="Delayed"       value={delayed}          color={delayed > 0 ? 'text-orange-400' : 'text-muted-foreground'} />
          <StatTile icon={Wrench}        label="MX Active"     value={activeOOS}        color={activeOOS > 0 ? 'text-orange-400' : 'text-muted-foreground'} />
          <StatTile icon={AlertTriangle} label="Open Safety"   value={safety.length}    color={safety.length > 0 ? 'text-destructive' : 'text-muted-foreground'} />
        </div>

        {/* Live flight board */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Live Flight Board
            </p>
            <Link to="/Dashboard" className="text-xs text-primary hover:underline">Full Board →</Link>
          </div>
          {flights.length === 0
            ? <p className="px-4 py-6 text-sm text-muted-foreground text-center">No flights today</p>
            : flights.slice(0, 8).map(f => <FlightRow key={f.id} flight={f} />)
          }
        </div>

        {/* MX / OOS */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Maintenance Status
            </p>
            <Link to="/Dashboard" className="text-xs text-primary hover:underline">Full MX →</Link>
          </div>
          {oos.length === 0
            ? <p className="px-4 py-6 text-sm text-muted-foreground text-center">No active maintenance</p>
            : oos.slice(0, 5).map(o => <OOSRow key={o.id} entry={o} />)
          }
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Flight Ops',    sub: 'Dashboard',       path: '/Dashboard',    color: 'border-primary/30 text-primary' },
            { label: 'Crew Control',  sub: 'FAR 117 · AI',    path: '/CrewControl',  color: 'border-red-500/30 text-red-400' },
            { label: 'EFB',           sub: 'Flight Bag',       path: '/EFB',          color: 'border-yellow-500/30 text-yellow-400' },
            { label: 'Safety & QA',   sub: 'ASAP · Reports',  path: '/SafetyQA',     color: 'border-orange-500/30 text-orange-400' },
            { label: 'Weather',       sub: 'METAR · SIGMET',  path: '/Weather',      color: 'border-cyan-500/30 text-cyan-400' },
            { label: 'Logbook',       sub: 'Flight Log',       path: '/Logbook',      color: 'border-emerald-500/30 text-emerald-400' },
          ].map(({ label, sub, path, color }) => (
            <Link key={path} to={path}
              className={cn('rounded-xl border bg-card px-4 py-3 hover:bg-secondary/40 transition-colors', color.split(' ')[0])}>
              <p className={cn('text-sm font-bold', color.split(' ')[1])}>{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}