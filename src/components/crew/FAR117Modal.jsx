import React from 'react';
import { Shield, X, CheckCircle, AlertTriangle, Clock, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAR117_LIMITS = {
  max_fdp: 9,
  min_rest: 10,
  max_flight_time_duty: 8,
  weekly_limit: 60,
  monthly_limit: 190,
  annual_limit: 1000,
};

const ROLE_LABEL = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

function checkCompliance(a) {
  const issues = [];

  const fdp = a.duty_start && a.duty_end
    ? (() => {
        const [sh, sm] = (a.duty_start).split(':').map(Number);
        const [eh, em] = (a.duty_end).split(':').map(Number);
        return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      })()
    : null;

  if (a.rest_hours_prior != null && a.rest_hours_prior < FAR117_LIMITS.min_rest)
    issues.push(`Rest prior to duty: ${a.rest_hours_prior}h — min ${FAR117_LIMITS.min_rest}h required (FAR 117.25)`);
  if (fdp != null && fdp > FAR117_LIMITS.max_fdp)
    issues.push(`FDP ${fdp.toFixed(1)}h exceeds ${FAR117_LIMITS.max_fdp}h max (FAR 117.13)`);
  if (a.total_flight_time_today != null && a.total_flight_time_today > FAR117_LIMITS.max_flight_time_duty)
    issues.push(`Flight time ${a.total_flight_time_today}h exceeds ${FAR117_LIMITS.max_flight_time_duty}h limit (FAR 117.11)`);

  return { issues, fdp };
}

export default function FAR117Modal({ assignments, date, onClose }) {
  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const results = assignments.map(a => ({ ...a, ...checkCompliance(a) }));
  const totalViolations = results.reduce((sum, r) => sum + r.issues.length, 0);
  const allClear = totalViolations === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/60">
          <div className="flex items-center gap-3">
            <Shield className={cn('w-5 h-5', allClear ? 'text-green-400' : 'text-destructive')} />
            <div>
              <p className="text-sm font-extrabold text-foreground">FAR Part 117 Compliance Check</p>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Summary banner */}
        <div className={cn('px-5 py-3 flex items-center gap-3 border-b border-border',
          allClear ? 'bg-green-500/10' : 'bg-destructive/10'
        )}>
          {allClear
            ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />}
          <p className={cn('text-sm font-bold', allClear ? 'text-green-400' : 'text-destructive')}>
            {allClear
              ? `All ${assignments.length} crew member${assignments.length !== 1 ? 's' : ''} comply with FAR Part 117`
              : `${totalViolations} violation${totalViolations > 1 ? 's' : ''} found across ${results.filter(r => r.issues.length > 0).length} crew member${results.filter(r => r.issues.length > 0).length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {assignments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No crew assigned on this date</p>
          ) : (
            results.map(r => (
              <div key={r.id} className={cn('rounded-xl border p-4',
                r.issues.length > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-green-500/20 bg-green-500/5'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.crew_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABEL[r.role] || r.role}
                      {r.flight_number && <span className="ml-1.5 font-mono">{r.flight_number}</span>}
                    </p>
                  </div>
                  {r.issues.length === 0
                    ? <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/15 px-2.5 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Compliant</span>
                    : <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/15 px-2.5 py-1 rounded-full"><AlertTriangle className="w-3 h-3" /> {r.issues.length} Issue{r.issues.length > 1 ? 's' : ''}</span>
                  }
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { label: 'Rest Prior', value: r.rest_hours_prior != null ? `${r.rest_hours_prior}h` : '—', warn: r.rest_hours_prior != null && r.rest_hours_prior < 10, limit: 'Min 10h' },
                    { label: 'FDP', value: r.fdp != null ? `${r.fdp.toFixed(1)}h` : '—', warn: r.fdp != null && r.fdp > 9, limit: 'Max 9h' },
                    { label: 'Flt Time', value: r.total_flight_time_today != null ? `${r.total_flight_time_today}h` : '—', warn: r.total_flight_time_today != null && r.total_flight_time_today > 8, limit: 'Max 8h' },
                  ].map(({ label, value, warn, limit }) => (
                    <div key={label} className={cn('rounded-lg px-2 py-1.5 text-center', warn ? 'bg-destructive/15' : 'bg-background/40')}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={cn('text-sm font-mono font-bold', warn ? 'text-destructive' : 'text-foreground')}>{value}</p>
                      <p className="text-xs text-muted-foreground">{limit}</p>
                    </div>
                  ))}
                </div>

                {/* Violations */}
                {r.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 mt-1">
                    <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{issue}</p>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* FAR 117 quick ref */}
        <div className="border-t border-border px-5 py-3 bg-secondary/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">FAR 117 Quick Reference</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { label: 'Max FDP', value: '9–12h' },
              { label: 'Min Rest', value: '10h' },
              { label: 'Max Flt/Duty', value: '8h' },
              { label: '7-Day', value: '60h' },
              { label: '28-Day', value: '190h' },
              { label: '365-Day', value: '1,000h' },
            ].map(({ label, value }) => (
              <span key={label} className="text-xs text-muted-foreground">
                <span className="text-foreground font-semibold">{label}:</span> {value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}