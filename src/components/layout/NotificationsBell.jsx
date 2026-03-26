import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsBell() {
  const [showDetails, setShowDetails] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ['notifications-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: false,
  });

  const unreadCount = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const hasUnread = unreadCount > 0;

  const statusColor = criticalCount > 0 ? 'text-red-400' : hasUnread ? 'text-amber-400' : 'text-gray-400';
  const statusBg = criticalCount > 0 ? 'bg-red-500/20' : hasUnread ? 'bg-amber-500/20' : 'bg-gray-500/20';

  return (
    <>
      <button
        onClick={() => setShowDetails(!showDetails)}
        aria-label={`Notifications: ${unreadCount} unread, ${criticalCount} critical`}
        className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 relative', statusBg)}
        title={`${unreadCount} notifications`}
      >
        {hasUnread ? (
          <Bell className={cn('w-5 h-5', statusColor)} />
        ) : (
          <BellOff className={cn('w-5 h-5', statusColor)} />
        )}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDetails && (
        <div className="absolute top-12 right-0 z-[70] bg-card border border-border rounded-xl shadow-lg p-4 w-80 text-sm space-y-2 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </p>
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', 
              hasUnread ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
            )}>
              {unreadCount} unread
            </span>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No active notifications</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 8).map(alert => (
                <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                  <AlertCircle className={cn('w-4 h-4 flex-shrink-0 mt-0.5',
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{alert.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{alert.message}</p>
                    {alert.flight_number && (
                      <p className="text-[10px] text-primary mt-0.5">FLT {alert.flight_number}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowDetails(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1 rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}