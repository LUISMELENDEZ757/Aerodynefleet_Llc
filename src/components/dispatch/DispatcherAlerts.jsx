import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DispatcherAlerts({ alerts = [], flights = [] }) {
  const queryClient = useQueryClient();

  const dismissMutation = useMutation({
    mutationFn: (alertId) => base44.entities.OpsAlert.update(alertId, { is_dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dispatch-alerts'] }),
  });

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  const AlertRow = ({ alert }) => {
    const severityConfig = {
      critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
      warning: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
      info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    };
    const cfg = severityConfig[alert.severity] || severityConfig.info;

    return (
      <div className={cn('rounded-xl border px-4 py-3 flex items-start justify-between gap-3', cfg.bg, cfg.border)}>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', cfg.text)}>{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
          {alert.flight_number && (
            <p className="text-xs text-muted-foreground mt-1">Flight: {alert.flight_number}</p>
          )}
        </div>
        <button
          onClick={() => dismissMutation.mutate(alert.id)}
          aria-label={`Dismiss alert: ${alert.title}`}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div>
          <p className="text-xs font-mono font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Critical Alerts ({criticalAlerts.length})
          </p>
          <div className="space-y-2">
            {criticalAlerts.map(alert => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div>
          <p className="text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Warnings ({warningAlerts.length})
          </p>
          <div className="space-y-2">
            {warningAlerts.map(alert => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <div>
          <p className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Information ({infoAlerts.length})
          </p>
          <div className="space-y-2">
            {infoAlerts.map(alert => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-8 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-400">All systems normal</p>
          <p className="text-xs text-muted-foreground">No active alerts</p>
        </div>
      )}
    </div>
  );
}