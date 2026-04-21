import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, TrendingDown, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  'En Route': { icon: Plane, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  'Landed': { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
  'Delayed': { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  'Cancelled': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  'Scheduled': { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  'Boarding': { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

export default function FlightStatusTracker({ flight, previousStatus }) {
  const [alert, setAlert] = useState(null);
  const alertTimeoutRef = useRef(null);

  // Trigger alert for significant status changes
  useEffect(() => {
    const significantChanges = [
      { from: 'Scheduled', to: 'Delayed' },
      { from: 'En Route', to: 'Cancelled' },
      { from: 'Delayed', to: 'Landed' },
      { from: 'En Route', to: 'Landed' },
    ];

    if (previousStatus && previousStatus !== flight.status) {
      const isSignificant = significantChanges.some(
        change => previousStatus === change.from && flight.status === change.to
      );

      if (isSignificant) {
        setAlert({
          message: `${flight.flight_number}: Status changed to ${flight.status}`,
          type: flight.status === 'Cancelled' ? 'critical' : 'info',
        });

        // Trigger audio alert for critical changes
        if (flight.status === 'Cancelled' || flight.status === 'Delayed') {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = flight.status === 'Cancelled' ? 800 : 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          } catch (e) {
            // Audio context not available, silently fail
          }
        }

        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => setAlert(null), 5000);
      }
    }

    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [flight.status, previousStatus, flight.flight_number]);

  const config = STATUS_CONFIG[flight.status] || STATUS_CONFIG.Scheduled;
  const Icon = config.icon;

  const getTimeDisplay = () => {
    if (flight.status === 'Landed') {
      return flight.actual_arrival ? new Date(flight.actual_arrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
    }
    if (flight.status === 'En Route') {
      return flight.estimated_arrival ? new Date(flight.estimated_arrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
    }
    return flight.scheduled_departure ? new Date(flight.scheduled_departure).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
  };

  return (
    <div className="space-y-2">
      {alert && (
        <div className={cn(
          'p-3 rounded-lg text-xs font-bold animate-pulse',
          alert.type === 'critical'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        )}>
          {alert.message}
        </div>
      )}
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', config.bg)}>
        <Icon className={cn('w-4 h-4', config.color)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-bold', config.color)}>{flight.status}</p>
          <p className="text-[10px] text-muted-foreground">{getTimeDisplay()}</p>
        </div>
      </div>
    </div>
  );
}

import { Plane, Users } from 'lucide-react';