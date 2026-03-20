import React from 'react';
import { User, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_LABELS = {
  captain: 'CPT',
  first_officer: 'F/O',
  dispatcher: 'DISP',
  flight_attendant: 'F/A',
};

const LEGAL_CONFIG = {
  legal:      { label: 'Legal',      color: 'text-green-400',   bg: 'bg-green-500/15',   icon: CheckCircle },
  near_limit: { label: 'Near Limit', color: 'text-orange-400',  bg: 'bg-orange-500/15',  icon: AlertTriangle },
  illegal:    { label: 'Illegal',    color: 'text-destructive', bg: 'bg-destructive/15', icon: AlertCircle },
};

function CrewRow({ member }) {
  const legal = LEGAL_CONFIG[member.legal_status] || LEGAL_CONFIG.legal;
  const LIcon = legal.icon;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-secondary/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{member.crew_name}</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABELS[member.role] || member.role} · {member.flight_number}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div className="hidden sm:block">
          <p className="text-xs text-muted-foreground">Duty</p>
          <p className="text-xs font-mono text-foreground">
            {member.duty_start || '--:--'} – {member.duty_end || '--:--'}
          </p>
        </div>
        {member.rest_hours_prior != null && (
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">Rest Prior</p>
            <p className="text-xs font-mono text-foreground">{member.rest_hours_prior}h</p>
          </div>
        )}
        <span className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', legal.bg, legal.color)}>
          <LIcon className="w-3 h-3" />
          {legal.label}
        </span>
      </div>
    </div>
  );
}

export default function CrewBoard({ crew, isLoading }) {
  const illegal = crew.filter(c => c.legal_status === 'illegal');
  const nearLimit = crew.filter(c => c.legal_status === 'near_limit');

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Crew Legality</p>
        <div className="flex gap-2">
          {illegal.length > 0 && (
            <span className="text-xs font-bold text-destructive bg-destructive/15 px-2 py-0.5 rounded-full">
              {illegal.length} Illegal
            </span>
          )}
          {nearLimit.length > 0 && (
            <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full">
              {nearLimit.length} Near Limit
            </span>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground text-sm">Loading crew…</div>
      ) : crew.length === 0 ? (
        <div className="flex justify-center py-8 text-muted-foreground text-sm">No crew assignments today</div>
      ) : (
        crew.map(c => <CrewRow key={c.id} member={c} />)
      )}
    </div>
  );
}