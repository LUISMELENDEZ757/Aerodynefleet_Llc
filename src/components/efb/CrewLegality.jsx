import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { User, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

// FAR Part 117 limits
const FAR117 = {
  max_fdp: { 1: 9, 2: 10, 3: 11, 4: 12 },  // crew size -> max FDP (simplified)
  max_flight_duty: 8,       // max flight time in duty period
  rest_required: 10,        // minimum rest before FDP
  weekly_limit: 60,         // 7-day limit
  monthly_limit: 190,       // 28-day limit
  annual_limit: 1000,       // 365-day limit
  rest_after_duty: 10,      // rest required after FDP
};

function LegalCard({ member }) {
  const [expanded, setExpanded] = useState(false);

  const fdp = member.duty_start && member.duty_end
    ? (() => {
        const [sh, sm] = (member.duty_start || '06:00').split(':').map(Number);
        const [eh, em] = (member.duty_end || '18:00').split(':').map(Number);
        return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      })()
    : 0;

  const maxFdp = FAR117.max_fdp[1]; // simplified
  const restOk = (member.rest_hours_prior || 0) >= FAR117.rest_required;
  const fdpOk  = fdp <= maxFdp;
  const ftOk   = (member.total_flight_time_today || 0) <= FAR117.max_flight_duty;

  const violations = [
    !restOk && `Rest prior to duty: ${member.rest_hours_prior || 0}h (min ${FAR117.rest_required}h required)`,
    !fdpOk  && `FDP ${fdp.toFixed(1)}h exceeds ${maxFdp}h max`,
    !ftOk   && `Flight time ${member.total_flight_time_today}h exceeds ${FAR117.max_flight_duty}h limit`,
  ].filter(Boolean);

  const legal = violations.length === 0;
  const nearLimit = legal && (fdp > maxFdp - 1 || (member.rest_hours_prior || 0) < FAR117.rest_required + 2);

  const status = !legal ? 'illegal' : nearLimit ? 'near_limit' : 'legal';
  const statusCfg = {
    legal:      { color: 'text-green-400',   bg: 'bg-green-500/15',   label: 'LEGAL',      icon: CheckCircle },
    near_limit: { color: 'text-orange-400',  bg: 'bg-orange-500/15',  label: 'NEAR LIMIT', icon: AlertTriangle },
    illegal:    { color: 'text-destructive', bg: 'bg-destructive/15', label: 'VIOLATION',  icon: AlertTriangle },
  }[status];

  const Icon = statusCfg.icon;
  const roleLabel = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{member.crew_name}</p>
            <p className="text-xs text-muted-foreground">
              {roleLabel[member.role] || member.role} · {member.flight_number}
              {member.duty_start ? ` · ${member.duty_start}–${member.duty_end}` : ''}
            </p>
          </div>
        </div>
        <span className={cn('flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full', statusCfg.bg, statusCfg.color)}>
          <Icon className="w-3 h-3" /> {statusCfg.label}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3 bg-secondary/10">
          {/* FAR 117 grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Rest Prior', value: `${member.rest_hours_prior || 0}h`, limit: `Min ${FAR117.rest_required}h`, ok: restOk },
              { label: 'FDP', value: `${fdp.toFixed(1)}h`, limit: `Max ${maxFdp}h`, ok: fdpOk },
              { label: 'Flt Time Today', value: `${member.total_flight_time_today || 0}h`, limit: `Max ${FAR117.max_flight_duty}h`, ok: ftOk },
              { label: 'Required Rest', value: `${FAR117.rest_after_duty}h`, limit: 'After FDP', ok: true },
            ].map(({ label, value, limit, ok }) => (
              <div key={label} className={cn('rounded-lg px-3 py-2 bg-background/40', !ok && 'bg-destructive/10 border border-destructive/20')}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-sm font-mono font-bold', ok ? 'text-foreground' : 'text-destructive')}>{value}</p>
                <p className="text-xs text-muted-foreground">{limit}</p>
              </div>
            ))}
          </div>

          {/* Cumulative limits (simulated) */}
          <div className="rounded-lg bg-background/30 px-3 py-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">FAR 117 Cumulative Limits</p>
            {[
              { label: '7-Day Limit', used: Math.round((member.total_flight_time_today || 0) * 5.5), max: FAR117.weekly_limit },
              { label: '28-Day Limit', used: Math.round((member.total_flight_time_today || 0) * 22), max: FAR117.monthly_limit },
              { label: '365-Day Limit', used: Math.round((member.total_flight_time_today || 0) * 280), max: FAR117.annual_limit },
            ].map(({ label, used, max }) => {
              const pct = Math.min(100, (used / max) * 100);
              const warn = pct > 85;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={cn('text-xs font-mono font-bold', warn ? 'text-orange-400' : 'text-foreground')}>{used}h / {max}h</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', warn ? 'bg-orange-400' : 'bg-primary')}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Violations */}
          {violations.length > 0 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-3 space-y-1">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Violations Detected</p>
              {violations.map((v, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{v}</p>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {member.notes && (
            <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2">{member.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CrewLegality() {
  const { data: crew = [], isLoading } = useQuery({
    queryKey: ['efb-crew-legal', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const illegal = crew.filter(c => c.legal_status === 'illegal').length;
  const near = crew.filter(c => c.legal_status === 'near_limit').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Crew', value: crew.length, color: 'text-foreground' },
          { label: 'Near Limit', value: near, color: near > 0 ? 'text-orange-400' : 'text-muted-foreground' },
          { label: 'Violations', value: illegal, color: illegal > 0 ? 'text-destructive' : 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* FAR 117 reference */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">FAR Part 117 Reference</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Max FDP', value: '9–12 hrs', sub: 'Based on crew & schedule' },
            { label: 'Min Rest', value: '10 hrs', sub: 'Before flight duty period' },
            { label: '7-Day Limit', value: '60 hrs', sub: 'Flight time' },
            { label: '365-Day Limit', value: '1,000 hrs', sub: 'Flight time' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-mono font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Crew list */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading crew assignments…</div>
      ) : crew.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No crew assigned for today
        </div>
      ) : (
        <div className="space-y-2">
          {crew.map(m => <LegalCard key={m.id} member={m} />)}
        </div>
      )}
    </div>
  );
}