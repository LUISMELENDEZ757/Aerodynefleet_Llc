import React from 'react';
import { CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const FlightProgressTimeline = ({ flight, currentPhase = 'enroute' }) => {
  // Parse route waypoints from flight.route string
  const parseWaypoints = (routeString) => {
    if (!routeString) return [];
    const waypoints = routeString.split(/\s+/).filter(w => w.length > 0);
    return waypoints.map((waypoint, idx) => ({
      id: idx,
      name: waypoint,
      type: 'waypoint',
      status: idx === 0 ? 'current' : idx < 2 ? 'completed' : 'pending',
      eta: null,
      ata: idx < 2 ? new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
    }));
  };

  // Create timeline with departure, waypoints, ETOPS points, and arrival
  const buildTimeline = () => {
    const timeline = [
      {
        id: 'dep',
        name: flight.origin,
        type: 'departure',
        status: 'completed',
        eta: flight.depTime,
        ata: new Date(Date.now() - 45 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        label: 'Departure',
      },
    ];

    // Add ETOPS entry if applicable
    if (flight.natTrackPoints?.entry) {
      timeline.push({
        id: 'etops-entry',
        name: flight.natTrackPoints.entry,
        type: 'etops-entry',
        status: 'pending',
        eta: new Date(Date.now() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        label: 'ETOPS Entry',
      });
    }

    // Add route waypoints
    const waypoints = parseWaypoints(flight.route);
    timeline.push(...waypoints.slice(0, 4)); // Limit to first 4 waypoints for clarity

    // Add ETOPS exit if applicable
    if (flight.natTrackPoints?.exit) {
      timeline.push({
        id: 'etops-exit',
        name: flight.natTrackPoints.exit,
        type: 'etops-exit',
        status: 'pending',
        eta: new Date(Date.now() + 120 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        label: 'ETOPS Exit',
      });
    }

    // Add arrival
    timeline.push({
      id: 'arr',
      name: flight.destination,
      type: 'arrival',
      status: 'pending',
      eta: flight.scheduled_arrival || '15:45Z',
      label: 'Arrival',
    });

    return timeline;
  };

  const timeline = buildTimeline();

  const getStatusConfig = (status) => {
    const config = {
      completed: {
        icon: CheckCircle,
        color: 'text-green-400',
        bg: 'bg-green-500/15',
        border: 'border-green-500/30',
      },
      current: {
        icon: AlertTriangle,
        color: 'text-amber-400',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
      },
      pending: {
        icon: Clock,
        color: 'text-slate-400',
        bg: 'bg-slate-500/15',
        border: 'border-slate-500/30',
      },
    };
    return config[status] || config.pending;
  };

  const getTypeIcon = (type) => {
    if (type.includes('etops')) return Zap;
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 mb-3">
          Flight Progress Timeline
        </h3>
        <p className="text-[10px] text-slate-500 mb-4">
          Route: {flight.origin} → {flight.destination} · Cruise FL{flight.cruiseAlt || '350'}
        </p>
      </div>

      {/* Timeline visualization */}
      <div className="relative space-y-3">
        {timeline.map((point, idx) => {
          const cfg = getStatusConfig(point.status);
          const StatusIcon = cfg.icon;
          const TypeIcon = getTypeIcon(point.type);

          return (
            <div key={point.id}>
              {/* Connector line to next point */}
              {idx < timeline.length - 1 && (
                <div
                  className={cn(
                    'absolute left-5 top-10 w-0.5 h-12',
                    point.status === 'completed' ? 'bg-green-500/50' : 'bg-slate-600/30'
                  )}
                />
              )}

              {/* Timeline point */}
              <div className="relative flex gap-3">
                {/* Icon circle */}
                <div className={cn('relative z-10 flex flex-shrink-0 h-10 w-10 items-center justify-center rounded-full border', cfg.border, cfg.bg)}>
                  <StatusIcon className={cn('w-5 h-5', cfg.color)} />
                  {TypeIcon && (
                    <TypeIcon className="absolute w-3 h-3 text-amber-400 -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">
                        {point.label || point.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {point.name}
                        {point.type.includes('etops') && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                            ETOPS {point.type === 'etops-entry' ? 'ENTRY' : 'EXIT'}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      {point.ata ? (
                        <>
                          <div className="text-amber-300 font-semibold">{point.ata}</div>
                          <div className="text-[9px] text-slate-500">Actual</div>
                        </>
                      ) : (
                        <>
                          <div className="text-slate-300 font-semibold">{point.eta}</div>
                          <div className="text-[9px] text-slate-500">ETA</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded', cfg.bg, cfg.color)}>
                      {point.status === 'completed' ? '✓ Passed' : point.status === 'current' ? '◉ Current' : '○ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary info */}
      <div className="border-t border-slate-800 pt-3 mt-4 space-y-2">
        {flight.maxDiversionTime && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Max Diversion Time:</span>
            <span className="font-bold text-slate-200">{flight.maxDiversionTime}</span>
          </div>
        )}
        {flight.driftDownTerrain && (
          <div className="flex items-start justify-between text-[10px] gap-2">
            <span className="text-slate-400">Drift-Down Constraint:</span>
            <span className="font-bold text-slate-200 text-right">{flight.driftDownTerrain}</span>
          </div>
        )}
        {flight.etopsAlternates && flight.etopsAlternates.length > 0 && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">ETOPS Alternates:</span>
            <span className="font-bold text-emerald-300">{flight.etopsAlternates.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightProgressTimeline;