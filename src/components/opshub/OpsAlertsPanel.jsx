import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Zap, Cloud, Users, Globe, ArrowRight, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ALERT_TYPE_CFG = {
  mx:           { icon: Zap,           color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-500/30'    },
  irops:        { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
  weather:      { icon: Cloud,         color: 'text-cyan-400',   bg: 'bg-cyan-900/20',   border: 'border-cyan-500/30'   },
  crew_legality:{ icon: Users,         color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30' },
  dispatch:     { icon: Globe,         color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-500/30'   },
  flight_status:{ icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-900/20',  border: 'border-amber-500/30'  },
  fuel:         { icon: Zap,           color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30' },
  system:       { icon: Bell,          color: 'text-gray-400',   bg: 'bg-gray-900/20',   border: 'border-gray-500/20'   },
};

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export default function OpsAlertsPanel({ alerts }) {
  const qc = useQueryClient();

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.OpsAlert.update(id, { is_dismissed: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opshub-alerts'] }),
  });

  const active = useMemo(() =>
    alerts
      .filter(a => !a.is_dismissed)
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2))
      .slice(0, 8),
    [alerts]
  );

  const critical = alerts.filter(a => !a.is_dismissed && a.severity === 'critical').length;
  const warnings = alerts.filter(a => !a.is_dismissed && a.severity === 'warning').length;

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-extrabold text-white tracking-wide">ALERTS</p>
          {critical > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500 text-white">{critical}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          {critical > 0 && <span className="text-red-400 font-bold">{critical} CRITICAL</span>}
          {warnings > 0 && <span className="text-amber-400">{warnings} WARN</span>}
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
        {active.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-7 h-7 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600">No active alerts</p>
          </div>
        ) : (
          active.map(alert => {
            const typeCfg = ALERT_TYPE_CFG[alert.alert_type] || ALERT_TYPE_CFG.system;
            const Icon = typeCfg.icon;
            const isRed = alert.severity === 'critical';
            return (
              <div key={alert.id} className={cn('flex items-start gap-3 px-4 py-3 border-l-2 hover:bg-white/5 transition-colors', typeCfg.border)}>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', typeCfg.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', typeCfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn('text-[10px] font-extrabold uppercase', isRed ? 'text-red-400' : typeCfg.color)}>
                      {alert.severity}
                    </span>
                    {alert.flight_number && <span className="text-[10px] font-mono text-gray-500">{alert.flight_number}</span>}
                    {alert.aircraft_tail && <span className="text-[10px] font-mono text-gray-500">{alert.aircraft_tail}</span>}
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug">{alert.title}</p>
                  {alert.message && <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed truncate">{alert.message}</p>}
                </div>
                <button
                  onClick={() => dismissMutation.mutate(alert.id)}
                  className="text-[10px] text-gray-600 hover:text-gray-400 flex-shrink-0 mt-1"
                  title="Dismiss"
                >✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}