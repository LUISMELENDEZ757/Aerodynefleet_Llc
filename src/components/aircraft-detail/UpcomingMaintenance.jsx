import { Wrench, Globe, Radio, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UpcomingMaintenance({ workPackages, melItems }) {
  const upcoming = workPackages
    .filter(w => w.status !== 'completed')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 10);

  const etopsCriticalMels = melItems.filter(m => m.etops_critical || m.etops_impact !== 'OK');
  const rvsmCriticalMels = melItems.filter(m => m.flight_restrictions?.includes('RVSM'));

  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-foreground">Upcoming Maintenance</h2>

      {/* Critical MEL Flags */}
      {(etopsCriticalMels.length > 0 || rvsmCriticalMels.length > 0) && (
        <div className="space-y-2">
          {etopsCriticalMels.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-cyan-600/40 bg-cyan-900/10 px-4 py-3">
              <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <p className="text-xs font-bold text-cyan-400">
                {etopsCriticalMels.length} ETOPS-critical MEL{etopsCriticalMels.length > 1 ? 's' : ''} open — ETOPS check required before next ETOPS segment
              </p>
            </div>
          )}
          {rvsmCriticalMels.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-600/40 bg-blue-900/10 px-4 py-3">
              <Radio className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-xs font-bold text-blue-400">
                {rvsmCriticalMels.length} RVSM-critical MEL{rvsmCriticalMels.length > 1 ? 's' : ''} open — RVSM altimetry check required
              </p>
            </div>
          )}
        </div>
      )}

      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-bold text-muted-foreground">No upcoming work packages</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(wp => {
            const daysUntil = Math.ceil((new Date(wp.scheduled_date) - new Date()) / 86400000);
            const isOverdue = daysUntil < 0;
            const isSoon = daysUntil >= 0 && daysUntil <= 7;
            return (
              <div key={wp.id} className={cn(
                'rounded-2xl border bg-card p-4 flex items-start gap-4',
                isOverdue ? 'border-red-500/40 bg-red-900/5' : isSoon ? 'border-amber-500/40' : 'border-border'
              )}>
                <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  isOverdue ? 'bg-red-500' : isSoon ? 'bg-amber-500' : 'bg-green-500'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-extrabold text-foreground">{wp.check_type} Check</p>
                      <p className="text-xs text-muted-foreground">{wp.station || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-xs font-bold', isOverdue ? 'text-red-400' : isSoon ? 'text-amber-400' : 'text-foreground')}>
                        {isOverdue ? `${Math.abs(daysUntil)}d OVERDUE` : `in ${daysUntil}d`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{new Date(wp.scheduled_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded',
                      wp.status === 'in_progress' ? 'bg-blue-900/40 text-blue-400' :
                      wp.status === 'overdue' ? 'bg-red-900/40 text-red-400' :
                      'bg-secondary text-muted-foreground'
                    )}>{wp.status?.toUpperCase() || 'PLANNED'}</span>
                    {wp.estimated_man_hours && <span className="text-[10px] text-muted-foreground">{wp.estimated_man_hours}h est.</span>}
                    {wp.supplier_system && wp.supplier_system !== 'manual' && (
                      <span className="text-[10px] text-cyan-400 font-bold">{wp.supplier_system}</span>
                    )}
                  </div>
                  {wp.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{wp.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}