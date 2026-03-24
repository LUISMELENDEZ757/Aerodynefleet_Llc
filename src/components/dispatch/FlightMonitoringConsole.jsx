import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Activity, TrendingDown, Clock, AlertTriangle, Cloud, Signal,
  Navigation2, Fuel, Users, ChevronDown, ChevronRight
} from 'lucide-react';

const PHASE_COLORS = {
  scheduled: 'text-muted-foreground',
  pushback: 'text-yellow-400',
  taxi: 'text-yellow-400',
  takeoff: 'text-blue-400',
  initial_climb: 'text-blue-400',
  cruise: 'text-green-400',
  descent: 'text-yellow-400',
  approach: 'text-yellow-400',
  landing: 'text-blue-400',
  landed: 'text-green-400',
  diverted: 'text-orange-400',
  cancelled: 'text-destructive',
};

function FlightMonitorCard({ monitoring, flight, release, onExpand, expanded }) {
  const phase = monitoring?.flight_phase || 'scheduled';
  const phaseColor = PHASE_COLORS[phase] || 'text-muted-foreground';

  const fuelStatus = monitoring?.fuel_monitoring?.low_fuel_alert ? 'text-destructive' : 'text-foreground';
  const connStatus = monitoring?.connectivity_status?.acars_latency_minutes
    ? monitoring.connectivity_status.acars_latency_minutes > 5
      ? 'text-orange-400'
      : 'text-green-400'
    : 'text-muted-foreground';

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden mb-2">
      <button
        onClick={() => onExpand(flight.flight_number)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Activity className={cn('w-4 h-4', phaseColor)} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-mono font-bold text-foreground">{flight?.flight_number || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {flight?.origin} → {flight?.destination}
              {flight?.aircraft_tail ? ` · ${flight.aircraft_tail}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className={cn('text-xs font-mono font-semibold', phaseColor)}>{phase.toUpperCase()}</p>
            {monitoring?.estimated_arrival && (
              <p className="text-xs text-muted-foreground">ETA {monitoring.estimated_arrival}</p>
            )}
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 bg-secondary/10 p-4 space-y-3">
          {/* Position & Performance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {monitoring?.position?.altitude_ft != null && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Altitude</p>
                <p className="text-sm font-mono font-bold text-foreground">{monitoring.position.altitude_ft.toLocaleString()} ft</p>
              </div>
            )}
            {monitoring?.position?.ground_speed != null && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Ground Speed</p>
                <p className="text-sm font-mono font-bold text-foreground">{monitoring.position.ground_speed} kt</p>
              </div>
            )}
            {monitoring?.fuel_monitoring?.fuel_on_board != null && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Fuel Remaining</p>
                <p className={cn('text-sm font-mono font-bold', fuelStatus)}>{monitoring.fuel_monitoring.fuel_on_board.toLocaleString()} lbs</p>
              </div>
            )}
            {monitoring?.fuel_monitoring?.fuel_remaining_minutes != null && (
              <div className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Fuel Time</p>
                <p className="text-sm font-mono font-bold text-foreground">{monitoring.fuel_monitoring.fuel_remaining_minutes} min</p>
              </div>
            )}
          </div>

          {/* Fuel Variance & Connectivity */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {monitoring?.fuel_monitoring?.fuel_variance != null && (
              <div className="bg-background/40 rounded-lg px-3 py-2 flex items-center gap-2">
                <Fuel className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p className="text-sm font-mono font-bold text-foreground">{monitoring.fuel_monitoring.fuel_variance > 0 ? '+' : ''}{monitoring.fuel_monitoring.fuel_variance.toFixed(1)}%</p>
                </div>
              </div>
            )}
            {monitoring?.connectivity_status?.acars_latency_minutes != null && (
              <div className="bg-background/40 rounded-lg px-3 py-2 flex items-center gap-2">
                <Signal className={cn('w-3.5 h-3.5 flex-shrink-0', connStatus)} />
                <div>
                  <p className="text-xs text-muted-foreground">ACARS</p>
                  <p className={cn('text-sm font-mono font-bold', connStatus)}>{monitoring.connectivity_status.acars_latency_minutes}m ago</p>
                </div>
              </div>
            )}
          </div>

          {/* Alerts */}
          {monitoring?.alerts && monitoring.alerts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Active Alerts
              </p>
              <div className="space-y-1">
                {monitoring.alerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className={cn(
                    'text-xs rounded-lg px-2 py-1.5',
                    alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                    alert.severity === 'warning' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-blue-500/10 text-blue-400'
                  )}>
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Release status */}
          {release && (
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Release Status</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-foreground">{release.release_status?.toUpperCase()}</span>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  release.release_status === 'released' ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'
                )}>
                  {release.dispatcher_name ? `By ${release.dispatcher_name}` : 'Pending'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FlightMonitoringConsole({ monitoring = [], flights = [], releases = [] }) {
  const [expandedFlights, setExpandedFlights] = useState({});

  const toggleExpand = (flightNumber) => {
    setExpandedFlights(prev => ({
      ...prev,
      [flightNumber]: !prev[flightNumber]
    }));
  };

  if (flights.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No flights scheduled for today
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Real-Time Flight Tracking
      </p>
      {flights.map(flight => {
        const monitor = monitoring.find(m => m.flight_number === flight.flight_number);
        const release = releases.find(r => r.flight_number === flight.flight_number);
        return (
          <FlightMonitorCard
            key={flight.id}
            monitoring={monitor}
            flight={flight}
            release={release}
            onExpand={toggleExpand}
            expanded={expandedFlights[flight.flight_number]}
          />
        );
      })}
    </div>
  );
}