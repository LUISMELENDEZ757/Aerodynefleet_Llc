import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle, Clock, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MaintenanceAlertsWidget() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['maintenance-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ alert_type: 'mx' }, '-created_date', 20),
    refetchInterval: 300000, // 5 minutes
  });

  const critical = alerts.filter(a => a.severity === 'critical');
  const warning = alerts.filter(a => a.severity === 'warning');

  const handleDismiss = async (alertId) => {
    await base44.entities.OpsAlert.update(alertId, { is_dismissed: true });
    queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
  };

  const activeSummary = [
    { label: 'Critical', count: critical.length, color: 'text-red-400' },
    { label: 'Warning', count: warning.length, color: 'text-amber-400' },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Maintenance Alerts</p>
        </div>
        <div className="flex items-center gap-3">
          {activeSummary.map(({ label, count, color }) => (
            <div key={label} className="text-xs">
              <span className={cn('font-bold', color)}>{count}</span>
              <span className="text-muted-foreground ml-1">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-4">Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-xs text-green-400 font-bold">All aircraft within maintenance intervals</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {alerts.filter(a => !a.is_dismissed).map(alert => (
            <div
              key={alert.id}
              className={cn(
                'rounded-lg border p-3 flex items-start gap-3',
                alert.severity === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {alert.severity === 'critical' ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-bold leading-tight',
                  alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                )}>
                  {alert.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}