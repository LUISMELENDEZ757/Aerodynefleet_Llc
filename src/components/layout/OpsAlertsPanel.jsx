import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, AlertTriangle, Info, Zap, CheckCircle, ChevronRight, Radio, Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCommSystemBridge } from '@/hooks/useCommSystemBridge';

const SEV = {
  info:     { icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  warning:  { icon: AlertTriangle, color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  critical: { icon: Zap,           color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
};

export default function OpsAlertsPanel() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { commStatus, sendAlert } = useCommSystemBridge();

  const { data: alerts = [] } = useQuery({
    queryKey: ['ops-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: 15000,
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.OpsAlert.update(id, { is_dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops-alerts'] }),
  });

  // Track sent alert IDs to avoid duplicate broadcasts
  const sentAlertIdsRef = React.useRef(new Set());
  useEffect(() => {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.is_read && !sentAlertIdsRef.current.has(a.id));
    if (criticalAlerts.length === 0) return;
    criticalAlerts.forEach(alert => {
      sentAlertIdsRef.current.add(alert.id);
      sendAlert({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        flight_number: alert.flight_number,
        target_roles: alert.target_roles,
        channels: ['acars', 'broadcast'],
        timestamp: new Date().toISOString(),
      });
    });
  }, [alerts, sendAlert]);

  const unread = alerts.filter(a => !a.is_read).length;
  const critical = alerts.filter(a => a.severity === 'critical').length;

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(true)}
        className={cn("relative w-10 h-10 rounded-xl bg-secondary flex items-center justify-center transition-colors", unread > 0 ? "text-muted-foreground hover:text-foreground" : "text-primary hover:text-primary/80")}
        aria-label="Operational alerts"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className={cn(
            'absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white',
            critical > 0 ? 'bg-destructive' : 'bg-primary'
          )}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-[71] w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <p className="text-sm font-extrabold text-foreground">Ops Alerts</p>
                  {unread > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{unread} new</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {commStatus && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className={cn('w-2 h-2 rounded-full', commStatus.connected ? 'bg-green-400' : 'bg-orange-400')} />
                      <span className="text-muted-foreground">{commStatus.type === 'starlink' ? <Satellite className="w-3 h-3" /> : <Radio className="w-3 h-3" />}</span>
                    </div>
                  )}
                  <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Alert list */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                    <p className="text-sm font-semibold">All clear — no active alerts</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {alerts.map(alert => {
                      const cfg = SEV[alert.severity] || SEV.info;
                      const Icon = cfg.icon;
                      return (
                        <div key={alert.id} className={cn('rounded-xl border p-3', cfg.bg, cfg.border)}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cfg.color)} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground">{alert.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                                {alert.flight_number && (
                                  <p className="text-xs font-mono text-primary mt-1">{alert.flight_number}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {alert.created_date ? new Date(alert.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => dismissMutation.mutate(alert.id)}
                              className="w-6 h-6 rounded-full bg-background/60 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {alert.action_url && (
                            <button
                              onClick={() => { navigate(alert.action_url); setOpen(false); }}
                              className={cn('mt-2 flex items-center gap-1 text-xs font-semibold', cfg.color)}
                            >
                              View details <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}