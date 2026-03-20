import React from 'react';
import { cn } from '@/lib/utils';
import {
  Plane, Users, Wrench, Radio, AlertTriangle, CheckCircle,
  ArrowRight, Clock, Zap, ShieldAlert, ShieldCheck
} from 'lucide-react';

const STATUS_CFG = {
  scheduled: { label: 'Scheduled', color: 'text-muted-foreground', bg: 'bg-muted/60' },
  boarding:  { label: 'Boarding',  color: 'text-primary',          bg: 'bg-primary/15' },
  departed:  { label: 'Departed',  color: 'text-blue-400',         bg: 'bg-blue-500/15' },
  airborne:  { label: 'Airborne',  color: 'text-green-400',        bg: 'bg-green-500/15' },
  arrived:   { label: 'Arrived',   color: 'text-green-400',        bg: 'bg-green-500/15' },
  cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
  delayed:   { label: 'Delayed',   color: 'text-orange-400',       bg: 'bg-orange-500/15' },
};

function PipelineIssue({ level, msg }) {
  return (
    <div className={cn(
      'flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-semibold',
      level === 'critical' ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
    )}>
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      {msg}
    </div>
  );
}

function DeptBadge({ icon: Icon, label, ok, count, detail }) {
  return (
    <div className={cn(
      'flex flex-col gap-1 rounded-xl border px-3 py-2.5 min-w-[110px]',
      ok ? 'border-green-500/20 bg-green-500/5' : 'border-orange-500/20 bg-orange-500/5'
    )}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn('w-3.5 h-3.5', ok ? 'text-green-400' : 'text-orange-400')} />
        <span className="text-xs font-bold text-foreground">{label}</span>
      </div>
      <p className={cn('text-lg font-extrabold font-mono', ok ? 'text-green-400' : 'text-orange-400')}>{count}</p>
      <p className="text-xs text-muted-foreground leading-tight">{detail}</p>
    </div>
  );
}

