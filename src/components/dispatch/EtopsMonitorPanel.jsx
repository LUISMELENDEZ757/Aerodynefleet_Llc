import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Zap, MapPin, Clock, CheckCircle, AlertTriangle,
  Navigation2, Plane, ChevronDown, ChevronRight, Shield
} from 'lucide-react';

const ETOPS_MINUTES = [60, 90, 120, 138, 180, 207];

function EtopsFlightCard({ release, flight }) {
  const [expanded, setExpanded] = useState(false);
  const etops = release?.etops_section || {};
  const approved = etops.etops_approved;
  const mins = etops.etops_min;
  const alternates = etops.suitable_alternates || [];

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      approved ? 'border-blue-500/30 bg-blue-900/10' : 'border-orange-500/30 bg-orange-900/10'
    )}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            approved ? 'bg-blue-500/20' : 'bg-orange-500/20'
          )}>
            <Zap className={cn('w-4 h-4', approved ? 'text-blue-400' : 'text-orange-400')} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-mono font-bold text-foreground">{flight?.flight_number || '—'}</p>
              {mins && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  ETOPS-{mins}
                </span>
              )}
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                approved ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
              )}>
                {approved ? '✓ APPROVED' : 'PENDING'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {flight?.origin} → {flight?.destination}
              {flight?.aircraft_tail ? ` · ${flight.aircraft_tail}` : ''}
              {flight?.aircraft_type ? ` (${flight.aircraft_type})` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{alternates.length} alt{alternates.length !== 1 ? 's' : ''}</span>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-4">
          {/* ETOPS key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Certification</p>
              <p className="text-sm font-mono font-bold text-blue-400">{mins ? `ETOPS-${mins}` : '—'}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Max Divert Time</p>
              <p className="text-sm font-mono font-bold text-foreground">{mins ? `${mins} min` : '—'}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Release Status</p>
              <p className={cn('text-sm font-mono font-bold',
                release?.release_status === 'released' ? 'text-green-400' : 'text-orange-400'
              )}>
                {release?.release_status?.toUpperCase() || '—'}
              </p>
            </div>
          </div>

          {/* Suitable alternates */}
          {alternates.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Suitable ETOPS Alternates
              </p>
              <div className="flex flex-wrap gap-2">
                {alternates.map((alt, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-500/20 rounded-lg px-3 py-1.5">
                    <Navigation2 className="w-3 h-3 text-blue-400" />
                    <span className="text-xs font-mono font-bold text-blue-300">{alt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route info */}
          {(release?.route || release?.cruise_altitude) && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Route / Altitude</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {release?.cruise_altitude && (
                  <div className="bg-background/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">Cruise Altitude</p>
                    <p className="text-sm font-mono font-bold text-foreground">{release.cruise_altitude}</p>
                  </div>
                )}
                {release?.alternate && (
                  <div className="bg-background/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">Dest. Alternate</p>
                    <p className="text-sm font-mono font-bold text-foreground">{release.alternate}</p>
                  </div>
                )}
              </div>
              {release?.route && (
                <div className="bg-background/40 rounded-lg px-3 py-2 mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Filed Route</p>
                  <p className="text-xs font-mono text-foreground break-all leading-relaxed">{release.route}</p>
                </div>
              )}
            </div>
          )}

          {/* MEL & restrictions */}
          {release?.mel_cdl_section?.restrictions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> ETOPS Restrictions
              </p>
              <div className="space-y-1">
                {release.mel_cdl_section.restrictions.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 bg-orange-900/20 border border-orange-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-300">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remarks */}
          {release?.remarks && (
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">Remarks</p>
              <p className="text-xs text-foreground">{release.remarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EtopsMonitorPanel({ releases = [], flights = [] }) {
  const [filterMins, setFilterMins] = useState(null);

  // Find releases that have ETOPS section enabled
  const etopsReleases = releases.filter(r => r.etops_section?.is_etops === true);

  // Match to flights
  const etopsFlights = etopsReleases
    .map(release => ({
      release,
      flight: flights.find(f => f.flight_number === release.flight_number),
    }))
    .filter(({ flight }) => !!flight)
    .filter(({ release }) => filterMins == null || release.etops_section?.etops_min === filterMins);

  // Counts
  const approvedCount = etopsReleases.filter(r => r.etops_section?.etops_approved).length;
  const pendingCount = etopsReleases.length - approvedCount;
  const totalAlternates = new Set(
    etopsReleases.flatMap(r => r.etops_section?.suitable_alternates || [])
  ).size;

  // Group by ETOPS cert level
  const minsInUse = [...new Set(etopsReleases.map(r => r.etops_section?.etops_min).filter(Boolean))].sort((a, b) => a - b);

  return (
    <div className="space-y-5">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ETOPS Flights', value: etopsReleases.length, color: 'text-blue-400', icon: Zap },
          { label: 'Approved',      value: approvedCount,        color: 'text-green-400', icon: CheckCircle },
          { label: 'Pending',       value: pendingCount,         color: pendingCount > 0 ? 'text-orange-400' : 'text-muted-foreground', icon: Clock },
          { label: 'Unique Alts',   value: totalAlternates,      color: 'text-cyan-400',  icon: MapPin },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
            <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
            <div>
              <p className={cn('text-lg font-extrabold font-mono', color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ETOPS cert filter chips */}
      {minsInUse.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMins(null)}
            className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-lg transition-all border',
              filterMins === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          {minsInUse.map(m => (
            <button
              key={m}
              onClick={() => setFilterMins(filterMins === m ? null : m)}
              className={cn(
                'text-xs font-bold px-3 py-1.5 rounded-lg transition-all border',
                filterMins === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              ETOPS-{m}
            </button>
          ))}
        </div>
      )}

      {/* Approval summary banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-orange-900/20 border border-orange-500/30 text-sm font-semibold text-orange-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {pendingCount} ETOPS release{pendingCount > 1 ? 's' : ''} pending approval — review required before departure
        </div>
      )}
      {pendingCount === 0 && approvedCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-green-900/20 border border-green-500/30 text-sm font-semibold text-green-400">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          All ETOPS releases approved — alternates verified
        </div>
      )}

      {/* Flight cards */}
      {etopsFlights.length === 0 && etopsReleases.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-14 text-center space-y-2">
          <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-semibold text-muted-foreground">No ETOPS flights in today's dispatch releases</p>
          <p className="text-xs text-muted-foreground/60">ETOPS flights appear here when a release has ETOPS enabled</p>
        </div>
      ) : etopsFlights.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No flights matching selected filter
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            ETOPS Flights — {etopsFlights.length} active
          </p>
          {etopsFlights.map(({ release, flight }) => (
            <EtopsFlightCard key={release.id} release={release} flight={flight} />
          ))}
        </div>
      )}

      {/* ETOPS reference guide */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-400" /> ETOPS Certification Reference
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { cert: 'ETOPS-60',  req: 'No ETOPS req.',     color: 'text-gray-400' },
            { cert: 'ETOPS-90',  req: 'Basic ETOPS',       color: 'text-blue-400' },
            { cert: 'ETOPS-120', req: 'Standard ETOPS',    color: 'text-blue-400' },
            { cert: 'ETOPS-138', req: 'Extended basic',    color: 'text-cyan-400' },
            { cert: 'ETOPS-180', req: 'Extended ops',      color: 'text-cyan-400' },
            { cert: 'ETOPS-207', req: 'Ultra long range',  color: 'text-violet-400' },
          ].map(({ cert, req, color }) => (
            <div key={cert} className="bg-background/40 rounded-lg px-3 py-2">
              <p className={cn('text-xs font-mono font-bold', color)}>{cert}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{req}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}