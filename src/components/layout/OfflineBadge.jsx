import { useState, useEffect } from 'react';
import { WifiOff, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import useOfflineSync from '@/hooks/useOfflineSync';

export default function OfflineBadge() {
  const { isOnline, syncInProgress } = useOfflineSync();
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    setShowBadge(!isOnline);
  }, [isOnline]);

  if (showBadge && !isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
        <WifiOff className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-semibold text-orange-400">Offline</span>
        {syncInProgress && <Loader className="w-3 h-3 text-orange-400 animate-spin" />}
      </div>
    );
  }

  return null;
}