import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WifiIndicator() {
  const [showDetails, setShowDetails] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor system network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const statusBg = isOnline ? 'bg-green-500/20' : 'bg-destructive/20';
  const statusColor = isOnline ? 'text-green-400' : 'text-destructive';
  const Icon = isOnline ? Wifi : WifiOff;

  return (
    <>
      <button
        onClick={() => setShowDetails(!showDetails)}
        aria-label={`Network status: ${isOnline ? 'online' : 'offline'}`}
        className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1', statusBg)}
        title={`Network: ${isOnline ? 'Online' : 'Offline'}`}
      >
        <Icon className={cn('w-5 h-5', statusColor)} />
      </button>

      {showDetails && (
        <div className="absolute top-12 right-0 z-[70] bg-card border border-border rounded-xl shadow-lg p-4 w-72 text-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Icon className={cn('w-4 h-4', statusColor)} />
              Network Status
            </p>
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', 
              isOnline ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'
            )}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={cn('font-bold', statusColor)}>
                {isOnline ? '✓ Online' : '✗ Offline'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {isOnline ? 'System is connected to the network.' : 'No network connection detected.'}
            </p>
          </div>

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