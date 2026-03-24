import { Plane, Wrench, Radio, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  scheduled: { label: 'Scheduled', color: 'text-muted-foreground', bg: 'bg-muted' },
  boarding:  { label: 'Boarding',  color: 'text-primary',          bg: 'bg-primary/15' },
  departed:  { label: 'Departed',  color: 'text-blue-400',         bg: 'bg-blue-500/15' },
  airborne:  { label: 'Airborne',  color: 'text-green-400',        bg: 'bg-green-500/15' },
  arrived:   { label: 'Arrived',   color: 'text-green-400',        bg: 'bg-green-500/15' },
  cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
  delayed:   { label: 'Delayed',   color: 'text-orange-400',       bg: 'bg-orange-500/15' },
};

const OOS_COLOR = {
  in_work:          'text-orange-400 bg-orange-500/15',
  waiting_on_parts: 'text-destructive bg-destructive/15',
  released:         'text-green-400 bg-green-500/15',
  deferred:         'text-muted-foreground bg-muted',
};

export default function RecoveryDashboard({ flights, oos }) {
  return (
    <div className="space-y-4">
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
          : flights.slice(0, 10).map(f => {
              const cfg = STATUS_CFG[f.status] || STATUS_CFG.scheduled;
              return (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                  <Plane className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                    <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.aircraft_tail || '—'}{f.gate ? ` · Gate ${f.gate}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
                    {f.delay_minutes > 0 && <p className="text-xs text-orange-400 mt-0.5">+{f.delay_minutes}m</p>}
                  </div>
                </div>
              );
            })
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
          : oos.slice(0, 6).map(o => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                <Wrench className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{o.tail_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.work_description}</p>
                </div>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', OOS_COLOR[o.status] || 'text-muted-foreground bg-muted')}>
                  {o.status?.replace(/_/g, ' ')}
                </span>
              </div>
            ))
        }
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Flight Ops',   sub: 'Dashboard',      path: '/Dashboard',   color: 'border-primary/30 text-primary' },
          { label: 'Crew Control', sub: 'FAR 117 · AI',   path: '/CrewControl', color: 'border-red-500/30 text-red-400' },
          { label: 'EFB',          sub: 'Flight Bag',      path: '/EFB',         color: 'border-yellow-500/30 text-yellow-400' },
          { label: 'Safety & QA',  sub: 'ASAP · Reports', path: '/SafetyQA',    color: 'border-orange-500/30 text-orange-400' },
          { label: 'Weather',      sub: 'METAR · SIGMET', path: '/Weather',     color: 'border-cyan-500/30 text-cyan-400' },
          { label: 'Logbook',      sub: 'Flight Log',      path: '/Logbook',     color: 'border-emerald-500/30 text-emerald-400' },
        ].map(({ label, sub, path, color }) => {
          const [border, text] = color.split(' ');
          return (
            <Link key={path} to={path} className={cn('rounded-xl border bg-card px-4 py-3 hover:bg-secondary/40 transition-colors', border)}>
              <p className={cn('text-sm font-bold', text)}>{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}