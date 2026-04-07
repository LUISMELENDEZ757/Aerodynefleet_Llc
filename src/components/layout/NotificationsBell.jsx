import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, BellOff, AlertCircle, AlertTriangle, Info, X, CheckCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY = {
  critical: { icon: Zap,           color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    badge: 'bg-red-500' },
  warning:  { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  badge: 'bg-amber-500' },
  info:     { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   badge: 'bg-blue-500' },
};

const TYPE_LABEL = {
  flight_status: 'Flight',
  crew_legality:  'Crew',
  weather:        'Weather',
  mx:             'Maintenance',
  fuel:           'Fuel',
  irops:          'IROPS',
  dispatch:       'Dispatch',
  system:         'System',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const qc = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['notifications-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: 15000,
  });

  const dismissOne = useMutation({
    mutationFn: (id) => base44.entities.OpsAlert.update(id, { is_dismissed: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications-alerts'] }),
  });

  const dismissAll = useMutation({
    mutationFn: async () => {
      await Promise.all(alerts.map(a => base44.entities.OpsAlert.update(a.id, { is_dismissed: true })));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-alerts'] });
      setOpen(false);
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const hasUnread = unreadCount > 0;

  const bellColor = criticalCount > 0 ? 'text-red-400' : hasUnread ? 'text-amber-400' : 'text-gray-500';
  const bellBg    = criticalCount > 0 ? 'bg-red-500/15' : hasUnread ? 'bg-amber-500/15' : 'bg-white/5';

  // Sort: critical first, then warning, then info
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`${unreadCount} notifications`}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 relative',
          bellBg
        )}
      >
        {hasUnread
          ? <Bell className={cn('w-5 h-5', bellColor, criticalCount > 0 && 'animate-[wiggle_1s_ease-in-out_infinite]')} />
          : <BellOff className="w-5 h-5 text-gray-500" />
        }
        {hasUnread && (
          <span className={cn(
            'absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-black flex items-center justify-center px-1',
            criticalCount > 0 ? 'bg-red-500' : 'bg-amber-500'
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-[100] w-96 bg-[#141922] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <p className="text-sm font-extrabold text-white tracking-wide">Notifications</p>
              {hasUnread && (
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full text-white',
                  criticalCount > 0 ? 'bg-red-500' : 'bg-amber-500'
                )}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  onClick={() => dismissAll.mutate()}
                  disabled={dismissAll.isPending}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Dismiss all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Alert list */}
          <div className="overflow-y-auto flex-1 divide-y divide-white/5">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <BellOff className="w-8 h-8 text-gray-600" />
                <p className="text-xs text-gray-500">All clear — no active notifications</p>
              </div>
            ) : (
              sorted.map(alert => {
                const cfg = SEVERITY[alert.severity] || SEVERITY.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={alert.id}
                    className={cn('flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5', cfg.bg)}
                  >
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg, cfg.border, 'border')}>
                      <Icon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn('text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded', cfg.bg, cfg.color)}>
                          {alert.severity?.toUpperCase()}
                        </span>
                        {alert.alert_type && (
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest">
                            {TYPE_LABEL[alert.alert_type] || alert.alert_type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white leading-snug">{alert.title}</p>
                      {alert.message && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {alert.flight_number && (
                          <span className="text-[10px] font-mono text-primary">FLT {alert.flight_number}</span>
                        )}
                        {alert.aircraft_tail && (
                          <span className="text-[10px] font-mono text-cyan-400">{alert.aircraft_tail}</span>
                        )}
                        <span className="text-[10px] text-gray-600 ml-auto">{timeAgo(alert.created_date)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissOne.mutate(alert.id)}
                      className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 flex-shrink-0 mt-0.5 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {sorted.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2 flex-shrink-0">
              <p className="text-[10px] text-gray-600 text-center">
                {criticalCount > 0 && <span className="text-red-400 font-bold">{criticalCount} critical · </span>}
                {alerts.filter(a => a.severity === 'warning').length > 0 && (
                  <span className="text-amber-400 font-bold">{alerts.filter(a => a.severity === 'warning').length} warning · </span>
                )}
                {alerts.filter(a => a.severity === 'info').length} info
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}