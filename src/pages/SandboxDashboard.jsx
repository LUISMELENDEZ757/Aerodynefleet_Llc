import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSimulation } from '@/lib/SimulationContext';
import { NAV_GROUPS } from '@/lib/navGroups';
import { cn } from '@/lib/utils';
import {
  FlaskConical, Play, Square, RotateCcw, Activity, CheckCircle2,
  Wrench, AlertTriangle, Clock, Gauge, ChevronRight, ListChecks,
} from 'lucide-react';

const STATUS_META = {
  pending:  { label: 'Pending',  color: 'text-white/40',  bg: 'bg-white/5',   dot: 'bg-white/30' },
  ok:       { label: 'OK',       color: 'text-green-400', bg: 'bg-green-500/10', dot: 'bg-green-400' },
  repair:   { label: 'Repair',   color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
};

function StatusDot({ status, active }) {
  if (active) return <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping flex-shrink-0" />;
  const meta = STATUS_META[status] || STATUS_META.pending;
  return <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', meta.dot)} />;
}

export default function SandboxDashboard() {
  const sim = useSimulation();

  const grouped = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.map((i) => ({
          ...i,
          status: sim.statuses[i.path]?.status || 'pending',
          issues: sim.statuses[i.path]?.issues,
          active: sim.currentPath === i.path,
        })),
      })),
    [sim.statuses, sim.currentPath]
  );

  const log = useMemo(() => [...sim.log].reverse(), [sim.log]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">SANDBOX DASHBOARD</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">
                System Simulation · functional test & repair runner
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sim.isRunning ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/10 border border-primary/30 px-2.5 py-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                RUNNING
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-lg">
                <Clock className="w-3 h-3" /> IDLE
              </span>
            )}
            <Link
              to="/Settings"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              Admin Controls
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KpiCard icon={ListChecks} label="Dashboards" value={sim.total} color="text-primary" bg="bg-primary/15" />
          <KpiCard icon={Activity} label="Tested" value={sim.tested} color="text-white" bg="bg-white/10" />
          <KpiCard icon={CheckCircle2} label="OK" value={sim.okCount} color="text-green-400" bg="bg-green-500/15" />
          <KpiCard icon={Wrench} label="Needs Repair" value={sim.repairCount} color="text-amber-400" bg="bg-amber-500/15" />
          <KpiCard icon={Gauge} label="Progress" value={`${sim.progress}%`} color="text-primary" bg="bg-primary/15" />
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center flex-wrap gap-3">
            <button
              onClick={sim.start}
              disabled={sim.isRunning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Play className="w-4 h-4" /> Start Run
            </button>
            <button
              onClick={sim.stop}
              disabled={!sim.isRunning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-extrabold disabled:opacity-50 hover:bg-secondary/80 transition-colors"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
            <button
              onClick={sim.reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-extrabold hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Speed</span>
              <input
                type="range"
                min={400}
                max={4000}
                step={200}
                value={sim.speed}
                onChange={(e) => sim.setSpeed(Number(e.target.value))}
                className="accent-primary w-40"
              />
              <span className="text-xs font-mono text-primary tabular-nums">{(sim.speed / 1000).toFixed(1)}s</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${sim.progress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
            {sim.tested}/{sim.total} tested · {sim.okCount} ok · {sim.repairCount} flagged for repair
          </p>
        </div>

        {/* Active operand */}
        {sim.isRunning && sim.currentPath && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Now operating</span>
            <span className="font-mono text-sm text-foreground">{sim.currentPath}</span>
            <span className="ml-auto text-[11px] text-muted-foreground">
              Left-rail link should be glowing
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Test matrix */}
          <div className="lg:col-span-2 space-y-4">
            {grouped.map((g) => (
              <div key={g.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-secondary/40">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">
                    {g.title || 'Core'}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {g.items.map((i) => {
                    const meta = STATUS_META[i.status] || STATUS_META.pending;
                    return (
                      <div
                        key={i.path}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 transition-colors',
                          i.active && 'bg-primary/10'
                        )}
                      >
                        <StatusDot status={i.status} active={i.active} />
                        <span className="text-base w-5 text-center flex-shrink-0">{i.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground truncate">{i.label}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">{i.path}</p>
                          {i.status === 'repair' && i.issues && (
                            <p className="text-[11px] text-amber-400 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {i.issues}
                            </p>
                          )}
                        </div>
                        <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0', meta.bg, meta.color)}>
                          {meta.label}
                        </span>
                        {i.status === 'repair' && (
                          <button
                            onClick={() => sim.repair(i.path)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-[11px] font-bold hover:bg-amber-500/30 transition-colors flex-shrink-0"
                          >
                            <Wrench className="w-3 h-3" /> Repair
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Live log */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col max-h-[600px]">
            <div className="px-4 py-2.5 border-b border-border bg-secondary/40 flex items-center justify-between">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">Event Log</p>
              <span className="text-[10px] text-muted-foreground font-mono">{log.length}</span>
            </div>
            <div className="overflow-y-auto scrollbar-hide divide-y divide-border/40">
              {log.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Start a run to populate the event log.
                </div>
              )}
              {log.map((e, i) => (
                <div key={i} className="px-4 py-2 flex items-center gap-2 text-xs">
                  <StatusDot status={e.status} active={false} />
                  <span className="text-muted-foreground font-mono flex-shrink-0">
                    {new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="text-foreground font-bold truncate flex-1">{e.label}</span>
                  {e.repaired && <Wrench className="w-3 h-3 text-green-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-extrabold tabular-nums', color)}>{value}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
      </div>
    </div>
  );
}