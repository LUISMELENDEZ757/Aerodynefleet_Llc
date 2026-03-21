import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';
import {
  Plane, Users, RefreshCw, ChevronDown, ChevronRight,
  Clock, AlertTriangle, CheckCircle, ShieldCheck, FileText, Wind
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { lazy } from 'react';
const ELogbook = lazy(() => import('@/components/crew/ELogbook'));
const CabinZonesPanel = lazy(() => import('@/components/cabin/CabinZonesPanel'));
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

const LEGAL_CONFIG = {
  legal:      { label: 'Legal',      color: 'text-green-400',   bg: 'bg-green-500/15' },
  near_limit: { label: 'Near Limit', color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  illegal:    { label: 'ILLEGAL',    color: 'text-destructive', bg: 'bg-destructive/15' },
};

const ROLE_LABELS = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

const PREFLIGHT_CHECKS = [
  'Weather briefing reviewed (METAR/TAF/SIGMET)',
  'NOTAMs checked for origin & destination',
  'Flight plan filed and confirmed',
  'Aircraft documents verified (AD/C of A/Insurance)',
  'MEL/CDL items reviewed and accepted',
  'Fuel on board verified vs. release',
  'Weight & balance within limits',
  'ATIS received — current altimeter set',
  'Crew rest hours verified (FAR 117)',
  'Emergency equipment checked & accessible',
  'Cockpit setup complete — FMS programmed',
  'Takeoff performance data computed',
];

function StatCard({ icon: Icon, label, value, color }) {
   return (
     <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3" role="region" aria-label={`${label}: ${value}`}>
       <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0" aria-hidden="true">
         <Icon className={cn('w-4 h-4', color)} />
       </div>
       <div>
         <p className={cn('text-2xl font-extrabold font-mono', color)} aria-label={`${label}: ${value}`}>{value}</p>
         <p className="text-xs text-muted-foreground">{label}</p>
       </div>
     </div>
   );
 }

function FlightCrewCard({ flight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[flight.status] || STATUS_CONFIG.scheduled;

  const { data: crewList = [] } = useQuery({
    queryKey: ['crew-flight', flight.flight_number, TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_number: flight.flight_number, flight_date: TODAY }),
    enabled: expanded,
  });

  const { data: release } = useQuery({
    queryKey: ['release-flight', flight.flight_number, TODAY],
    queryFn: async () => {
      const res = await base44.entities.DispatchRelease.filter({ flight_number: flight.flight_number, flight_date: TODAY });
      return res[0] || null;
    },
    enabled: expanded,
  });

  const flightCrew = crewList.filter(c => c.role === 'captain' || c.role === 'first_officer');

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
         onClick={() => setExpanded(!expanded)}
         aria-expanded={expanded}
         aria-label={`${expanded ? 'Collapse' : 'Expand'} flight ${flight.flight_number}: ${flight.origin} to ${flight.destination}`}
         className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
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
              {flight.aircraft_tail ? ` · ${flight.aircraft_tail}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono text-foreground">{flight.scheduled_departure || '--:--'} → {flight.scheduled_arrival || '--:--'}</p>
            {flight.delay_minutes > 0 && (
              <p className="text-xs text-orange-400 font-semibold">+{flight.delay_minutes} min delay</p>
            )}
          </div>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4 bg-secondary/10">
          {/* Flight details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Aircraft</p>
              <p className="text-sm font-mono font-bold text-foreground">{flight.aircraft_tail || '—'}</p>
              <p className="text-xs text-muted-foreground">{flight.aircraft_type || ''}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">STD / STA</p>
              <p className="text-sm font-mono font-bold text-foreground">
                {flight.scheduled_departure || '--'} / {flight.scheduled_arrival || '--'}
              </p>
            </div>
            {flight.delay_minutes > 0 && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Delay</p>
                <p className="text-sm font-mono font-bold text-orange-400">+{flight.delay_minutes} min</p>
                {flight.delay_reason && <p className="text-xs text-muted-foreground">{flight.delay_reason}</p>}
              </div>
            )}
            {flight.gate && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Gate</p>
                <p className="text-sm font-mono font-bold text-foreground">{flight.gate}</p>
              </div>
            )}
          </div>

          {/* Flight crew legality */}
          {flightCrew.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Flight Crew
              </p>
              <div className="space-y-2">
                {flightCrew.map(c => {
                  const legal = LEGAL_CONFIG[c.legal_status] || LEGAL_CONFIG.legal;
                  return (
                    <div key={c.id} className="flex items-center justify-between bg-background/40 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <Users className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.crew_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[c.role] || c.role}
                            {c.duty_start ? ` · ${c.duty_start}–${c.duty_end}` : ''}
                            {c.rest_hours_prior != null ? ` · ${c.rest_hours_prior}h rest` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', legal.bg, legal.color)}>
                        {legal.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dispatch release */}
          {release && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Dispatch Release
              </p>
              <div className="bg-background/40 rounded-lg px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    release.release_status === 'released' ? 'bg-green-500/15 text-green-400' :
                    release.release_status === 'pending'  ? 'bg-muted text-muted-foreground' :
                    release.release_status === 'amended'  ? 'bg-primary/15 text-primary' :
                    'bg-destructive/15 text-destructive'
                  )}>
                    {release.release_status?.charAt(0).toUpperCase() + release.release_status?.slice(1)}
                  </span>
                </div>
                {release.fuel_on_board != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Fuel On Board</span>
                    <span className="text-xs font-mono font-bold text-foreground">{release.fuel_on_board.toLocaleString()} lbs</span>
                  </div>
                )}
                {release.min_fuel_required != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Min Required</span>
                    <span className="text-xs font-mono font-bold text-foreground">{release.min_fuel_required.toLocaleString()} lbs</span>
                  </div>
                )}
                {release.alternate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Alternate</span>
                    <span className="text-xs font-mono font-bold text-foreground">{release.alternate}</span>
                  </div>
                )}
                {release.dispatcher_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Dispatcher</span>
                    <span className="text-xs font-semibold text-foreground">{release.dispatcher_name}</span>
                  </div>
                )}
                {release.remarks && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Remarks</p>
                    <p className="text-xs text-foreground">{release.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ops notes */}
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

function PreflightChecklist() {
  const [checked, setChecked] = useState({});
  const toggle = (item) => setChecked(prev => ({ ...prev, [item]: !prev[item] }));
  const done = Object.values(checked).filter(Boolean).length;
  const total = PREFLIGHT_CHECKS.length;
  const allDone = done === total;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Preflight Checklist
          </p>
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
        {PREFLIGHT_CHECKS.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            aria-pressed={checked[item]}
            aria-label={`${checked[item] ? 'Completed' : 'Incomplete'}: ${item}`}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              checked[item] ? 'bg-green-500/10' : 'hover:bg-secondary/50'
            )}
          >
            <div className={cn(
               'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
               checked[item] ? 'border-green-500 bg-green-500' : 'border-border'
             )} aria-hidden="true">
               {checked[item] && <CheckCircle className="w-3 h-3 text-white" aria-hidden="true" />}
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
            <p className="text-sm font-semibold text-green-400">All preflight items complete — cleared for departure</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlightCrewDashboard() {
  const pollingInterval = useDynamicPolling(60000, 300000); // 60s active, 5min hidden
  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ['fc-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const airborne  = flights.filter(f => f.status === 'airborne').length;
  const scheduled = flights.filter(f => f.status === 'scheduled' || f.status === 'boarding').length;
  const delayed   = flights.filter(f => f.status === 'delayed' || f.delay_minutes > 0).length;
  const cancelled = flights.filter(f => f.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Plane className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide leading-tight">
                AERODYNE FLEET LLC
              </h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Flight Crew · Cockpit</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-2xl font-mono font-bold text-foreground">{timeStr}</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <button
          onClick={refetch}
          aria-label="Refresh all flight crew data from server"
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded px-2 py-1"
        >
          <RefreshCw className="w-3 h-3" aria-hidden="true" />
          Refresh data
        </button>
      </div>

      <div className="p-4 space-y-4" role="main" aria-label="Flight crew dashboard content">
        {/* Stat bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="region" aria-label="Flight operations summary statistics">
          <StatCard icon={Plane}         label="Airborne"  value={airborne}  color={airborne > 0 ? 'text-green-400' : 'text-muted-foreground'} />
          <StatCard icon={Clock}         label="On Sched"  value={scheduled} color={scheduled > 0 ? 'text-primary' : 'text-muted-foreground'} />
          <StatCard icon={AlertTriangle} label="Delayed"   value={delayed}   color={delayed > 0 ? 'text-orange-400' : 'text-muted-foreground'} />
          <StatCard icon={Wind}          label="Cancelled" value={cancelled} color={cancelled > 0 ? 'text-destructive' : 'text-muted-foreground'} />
        </div>

        {/* Flights */}
        <div>
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Today's Flight Schedule
          </p>
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
              {flights.map(f => <FlightCrewCard key={f.id} flight={f} />)}
            </div>
          )}
        </div>

        {/* Preflight checklist */}
        <div role="region" aria-label="Preflight preparation checklist">
          <PreflightChecklist />
        </div>

        {/* Cabin zones — aircraft-specific configuration */}
        {flights.length > 0 && flights[0].aircraft_type && (
          <div role="region" aria-label={`Cabin configuration for ${flights[0].aircraft_type}`}>
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Cabin Configuration — {flights[0].aircraft_type}
            </p>
            <Suspense fallback={<div className="text-xs text-muted-foreground p-4">Loading cabin config...</div>}>
              <CabinZonesPanel aircraftType={flights[0].aircraft_type} />
            </Suspense>
          </div>
        )}

        {/* E-Logbook — MEL review & post-arrival discrepancy */}
        <div role="region" aria-label="Aircraft electronic logbook and maintenance discrepancies">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" /> E-Logbook
          </p>
          <Suspense fallback={<div className="text-xs text-muted-foreground p-4">Loading logbook...</div>}>
            <ELogbook flights={flights} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}