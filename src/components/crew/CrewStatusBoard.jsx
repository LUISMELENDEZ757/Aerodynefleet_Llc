import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User, Clock, Plane, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Zap } from 'lucide-react';

const ROLE_LABEL = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

const LEGAL_CFG = {
  legal:      { label: 'Legal',      color: 'text-green-400',   bg: 'bg-green-500/15',   border: 'border-green-500/20',   dot: 'bg-green-400' },
  near_limit: { label: 'Near Limit', color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/20',  dot: 'bg-orange-400' },
  illegal:    { label: 'VIOLATION',  color: 'text-destructive', bg: 'bg-destructive/15', border: 'border-destructive/30', dot: 'bg-destructive' },
};

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function parseDutyMinutes(start, end) {
  if (!start) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = (end || '23:59').split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function DutyTimer({ dutyStart, dutyEnd }) {
  const now = useLiveClock();
  if (!dutyStart) return <span className="text-xs text-muted-foreground">—</span>;

  const [sh, sm] = dutyStart.split(':').map(Number);
  const startMs = new Date().setHours(sh, sm, 0, 0);
  const elapsedMs = now - startMs;
  const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
  const elapsedH = Math.floor(elapsedMin / 60);
  const elapsedM = elapsedMin % 60;

  const maxFDP = parseDutyMinutes(dutyStart, dutyEnd) || 540;
  const remainMin = Math.max(0, maxFDP - elapsedMin);
  const remH = Math.floor(remainMin / 60);
  const remM = remainMin % 60;
  const pct = Math.min(100, (elapsedMin / maxFDP) * 100);
  const critical = pct > 90;
  const warn = pct > 75;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">On duty: <span className="font-mono font-bold text-foreground">{elapsedH}h {elapsedM}m</span></span>
        <span className={cn('font-mono font-bold', critical ? 'text-destructive' : warn ? 'text-orange-400' : 'text-green-400')}>
          {remH}h {remM}m left
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', critical ? 'bg-destructive' : warn ? 'bg-orange-400' : 'bg-green-400')}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CrewCard({ member, flights }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = LEGAL_CFG[member.legal_status] || LEGAL_CFG.legal;
  const flight = flights.find(f => f.flight_number === member.flight_number);

  // Auto-alerts
  const alerts = [];
  if (member.duty_start && member.duty_end) {
    const totalFDP = parseDutyMinutes(member.duty_start, member.duty_end);
    const [sh, sm] = member.duty_start.split(':').map(Number);
    const now = new Date();
    const startMs = new Date().setHours(sh, sm, 0, 0);
    const elapsedMin = Math.max(0, Math.floor((now - startMs) / 60000));
    const remainMin = Math.max(0, totalFDP - elapsedMin);

    if (flight && flight.scheduled_arrival) {
      const [ah, am] = flight.scheduled_arrival.split(':').map(Number);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const arrivalMin = ah * 60 + am;
      const minsToArrival = arrivalMin - nowMin;
      if (minsToArrival > remainMin && remainMin < 60) {
        alerts.push({ level: 'critical', msg: `Crew may time out ${Math.round(minsToArrival - remainMin)}min before arrival` });
      }
    }
    if (remainMin < 30 && remainMin > 0) {
      alerts.push({ level: 'critical', msg: `Only ${remainMin}min of duty time remaining` });
    } else if (remainMin < 90) {
      alerts.push({ level: 'warn', msg: `Approaching duty limit — ${Math.floor(remainMin / 60)}h ${remainMin % 60}m remaining` });
    }
  }
  if (member.rest_hours_prior != null && member.rest_hours_prior < 10) {
    alerts.push({ level: 'critical', msg: `Insufficient rest prior: ${member.rest_hours_prior}h (min 10h required)` });
  }

  return (
    <div className={cn('rounded-xl bg-card border overflow-hidden transition-all', cfg.border, 'border')}>
      <button 
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${member.crew_name} (${ROLE_LABEL[member.role]}): ${cfg.label}`}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card', cfg.dot)} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">{member.crew_name}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABEL[member.role] || member.role}
              {member.flight_number && <span className="ml-2 font-mono text-foreground">{member.flight_number}</span>}
              {member.employee_id && <span className="ml-2 text-muted-foreground">#{member.employee_id}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <AlertTriangle className={cn('w-4 h-4', alerts[0].level === 'critical' ? 'text-destructive' : 'text-orange-400')} />
          )}
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3 bg-secondary/10">
          {/* Duty timer */}
          {member.duty_start && (
            <DutyTimer dutyStart={member.duty_start} dutyEnd={member.duty_end} />
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Duty Start', value: member.duty_start ? `${member.duty_start}Z` : '—' },
              { label: 'Duty End',   value: member.duty_end   ? `${member.duty_end}Z`   : '—' },
              { label: 'Rest Prior', value: member.rest_hours_prior != null ? `${member.rest_hours_prior}h` : '—', warn: member.rest_hours_prior != null && member.rest_hours_prior < 10 },
              { label: 'Flt Time',  value: member.total_flight_time_today != null ? `${member.total_flight_time_today}h` : '—', warn: member.total_flight_time_today > 8 },
            ].map(({ label, value, warn }) => (
              <div key={label} className={cn('rounded-lg px-3 py-2', warn ? 'bg-destructive/10' : 'bg-background/40')}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-sm font-mono font-bold', warn ? 'text-destructive' : 'text-foreground')}>{value}</p>
              </div>
            ))}
          </div>

          {/* Auto-alerts */}
          {alerts.map((a, i) => (
            <div key={i} className={cn('flex items-start gap-2 rounded-lg px-3 py-2',
              a.level === 'critical' ? 'bg-destructive/10 border border-destructive/20' : 'bg-orange-500/10 border border-orange-500/20'
            )}>
              <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', a.level === 'critical' ? 'text-destructive' : 'text-orange-400')} />
              <p className={cn('text-xs font-semibold', a.level === 'critical' ? 'text-destructive' : 'text-orange-400')}>{a.msg}</p>
            </div>
          ))}

          {/* Flight link */}
          {flight && (
            <div className="flex items-center gap-2 bg-background/40 rounded-lg px-3 py-2">
              <Plane className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs text-foreground font-mono">{flight.flight_number}</span>
              <span className="text-xs text-muted-foreground">{flight.origin} → {flight.destination}</span>
              <span className="text-xs font-mono text-foreground ml-auto">{flight.scheduled_departure}Z – {flight.scheduled_arrival}Z</span>
            </div>
          )}

          {member.notes && <p className="text-xs text-muted-foreground">{member.notes}</p>}
        </div>
      )}
    </div>
  );
}

export default function CrewStatusBoard({ crew, flights, isLoading }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? crew : crew.filter(c =>
    filter === 'illegal'    ? c.legal_status === 'illegal' :
    filter === 'near_limit' ? c.legal_status === 'near_limit' :
    (c.legal_status === 'legal' || !c.legal_status)
  );

  // Check if any departing flight has no legal crew
  const noCrewAlerts = flights.filter(f => {
    const flightCrew = crew.filter(c => c.flight_number === f.flight_number);
    const legalCrew = flightCrew.filter(c => c.legal_status === 'legal' || !c.legal_status);
    return flightCrew.length > 0 && legalCrew.length === 0 && f.status !== 'arrived' && f.status !== 'cancelled';
  });

  if (isLoading) return (
    <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
      Loading crew status…
    </div>
  );

  return (
    <div className="space-y-4">
       {/* No-legal-crew alerts */}
       {noCrewAlerts.map(f => (
         <div key={f.id} className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3" role="alert" aria-live="assertive">
           <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" aria-hidden="true" />
           <p className="text-sm font-bold text-destructive">
             NO LEGAL CREW — {f.flight_number} ({f.origin} → {f.destination}) departing {f.scheduled_departure}Z
           </p>
         </div>
       ))}

      {/* Filter bar */}
      <div className="flex gap-2" role="group" aria-label="Filter crew by legal status">
        {[
          { key: 'all',       label: `All (${crew.length})` },
          { key: 'legal',     label: `Legal (${crew.filter(c => c.legal_status === 'legal' || !c.legal_status).length})` },
          { key: 'near_limit',label: `Near Limit (${crew.filter(c => c.legal_status === 'near_limit').length})` },
          { key: 'illegal',   label: `Violations (${crew.filter(c => c.legal_status === 'illegal').length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            aria-label={`${label}${filter === key ? ' - currently selected' : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              filter === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
            )}>{label}</button>
        ))}
      </div>

      {/* Crew cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No crew assignments for today
        </div>
      ) : (
        <div className="space-y-2">
          {/* Sort: illegal first, then near, then legal */}
          {[...filtered]
            .sort((a, b) => {
              const order = { illegal: 0, near_limit: 1, legal: 2 };
              return (order[a.legal_status] ?? 2) - (order[b.legal_status] ?? 2);
            })
            .map(m => <CrewCard key={m.id} member={m} flights={flights} />)}
        </div>
      )}
    </div>
  );
}