import { useState, useEffect } from 'react';
import { HardDriveDownload, CloudOff, CloudUpload, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { offlineStore } from '@/lib/offline-store';

export default function LocalModeToggle() {
  const [localMode, setLocalModeState] = useState(() => offlineStore.getLocalMode());
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Refresh queue count periodically
  useEffect(() => {
    const update = () => setQueueCount(offlineStore.getQueue().length);
    update();
    const t = setInterval(update, 2000);
    return () => clearInterval(t);
  }, []);

  const toggle = () => {
    const next = !localMode;
    offlineStore.setLocalMode(next);
    setLocalModeState(next);
    setQueueCount(offlineStore.getQueue().length);

    // When turning off, trigger sync via online event simulation
    if (!next && navigator.onLine) {
      setSyncing(true);
      window.dispatchEvent(new Event('online'));
      setTimeout(() => setSyncing(false), 3000);
    }
  };

  return (
    <button
      onClick={toggle}
      title={localMode ? `Local Mode ON — ${queueCount} changes queued. Click to sync.` : 'Click to enable Local Mode (offline work)'}
      className={cn(
        'flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[10px] font-extrabold tracking-wide transition-all',
        localMode
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
      )}
    >
      {syncing ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : localMode ? (
        <CloudOff className="w-3.5 h-3.5" />
      ) : (
        <HardDriveDownload className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">
        {syncing ? 'Syncing…' : localMode ? `Local${queueCount > 0 ? ` (${queueCount})` : ''}` : 'Local Mode'}
      </span>
      {localMode && queueCount > 0 && (
        <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
          {queueCount > 9 ? '9+' : queueCount}
        </span>
      )}
    </button>
  );
}