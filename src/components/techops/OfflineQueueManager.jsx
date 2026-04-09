import { AlertTriangle, Wifi, WifiOff, Zap, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function QueueItem({ item, index }) {
  const opLabel = {
    create: '➕',
    update: '✏️',
    delete: '🗑️',
  }[item.operation] || '⚙️';

  return (
    <div className="flex items-start gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
      <span className="text-sm">{opLabel}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">
          {item.operation.toUpperCase()} {item.entity}
        </p>
        <p className="text-[10px] text-gray-500">
          {format(new Date(item.timestamp), 'HH:mm:ss')}
        </p>
      </div>
    </div>
  );
}

export default function OfflineQueueManager({ queue, isOnline, isSyncing, syncError, onSync, onClear, pendingCount }) {
  if (pendingCount === 0) return null;

  const isCritical = pendingCount > 20;
  const isWarning = pendingCount > 10;

  return (
    <div className={cn('fixed bottom-6 right-6 rounded-2xl border shadow-2xl max-w-sm z-50',
      isCritical ? 'bg-red-900/90 border-red-500/60' :
      isWarning ? 'bg-amber-900/90 border-amber-500/60' :
      'bg-blue-900/90 border-blue-500/60'
    )}>
      <div className="px-5 py-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <p className="text-sm font-bold text-white">
              {pendingCount} Pending
            </p>
            {isSyncing && <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            {isOnline && (
              <button onClick={onSync} disabled={isSyncing}
                className="w-7 h-7 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 flex items-center justify-center transition-colors">
                <Zap className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            <button onClick={onClear}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className={cn('px-3 py-2 rounded-lg text-sm font-bold',
          isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        )}>
          {isOnline ? (
            isSyncing ? '⏳ Syncing...' : '✓ Ready to sync'
          ) : (
            '📡 Offline mode — changes will sync when reconnected'
          )}
        </div>

        {/* Error message */}
        {syncError && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{syncError}</p>
          </div>
        )}

        {/* Queue preview */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {queue.slice(0, 5).map((item, idx) => (
            <QueueItem key={item.id} item={item} index={idx} />
          ))}
          {queue.length > 5 && (
            <p className="text-[10px] text-gray-500 text-center py-1">
              +{queue.length - 5} more
            </p>
          )}
        </div>

        {/* Warning for critical queue size */}
        {isCritical && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2">
            <p className="text-xs text-red-300 font-bold">
              ⚠️ Large queue detected. Sync as soon as connection available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}