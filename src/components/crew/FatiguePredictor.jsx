import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Brain, AlertTriangle, CheckCircle, TrendingUp, Clock, Zap } from 'lucide-react';

const ROLE_LABEL = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

// Simplified WOCL-based fatigue model (based on FAA FRMS guidelines)
function calcFatigueScore(member, delayMinutes = 0) {
  let score = 0; // 0-100, higher = more fatigued

  // Rest deficit
  const rest = member.rest_hours_prior ?? 10;
  if (rest < 10) score += (10 - rest) * 8;

  // Duty time
  if (member.duty_start && member.duty_end) {
    const [sh, sm] = member.duty_start.split(':').map(Number);
    const [eh, em] = member.duty_end.split(':').map(Number);
    const fdp = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    if (fdp > 6) score += (fdp - 6) * 5;

    // Time of day factor (WOCL = Window of Circadian Low, 02:00–06:00Z)
    if (sh >= 2 && sh <= 6) score += 20;
    if (eh >= 2 && eh <= 6) score += 10;
  }

  // Flight time today
  const ft = member.total_flight_time_today ?? 0;
  if (ft > 4) score += (ft - 4) * 6;

  // Delay impact
  score += (delayMinutes / 60) * 8;

  return Math.min(100, Math.round(score));
}

function fatigueLevel(score) {
  if (score >= 70) return { label: 'HIGH RISK',  color: 'text-destructive', bg: 'bg-destructive/15', bar: 'bg-destructive' };
  if (score >= 40) return { label: 'MODERATE',   color: 'text-orange-400',  bg: 'bg-orange-500/15', bar: 'bg-orange-400' };
  return               { label: 'LOW RISK',   color: 'text-green-400',   bg: 'bg-green-500/15',  bar: 'bg-green-400' };
}

function willGoIllegalMidFlight(member, delayMinutes = 0) {
  if (!member.duty_start || !member.duty_end) return null;
  const [sh, sm] = member.duty_start.split(':').map(Number);
  const [eh, em] = member.duty_end.split(':').map(Number);
  const maxFDP = ((eh * 60 + em) - (sh * 60 + sm));
  const now = new Date();
  const elapsedMin = Math.max(0, now.getHours() * 60 + now.getMinutes() - (sh * 60 + sm));
  const remainMin = maxFDP - elapsedMin - delayMinutes;
  return remainMin < 90 && remainMin > 0 ? remainMin : null;
}

export default function FatiguePredictor({ crew, flights }) {
  const [delayMin, setDelayMin] = useState(0);
  const [selectedFlight, setSelectedFlight] = useState('');

  const flightCrew = selectedFlight
    ? crew.filter(c => c.flight_number === selectedFlight)
    : crew;

  const results = useMemo(() => flightCrew.map(m => {
    const score = calcFatigueScore(m, delayMin);
    const level = fatigueLevel(score);
    const timeoutRisk = willGoIllegalMidFlight(m, delayMin);
    return { ...m, score, level, timeoutRisk };
  }).sort((a, b) => b.score - a.score), [flightCrew, delayMin]);

  const highRisk = results.filter(r => r.score >= 70).length;
  const timeoutRisks = results.filter(r => r.timeoutRisk != null).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" /> Fatigue Prediction Inputs
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Simulate Delay (minutes)</label>
            <input type="number" min={0} max={480} value={delayMin}
              onChange={e => setDelayMin(Number(e.target.value) || 0)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-xs text-muted-foreground mt-1">Tie to delay module to auto-populate</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Filter by Flight</label>
            <select value={selectedFlight} onChange={e => setSelectedFlight(e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">All Crew</option>
              {flights.map(f => <option key={f.id} value={f.flight_number}>{f.flight_number} ({f.origin}→{f.destination})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      {(highRisk > 0 || timeoutRisks > 0) && (
        <div className="space-y-2">
          {highRisk > 0 && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm font-bold text-destructive">{highRisk} crew member{highRisk > 1 ? 's' : ''} at HIGH fatigue risk{delayMin > 0 ? ` with ${delayMin}min delay` : ''}</p>
            </div>
          )}
          {timeoutRisks > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-sm font-bold text-orange-400">{timeoutRisks} crew member{timeoutRisks > 1 ? 's' : ''} predicted to time out before flight completion</p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No crew data available
        </div>
      ) : (
        <div className="space-y-2">
          {results.map(r => (
            <div key={r.id} className={cn('rounded-xl bg-card border overflow-hidden', r.score >= 70 ? 'border-destructive/30' : r.score >= 40 ? 'border-orange-500/20' : 'border-green-500/20')}>
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{r.crew_name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[r.role] || r.role}{r.flight_number && ` · ${r.flight_number}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={cn('text-sm font-extrabold font-mono', r.level.color)}>{r.score}</p>
                    <p className="text-xs text-muted-foreground">/ 100</p>
                  </div>
                  <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', r.level.bg, r.level.color)}>{r.level.label}</span>
                </div>
              </div>
              <div className="px-4 pb-3 space-y-2">
                {/* Fatigue bar */}
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', r.level.bar)} style={{ width: `${r.score}%` }} />
                </div>
                {/* Predictions */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {r.timeoutRisk != null && (
                    <span className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-semibold">
                      <AlertTriangle className="w-3 h-3" /> Timeout risk in ~{r.timeoutRisk}min
                    </span>
                  )}
                  {delayMin > 0 && r.score >= 40 && (
                    <span className="flex items-center gap-1 bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                      <TrendingUp className="w-3 h-3" /> +{delayMin}min delay increases fatigue risk
                    </span>
                  )}
                  {r.rest_hours_prior != null && r.rest_hours_prior < 10 && (
                    <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-semibold">
                      Rest deficit: {r.rest_hours_prior}h prior
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">⚠ Fatigue scores are indicative based on FAA FRMS guidelines. Not a substitute for FRMS tool or medical assessment.</p>
    </div>
  );
}