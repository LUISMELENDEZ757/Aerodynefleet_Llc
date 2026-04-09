import { useState, useMemo } from 'react';
import { TrendingUp, RefreshCw, ChevronDown, AlertTriangle, CheckCircle, Clock, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Scoring helpers ─────────────────────────────────────────────────────────

function computeRouteStats(flights, origin, destination) {
  const route = flights.filter(
    f => f.origin === origin && f.destination === destination
  );
  if (route.length === 0) return null;
  const delayed = route.filter(f => (f.delay_minutes || 0) >= 15);
  const avgDelay = delayed.length > 0
    ? delayed.reduce((s, f) => s + (f.delay_minutes || 0), 0) / delayed.length
    : 0;
  return {
    total: route.length,
    delayed: delayed.length,
    rate: delayed.length / route.length,
    avgDelay: Math.round(avgDelay),
  };
}

function computeTypeStats(flights, aircraft, aircraftType) {
  const tails = aircraft.filter(a => a.aircraft_type === aircraftType).map(a => a.tail_number);
  const typed = flights.filter(f => tails.includes(f.aircraft_tail));
  if (typed.length === 0) return null;
  const delayed = typed.filter(f => (f.delay_minutes || 0) >= 15);
  return {
    total: typed.length,
    delayed: delayed.length,
    rate: delayed.length / typed.length,
  };
}

function probabilityScore(routeStats, typeStats, flight) {
  let score = 0;
  const factors = [];

  // Route history factor (weight 40)
  if (routeStats) {
    const pts = Math.round(routeStats.rate * 40);
    score += pts;
    if (routeStats.rate > 0.4)
      factors.push({ label: `Route delayed ${Math.round(routeStats.rate * 100)}% historically`, severity: 'high' });
    else if (routeStats.rate > 0.2)
      factors.push({ label: `Route delayed ${Math.round(routeStats.rate * 100)}% historically`, severity: 'medium' });
  }

  // Aircraft type factor (weight 25)
  if (typeStats) {
    const pts = Math.round(typeStats.rate * 25);
    score += pts;
    if (typeStats.rate > 0.35)
      factors.push({ label: `${flight.aircraft_type} type has elevated delay rate`, severity: 'medium' });
  }

  // Existing delay propagation (weight 20)
  if ((flight.delay_minutes || 0) >= 30) {
    score += 20;
    factors.push({ label: `Already delayed ${flight.delay_minutes} min — propagation likely`, severity: 'high' });
  } else if ((flight.delay_minutes || 0) >= 15) {
    score += 10;
    factors.push({ label: `${flight.delay_minutes} min current delay`, severity: 'medium' });
  }

  // Status factor (weight 15)
  if (flight.status === 'delayed') { score += 15; }
  else if (flight.status === 'scheduled') { score += 0; }
  else if (flight.status === 'boarding') { score -= 5; }

  // Average historical delay magnitude (bonus up to 10)
  if (routeStats?.avgDelay > 45) {
    score += 10;
    factors.push({ label: `Avg route delay ${routeStats.avgDelay} min when delayed`, severity: 'medium' });
  }

  return { score: Math.min(Math.max(score, 0), 100), factors };
}

function scoreConfig(score) {
  if (score >= 70) return { label: 'HIGH', color: 'text-red-400', ring: 'stroke-red-500', bg: 'bg-red-500/10 border-red-500/30' };
  if (score >= 40) return { label: 'MEDIUM', color: 'text-amber-400', ring: 'stroke-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' };
  return { label: 'LOW', color: 'text-green-400', ring: 'stroke-green-500', bg: 'bg-green-500/10 border-green-500/30' };
}

// ── Gauge ────────────────────────────────────────────────────────────────────
function ScoreGauge({ score }) {
  const cfg = scoreConfig(score);
  const r = 28, circ = 2 * Math.PI * r;
  // Half-circle: starts at left (180°), sweep to right (0°) = top half
  const dash = (score / 100) * (circ / 2);
  return (
    <div className="relative flex items-center justify-center w-20 h-12 flex-shrink-0">
      <svg width="80" height="48" viewBox="0 0 80 48">
        <path d="M 8 44 A 32 32 0 0 1 72 44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round"/>
        <path d="M 8 44 A 32 32 0 0 1 72 44" fill="none"
          className={cfg.ring}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 100.5} 100.5`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className={cn('text-base font-black leading-none', cfg.color)}>{score}</p>
        <p className="text-[8px] text-gray-600 leading-none">/ 100</p>
      </div>
    </div>
  );
}

// ── Flight Row ───────────────────────────────────────────────────────────────
function FlightRow({ flight, routeStats, typeStats }) {
  const [open, setOpen] = useState(false);
  const { score, factors } = probabilityScore(routeStats, typeStats, flight);
  const cfg = scoreConfig(score);

  return (
    <div className={cn('rounded-xl border transition-all', cfg.bg)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <ScoreGauge score={score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-extrabold text-white font-mono">{flight.flight_number}</span>
            <span className="text-[10px] text-gray-500">{flight.origin}→{flight.destination}</span>
            {flight.aircraft_type && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{flight.aircraft_type}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-[10px] font-extrabold uppercase', cfg.color)}>{cfg.label} DELAY RISK</span>
            {(flight.delay_minutes || 0) > 0 && (
              <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />{flight.delay_minutes}m delay
              </span>
            )}
          </div>
          {routeStats && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              Route history: {routeStats.delayed}/{routeStats.total} flights delayed
            </p>
          )}
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && factors.length > 0 && (
        <div className="px-3 pb-3 space-y-1 border-t border-white/5 pt-2">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">Contributing Factors</p>
          {factors.map((f, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertTriangle className={cn('w-2.5 h-2.5 flex-shrink-0 mt-0.5',
                f.severity === 'high' ? 'text-red-400' : 'text-amber-400')} />
              <p className="text-[10px] text-gray-400">{f.label}</p>
            </div>
          ))}
          {factors.length === 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-2.5 h-2.5 text-green-400" />
              <p className="text-[10px] text-gray-400">No significant delay factors detected</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function DelayProbabilityWidget({ flights, aircraft }) {
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'departure'

  const today = new Date().toISOString().split('T')[0];
  const historical = flights.filter(f => f.flight_date < today);
  const upcoming = flights.filter(f =>
    f.flight_date >= today &&
    !['arrived', 'landed', 'cancelled'].includes(f.status)
  ).slice(0, 20);

  const scored = useMemo(() => {
    return upcoming.map(f => {
      const routeStats = computeRouteStats(historical, f.origin, f.destination);
      const typeStats = computeTypeStats(historical, aircraft, f.aircraft_type);
      const { score } = probabilityScore(routeStats, typeStats, f);
      return { flight: f, routeStats, typeStats, score };
    });
  }, [upcoming, historical, aircraft]);

  const sorted = [...scored].sort((a, b) =>
    sortBy === 'score' ? b.score - a.score : a.flight.scheduled_departure?.localeCompare(b.flight.scheduled_departure || '') || 0
  );

  const highRisk = scored.filter(s => s.score >= 70).length;
  const medRisk  = scored.filter(s => s.score >= 40 && s.score < 70).length;

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-extrabold text-white tracking-wide">DELAY PROBABILITY</p>
          <span className="text-[10px] text-gray-500 font-mono">route + type analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {highRisk > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
              {highRisk} high risk
            </span>
          )}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-[#0d1117] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-400 outline-none"
          >
            <option value="score">Sort: Risk</option>
            <option value="departure">Sort: Departure</option>
          </select>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/10">
        {[
          { label: 'Upcoming Flt', value: upcoming.length, color: 'text-white' },
          { label: 'High Risk',    value: highRisk,        color: highRisk  > 0 ? 'text-red-400'   : 'text-gray-500' },
          { label: 'Medium Risk',  value: medRisk,         color: medRisk   > 0 ? 'text-amber-400' : 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="py-2 px-3 text-center">
            <p className={cn('text-lg font-black', color)}>{value}</p>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      {/* Flight list */}
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Plane className="w-8 h-8 text-gray-700" />
            <p className="text-xs text-gray-500">No upcoming flights to analyze</p>
          </div>
        ) : sorted.map(({ flight, routeStats, typeStats }) => (
          <FlightRow key={flight.id} flight={flight} routeStats={routeStats} typeStats={typeStats} />
        ))}
      </div>

      <div className="px-3 pb-2 pt-1 border-t border-white/5">
        <p className="text-[9px] text-gray-700">Score 0–100 based on route history, aircraft type, and current status. Click a row to see factors.</p>
      </div>
    </div>
  );
}