export default function OpsPipeline({ crew, flights, releases, oosEntries }) {
  // Cross-system analysis
  const activeFlights  = flights.filter(f => !['arrived', 'cancelled'].includes(f.status));
  const airborne       = flights.filter(f => f.status === 'airborne');
  const delayed        = flights.filter(f => f.status === 'delayed' || f.delay_minutes > 0);
  const cancelled      = flights.filter(f => f.status === 'cancelled');

  const illegalCrew    = crew.filter(c => c.legal_status === 'illegal');
  const nearCrew       = crew.filter(c => c.legal_status === 'near_limit');

  const pendingRelease = releases.filter(r => r.release_status === 'pending');
  const releasedOk     = releases.filter(r => r.release_status === 'released');

  const activeOOS      = oosEntries.filter(o => o.status === 'in_work' || o.status === 'waiting_on_parts');

  // Build pipeline rows per active flight
  const pipeline = activeFlights.map(f => {
    const flightCrew    = crew.filter(c => c.flight_number === f.flight_number);
    const illegalOnFlt  = flightCrew.filter(c => c.legal_status === 'illegal');
    const nearOnFlt     = flightCrew.filter(c => c.legal_status === 'near_limit');
    const release       = releases.find(r => r.flight_number === f.flight_number);
    const oos           = oosEntries.find(o => o.tail_number === f.aircraft_tail && ['in_work', 'waiting_on_parts'].includes(o.status));

    const issues = [];
    if (illegalOnFlt.length > 0)    issues.push({ level: 'critical', msg: `${illegalOnFlt.length} crew VIOLATION` });
    if (nearOnFlt.length > 0)       issues.push({ level: 'warn',     msg: `${nearOnFlt.length} crew near limit` });
    if (!release)                   issues.push({ level: 'warn',     msg: 'No dispatch release' });
    if (release?.release_status === 'pending') issues.push({ level: 'warn', msg: 'Release PENDING' });
    if (oos)                        issues.push({ level: 'critical', msg: `Aircraft OOS: ${oos.work_description}` });
    if (f.delay_minutes > 30)       issues.push({ level: 'warn',     msg: `Delayed +${f.delay_minutes}min` });
    if (flightCrew.length === 0)    issues.push({ level: 'critical', msg: 'No crew assigned' });

    const health = issues.some(i => i.level === 'critical') ? 'critical'
                 : issues.some(i => i.level === 'warn')     ? 'warn'
                 : 'ok';

    return { flight: f, flightCrew, release, oos, issues, health };
  });

  const criticalFlights = pipeline.filter(p => p.health === 'critical').length;
  const warnFlights     = pipeline.filter(p => p.health === 'warn').length;
  const cleanFlights    = pipeline.filter(p => p.health === 'ok').length;

  return (
    <div className="space-y-4">
      {/* Cross-dept summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DeptBadge icon={Plane}   label="Flights"   ok={delayed.length === 0} count={activeFlights.length} detail={`${airborne.length} airborne · ${delayed.length} delayed`} />
        <DeptBadge icon={Users}   label="Crew"      ok={illegalCrew.length === 0} count={crew.length} detail={`${illegalCrew.length} illegal · ${nearCrew.length} near`} />
        <DeptBadge icon={Radio}   label="Dispatch"  ok={pendingRelease.length === 0} count={releases.length} detail={`${releasedOk.length} released · ${pendingRelease.length} pending`} />
        <DeptBadge icon={Wrench}  label="MX / OOS"  ok={activeOOS.length === 0} count={oosEntries.length} detail={`${activeOOS.length} active OOS`} />
      </div>

      {/* Global critical alerts */}
      {(criticalFlights > 0 || illegalCrew.length > 0 || activeOOS.length > 0) && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 space-y-1.5">
          <p className="text-xs font-mono font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> System-Wide Alerts
          </p>
          {illegalCrew.map(c => (
            <PipelineIssue key={c.id} level="critical" msg={`CREW VIOLATION: ${c.crew_name} (${c.role}) on ${c.flight_number || 'unassigned'}`} />
          ))}
          {activeOOS.map(o => (
            <PipelineIssue key={o.id} level="critical" msg={`MX OOS: ${o.tail_number} — ${o.work_description} at ${o.station || '?'}`} />
          ))}
          {delayed.map(f => (
            <PipelineIssue key={f.id} level="warn" msg={`DELAY: ${f.flight_number} +${f.delay_minutes}min — ${f.delay_reason || 'No reason given'}`} />
          ))}
        </div>
      )}

      {/* Per-flight pipeline */}
      <div>
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Flight Pipeline — {activeFlights.length} Active · {criticalFlights} Critical · {warnFlights} Watch · {cleanFlights} Clear
        </p>

        {pipeline.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No active flights today
          </div>
        ) : (
          <div className="space-y-2">
            {[...pipeline].sort((a, b) => {
              const o = { critical: 0, warn: 1, ok: 2 };
              return o[a.health] - o[b.health];
            }).map(({ flight: f, flightCrew, release, oos, issues, health }) => {
              const statusCfg = STATUS_CFG[f.status] || STATUS_CFG.scheduled;
              return (
                <div key={f.id} className={cn(
                  'rounded-xl bg-card border overflow-hidden',
                  health === 'critical' ? 'border-destructive/40' : health === 'warn' ? 'border-orange-500/30' : 'border-green-500/20'
                )}>
                  {/* Flight header */}
                  <div className="px-4 py-3 flex items-center justify-between gap-3 bg-secondary/30">
                    <div className="flex items-center gap-3">
                      {/* Health indicator */}
                      <div className={cn('w-2 h-10 rounded-full flex-shrink-0',
                        health === 'critical' ? 'bg-destructive' : health === 'warn' ? 'bg-orange-400' : 'bg-green-400'
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                          {f.aircraft_tail && <span className="text-xs text-muted-foreground font-mono">{f.aircraft_tail}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.scheduled_departure}Z – {f.scheduled_arrival}Z</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {f.delay_minutes > 0 && (
                        <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full">+{f.delay_minutes}m</span>
                      )}
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusCfg.bg, statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Department status row */}
                  <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Crew */}
                    <div className={cn('rounded-lg px-3 py-2',
                      illegalCrew.some(c => c.flight_number === f.flight_number) ? 'bg-destructive/10' :
                      nearCrew.some(c => c.flight_number === f.flight_number)   ? 'bg-orange-500/10' : 'bg-background/40'
                    )}>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Crew</p>
                      {flightCrew.length === 0
                        ? <p className="text-xs font-bold text-destructive">None assigned</p>
                        : flightCrew.map(c => (
                          <p key={c.id} className={cn('text-xs font-semibold',
                            c.legal_status === 'illegal' ? 'text-destructive' :
                            c.legal_status === 'near_limit' ? 'text-orange-400' : 'text-green-400'
                          )}>
                            {c.crew_name.split(' ').pop()} · {c.role === 'captain' ? 'CPT' : c.role === 'first_officer' ? 'F/O' : c.role === 'flight_attendant' ? 'F/A' : c.role}
                          </p>
                        ))
                      }
                    </div>

                    {/* Dispatch */}
                    <div className={cn('rounded-lg px-3 py-2',
                      !release ? 'bg-orange-500/10' :
                      release.release_status === 'released' ? 'bg-background/40' :
                      release.release_status === 'pending'  ? 'bg-orange-500/10' : 'bg-background/40'
                    )}>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Radio className="w-3 h-3" /> Dispatch</p>
                      {!release
                        ? <p className="text-xs font-bold text-orange-400">No release</p>
                        : <p className={cn('text-xs font-bold',
                            release.release_status === 'released' ? 'text-green-400' :
                            release.release_status === 'cancelled' ? 'text-destructive' : 'text-orange-400'
                          )}>{release.release_status?.toUpperCase()}</p>
                      }
                      {release?.fuel_on_board && (
                        <p className="text-xs text-muted-foreground">{release.fuel_on_board.toLocaleString()} lbs</p>
                      )}
                    </div>

                    {/* MX */}
                    <div className={cn('rounded-lg px-3 py-2', oos ? 'bg-destructive/10' : 'bg-background/40')}>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Wrench className="w-3 h-3" /> Maintenance</p>
                      {oos
                        ? <p className="text-xs font-bold text-destructive">{oos.work_description.slice(0, 24)}…</p>
                        : <p className="text-xs font-bold text-green-400">No OOS</p>
                      }
                    </div>

                    {/* Overall */}
                    <div className={cn('rounded-lg px-3 py-2 flex flex-col justify-between',
                      health === 'critical' ? 'bg-destructive/10' : health === 'warn' ? 'bg-orange-500/10' : 'bg-green-500/10'
                    )}>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {health === 'ok'
                          ? <ShieldCheck className="w-4 h-4 text-green-400" />
                          : <ShieldAlert className={cn('w-4 h-4', health === 'critical' ? 'text-destructive' : 'text-orange-400')} />
                        }
                        <p className={cn('text-xs font-extrabold uppercase',
                          health === 'critical' ? 'text-destructive' : health === 'warn' ? 'text-orange-400' : 'text-green-400'
                        )}>
                          {health === 'critical' ? 'CRITICAL' : health === 'warn' ? 'WATCH' : 'CLEAR'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{issues.length} issue{issues.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Issue list */}
                  {issues.length > 0 && (
                    <div className="px-4 pb-3 space-y-1">
                      {issues.map((issue, i) => (
                        <div key={i} className={cn(
                          'flex items-center gap-2 text-xs rounded-lg px-3 py-1.5',
                          issue.level === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-400'
                        )}>
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          {issue.msg}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}