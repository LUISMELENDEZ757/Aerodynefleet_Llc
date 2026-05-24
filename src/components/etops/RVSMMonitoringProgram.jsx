import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, AlertTriangle, X, Calendar, FileText, RefreshCw } from 'lucide-react';
import { RVSM_MONITORING_ITEMS } from './RVSMSystemMatrix';
import { differenceInDays, addDays, format, isAfter, isBefore } from 'date-fns';

// ── Simulated per-tail monitoring dates (in a real system, from MaintenanceEvent entity) ──
function getMonitoringDates(tail, item) {
  // Derive a pseudo-deterministic last-done date per tail+item for demo purposes
  const seed = (tail.charCodeAt(0) + tail.charCodeAt(1) + item.id.length) % 400;
  const baseDate = new Date('2023-01-01');
  baseDate.setDate(baseDate.getDate() + seed);
  return baseDate;
}

function getItemStatus(lastDone, intervalDays) {
  const now = new Date();
  const expiry = addDays(lastDone, intervalDays);
  const daysRemaining = differenceInDays(expiry, now);
  if (daysRemaining < 0) return { status: 'expired', daysRemaining, expiry };
  if (daysRemaining < 60) return { status: 'expiring_soon', daysRemaining, expiry };
  if (daysRemaining < 180) return { status: 'watch', daysRemaining, expiry };
  return { status: 'ok', daysRemaining, expiry };
}

const STATUS_CFG = {
  expired:       { text: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',    label: 'EXPIRED',      icon: X },
  expiring_soon: { text: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  label: 'EXP < 60 DAYS', icon: AlertTriangle },
  watch:         { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'WATCH',        icon: Clock },
  ok:            { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  label: 'CURRENT',      icon: CheckCircle },
};

export default function RVSMMonitoringProgram({ aircraft = [] }) {
  const [selectedTail, setSelectedTail] = useState(aircraft[0]?.tail_number || null);
  const selectedAc = aircraft.find(a => a.tail_number === selectedTail);

  // Fleet-wide expiry summary
  const fleetExpiries = [];
  for (const ac of aircraft) {
    for (const item of RVSM_MONITORING_ITEMS) {
      const lastDone = getMonitoringDates(ac.tail_number, item);
      const { status, daysRemaining, expiry } = getItemStatus(lastDone, item.intervalDays);
      if (status === 'expired' || status === 'expiring_soon') {
        fleetExpiries.push({ tail: ac.tail_number, item, status, daysRemaining, expiry });
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Fleet-wide expiry alert */}
      {fleetExpiries.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-900/10 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-extrabold text-amber-400">{fleetExpiries.length} RVSM monitoring item{fleetExpiries.length > 1 ? 's' : ''} require action fleet-wide</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fleetExpiries.slice(0, 8).map((e, i) => (
              <button key={i} onClick={() => setSelectedTail(e.tail)}
                className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all',
                  e.status === 'expired'
                    ? 'border-red-500/60 text-red-400 bg-red-900/20 hover:bg-red-900/40'
                    : 'border-amber-500/50 text-amber-400 bg-amber-900/20 hover:bg-amber-900/40'
                )}>
                {e.tail} · {e.item.label.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
            {fleetExpiries.length > 8 && <span className="text-[9px] text-muted-foreground self-center">+{fleetExpiries.length - 8} more</span>}
          </div>
        </div>
      )}

      {/* Tail selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Tail:</span>
        <div className="flex gap-1.5 flex-wrap">
          {aircraft.slice(0, 20).map(ac => {
            const tailExpiries = fleetExpiries.filter(e => e.tail === ac.tail_number);
            const hasExpired = tailExpiries.some(e => e.status === 'expired');
            const hasSoon = tailExpiries.some(e => e.status === 'expiring_soon');
            return (
              <button
                key={ac.tail_number}
                onClick={() => setSelectedTail(ac.tail_number)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all',
                  selectedTail === ac.tail_number
                    ? 'bg-primary text-primary-foreground border-primary'
                    : hasExpired
                    ? 'bg-red-900/20 border-red-500/40 text-red-400 hover:bg-red-900/40'
                    : hasSoon
                    ? 'bg-amber-900/20 border-amber-500/40 text-amber-400 hover:bg-amber-900/40'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {ac.tail_number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-tail monitoring items */}
      {selectedAc && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-foreground">
            {selectedAc.tail_number} — RVSM Monitoring Program Status
          </p>
          {RVSM_MONITORING_ITEMS.map(item => {
            const lastDone = getMonitoringDates(selectedAc.tail_number, item);
            const { status, daysRemaining, expiry } = getItemStatus(lastDone, item.intervalDays);
            const cfg = STATUS_CFG[status];
            const StatusIcon = cfg.icon;

            return (
              <div key={item.id} className={cn('rounded-xl border px-4 py-3 space-y-2', cfg.border, cfg.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-extrabold text-foreground">{item.label}</p>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1', cfg.text, cfg.border)}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-base font-black font-mono', cfg.text)}>
                      {status === 'expired' ? `${Math.abs(daysRemaining)}d PAST` : `${daysRemaining}d`}
                    </p>
                    <p className="text-[9px] text-muted-foreground">{status === 'expired' ? 'overdue' : 'remaining'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
                    <p className="text-muted-foreground">Last Done</p>
                    <p className="font-bold text-foreground">{format(lastDone, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
                    <p className="text-muted-foreground">Expires</p>
                    <p className={cn('font-bold', cfg.text)}>{format(expiry, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
                    <p className="text-muted-foreground">Interval</p>
                    <p className="font-bold text-foreground">{item.intervalDays >= 365 ? `${item.intervalDays / 365}yr` : `${item.intervalDays}d`}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-muted-foreground">{item.ref}</span>
                  {(status === 'expired' || status === 'expiring_soon') && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold hover:bg-primary/30 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Schedule Renewal
                    </button>
                  )}
                </div>

                {/* Expiry progress bar */}
                {status !== 'expired' && (
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', status === 'ok' ? 'bg-green-500' : status === 'watch' ? 'bg-yellow-500' : 'bg-amber-500')}
                      style={{ width: `${Math.min(100, Math.max(2, (daysRemaining / item.intervalDays) * 100))}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}