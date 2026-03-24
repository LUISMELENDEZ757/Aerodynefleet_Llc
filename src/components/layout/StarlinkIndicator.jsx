import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Satellite, Signal, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarlinkIndicator() {
  const [showDetails, setShowDetails] = useState(false);
  const [terminals, setTerminals] = useState([]);

  const { data: initialTerminals = [], refetch } = useQuery({
    queryKey: ['starlink-terminals-indicator'],
    queryFn: () => base44.entities.StarlinkTerminal.list(),
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Subscribe to real-time terminal updates
  useEffect(() => {
    const unsubscribe = base44.entities.StarlinkTerminal.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        setTerminals(prev => {
          const idx = prev.findIndex(t => t.id === event.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = event.data;
            return updated;
          }
          return [...prev, event.data];
        });
      } else if (event.type === 'delete') {
        setTerminals(prev => prev.filter(t => t.id !== event.id));
      }
    });

    // Set initial data
    if (initialTerminals.length > 0) {
      setTerminals(initialTerminals);
    }

    return unsubscribe;
  }, [initialTerminals]);

  const active = terminals.filter(t => t.activation_status === 'active');
  const primary = active[0] || terminals[0];
  
  const statusColor = primary?.activation_status === 'active' ? 'text-green-400' : 
                      primary?.activation_status === 'suspended' ? 'text-destructive' :
                      'text-muted-foreground';
  const statusBg = primary?.activation_status === 'active' ? 'bg-green-500/20' : 
                   primary?.activation_status === 'suspended' ? 'bg-destructive/20' :
                   'bg-secondary';

  const signalQuality = primary?.signal_quality ?? 0;
  const signalColor = signalQuality > 75 ? 'text-green-400' :
                      signalQuality > 50 ? 'text-yellow-400' :
                      'text-orange-400';

  return (
    <>
      <button
        onClick={() => setShowDetails(!showDetails)}
        aria-label={`Starlink status: ${primary?.activation_status || 'unavailable'}. Signal quality: ${signalQuality}%`}
        className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1', statusBg)}
        title={`${primary?.aircraft_tail || 'Starlink'}: ${primary?.activation_status}`}
      >
        <Satellite className={cn('w-5 h-5', statusColor)} />
      </button>

      {showDetails && primary && (
        <div className="absolute top-12 right-0 z-[70] bg-card border border-border rounded-xl shadow-lg p-4 w-72 text-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-primary" />
              {primary.aircraft_tail}
            </p>
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', 
              primary.activation_status === 'active' ? 'bg-green-500/20 text-green-400' :
              primary.activation_status === 'suspended' ? 'bg-destructive/20 text-destructive' :
              'bg-muted text-muted-foreground'
            )}>
              {primary.activation_status?.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Signal Quality</span>
              <div className="flex items-center gap-2">
                <Signal className={cn('w-3 h-3', signalColor)} />
                <span className={cn('font-mono font-bold', signalColor)}>{signalQuality}%</span>
              </div>
            </div>

            {primary.download_mbps != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Download</span>
                <span className="font-mono text-foreground">{primary.download_mbps.toFixed(1)} Mbps</span>
              </div>
            )}

            {primary.upload_mbps != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Upload</span>
                <span className="font-mono text-foreground">{primary.upload_mbps.toFixed(1)} Mbps</span>
              </div>
            )}

            {primary.latency_ms != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono text-foreground">{primary.latency_ms}ms</span>
              </div>
            )}

            {primary.uptime_percent != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-mono text-foreground">{primary.uptime_percent.toFixed(1)}%</span>
              </div>
            )}

            {primary.satellites_visible != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Satellites</span>
                <span className="font-mono text-foreground">{primary.satellites_visible}</span>
              </div>
            )}

            {primary.obstruction_percent != null && primary.obstruction_percent > 20 && (
              <div className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/15 rounded px-2 py-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{primary.obstruction_percent.toFixed(0)}% obstructed</span>
              </div>
            )}
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