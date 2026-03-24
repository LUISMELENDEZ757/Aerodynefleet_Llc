import { Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEGAL_CONFIG = {
  legal: { label: 'Legal', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  near_limit: { label: 'Near Limit', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  illegal: { label: 'ILLEGAL', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

const ROLE_ICONS = {
  captain: '👨‍✈️',
  first_officer: '👨‍✈️',
  flight_attendant: '👩‍💼',
  dispatcher: '📡',
};

function CrewCard({ crew, legal }) {
  const cfg = LEGAL_CONFIG[legal] || LEGAL_CONFIG.legal;

  return (
    <div className={cn('rounded-xl border px-4 py-3 space-y-2', cfg.bg, cfg.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{crew.crew_name}</p>
          <p className="text-xs text-muted-foreground">{crew.role.replace(/_/g, ' ').toUpperCase()}</p>
        </div>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
          {cfg.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {crew.duty_start && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{crew.duty_start}</span>
          </div>
        )}
        {crew.rest_hours_prior != null && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="font-mono">{crew.rest_hours_prior}h rest</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrewLegalityBoard({ crew = [], flights = [] }) {
  const captains = crew.filter(c => c.role === 'captain');
  const firstOfficers = crew.filter(c => c.role === 'first_officer');
  const flightAttendants = crew.filter(c => c.role === 'flight_attendant');

  const illegal = crew.filter(c => c.legal_status === 'illegal').length;
  const nearLimit = crew.filter(c => c.legal_status === 'near_limit').length;
  const legal = crew.filter(c => c.legal_status === 'legal' || !c.legal_status).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className={cn('rounded-xl border px-4 py-3 text-center', 'bg-green-500/10 border-green-500/30')}>
          <p className="text-lg font-extrabold text-green-400">{legal}</p>
          <p className="text-xs text-muted-foreground">Legal</p>
        </div>
        <div className={cn('rounded-xl border px-4 py-3 text-center', nearLimit > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-secondary border-border')}>
          <p className={cn('text-lg font-extrabold', nearLimit > 0 ? 'text-orange-400' : 'text-muted-foreground')}>{nearLimit}</p>
          <p className="text-xs text-muted-foreground">Near Limit</p>
        </div>
        <div className={cn('rounded-xl border px-4 py-3 text-center', illegal > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-secondary border-border')}>
          <p className={cn('text-lg font-extrabold', illegal > 0 ? 'text-destructive' : 'text-muted-foreground')}>{illegal}</p>
          <p className="text-xs text-muted-foreground">Illegal</p>
        </div>
      </div>

      {/* Critical Alert */}
      {illegal > 0 && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">{illegal} crew member{illegal > 1 ? 's' : ''} in violation</p>
            <p className="text-xs text-destructive/80">Immediate action required — do not release flights</p>
          </div>
        </div>
      )}

      {/* Captains */}
      {captains.length > 0 && (
        <div>
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Captains ({captains.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {captains.map(c => (
              <CrewCard key={c.id} crew={c} legal={c.legal_status} />
            ))}
          </div>
        </div>
      )}

      {/* First Officers */}
      {firstOfficers.length > 0 && (
        <div>
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> First Officers ({firstOfficers.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {firstOfficers.map(c => (
              <CrewCard key={c.id} crew={c} legal={c.legal_status} />
            ))}
          </div>
        </div>
      )}

      {/* Flight Attendants */}
      {flightAttendants.length > 0 && (
        <div>
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Flight Attendants ({flightAttendants.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {flightAttendants.map(c => (
              <CrewCard key={c.id} crew={c} legal={c.legal_status} />
            ))}
          </div>
        </div>
      )}

      {crew.length === 0 && (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No crew assignments for today
        </div>
      )}
    </div>
  );
}