import { useState } from 'react';
import { Users, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrewLegality } from '../hooks/useCrewLegality';

const ROLE_LABEL = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

const STATUS_CFG = {
  legal:      { label: 'Legal',      color: 'text-green-400',   bg: 'bg-green-500/15',   icon: CheckCircle },
  near_limit: { label: 'Near Limit', color: 'text-orange-400',  bg: 'bg-orange-500/15',  icon: AlertTriangle },
  illegal:    { label: 'ILLEGAL',    color: 'text-destructive', bg: 'bg-destructive/15', icon: AlertTriangle },
};

function CrewCard({ member }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[member.derivedStatus] || STATUS_CFG.legal;
  const Icon = cfg.icon;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{member.crew_name}</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABEL[member.role] || member.role}
            {member.flight_number ? ` · ${member.flight_number}` : ''}
            {member.duty_start ? ` · ${member.duty_start}–${member.duty_end || '?'}` : ''}
          </p>
        </div>
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1', cfg.bg, cfg.color)}>
          <Icon className="w-3 h-3" />{cfg.label}
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Flight Time Today', value: member.total_flight_time_today != null ? `${member.total_flight_time_today}h` : '—' },
              { label: 'Rest Prior',        value: member.rest_hours_prior != null ? `${member.rest_hours_prior}h` : '—' },
              { label: 'Duty Period',       value: member.dutyHours != null ? `${member.dutyHours.toFixed(1)}h` : '—' },
              { label: 'Employee ID',       value: member.employee_id || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-mono font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {member.violations.length > 0 && (
            <div className="space-y-1">
              {member.violations.map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{v}
                </div>
              ))}
            </div>
          )}

          {member.notes && (
            <p className="text-xs text-muted-foreground bg-background/40 rounded-lg px-3 py-2">{member.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CrewLegality({ crew }) {
  const { enriched, illegal, nearLimit, legal, limits } = useCrewLegality(crew);
  const [filter, setFilter] = useState('all');

  const shown = filter === 'all' ? enriched
    : filter === 'illegal' ? illegal
    : filter === 'near' ? nearLimit
    : legal;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Legal',     value: legal.length,     color: 'text-green-400',   key: 'legal' },
          { label: 'Near Limit',value: nearLimit.length, color: 'text-orange-400',  key: 'near' },
          { label: 'Illegal',   value: illegal.length,   color: 'text-destructive', key: 'illegal' },
        ].map(({ label, value, color, key }) => (
          <button
            key={key}
            onClick={() => setFilter(f => f === key ? 'all' : key)}
            className={cn(
              'rounded-xl bg-card border px-3 py-3 text-center transition-all',
              filter === key ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40'
            )}
          >
            <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* FAR 117 reference */}
      <div className="rounded-xl bg-secondary/30 border border-border px-4 py-3 flex items-start gap-2">
        <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">FAR Part 117 — </span>
          Max FDP <span className="text-primary font-semibold">{limits.maxFlightDutyPeriod}h</span> ·
          Max flight time <span className="text-primary font-semibold">{limits.maxFlightTime}h</span> ·
          Min rest <span className="text-primary font-semibold">{limits.minRest}h</span>
        </p>
      </div>

      {/* Crew list */}
      {shown.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No crew in this category
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map(c => <CrewCard key={c.id} member={c} />)}
        </div>
      )}
    </div>
  );
}