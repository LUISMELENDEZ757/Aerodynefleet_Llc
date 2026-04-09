import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Clock, AlertTriangle, CheckCircle, Moon, Sun, Coffee, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

const REST_RULES = {
  'short_haul': { max_duty: 9, min_rest: 9, max_flight: 8, name: 'Short-Haul (≤8h flight)' },
  'long_haul': { max_duty: 13, min_rest: 10, max_flight: 12, name: 'Long-Haul (augmented)' },
  'ultra_long': { max_duty: 17, min_rest: 12, max_flight: 17, name: 'Ultra Long (3-pilot)' },
};

const FATIGUE_FACTORS = [
  { key: 'early_start', label: 'Early Start (before 0600 local)', penalty: 1.5 },
  { key: 'late_finish', label: 'Late Finish (after 0200 local)', penalty: 2 },
  { key: 'night_ops', label: 'Night Operations (WOCL crossing)', penalty: 2 },
  { key: 'multi_tz', label: 'Multiple Time Zone Crossings (3+)', penalty: 1 },
  { key: 'consecutive', label: '5+ Consecutive Duty Days', penalty: 1.5 },
];

function RestBar({ label, used, max, color }) {
  const pct = Math.min((used / max) * 100, 100);
  const over = used > max;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className={cn('font-bold', over ? 'text-red-400' : used / max > 0.85 ? 'text-amber-400' : 'text-green-400')}>
          {used.toFixed(1)}h / {max}h {over && '⚠ EXCEEDED'}
        </span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', over ? 'bg-red-500' : used / max > 0.85 ? 'bg-amber-500' : color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function FAR117Calculator() {
  const navigate = useNavigate();
  const [dutyType, setDutyType] = useState('short_haul');
  const [reportTime, setReportTime] = useState('06:00');
  const [flightHours, setFlightHours] = useState(6);
  const [lastRestHours, setLastRestHours] = useState(10);
  const [consecutiveDays, setConsecutiveDays] = useState(3);
  const [fatigueFactors, setFatigueFactors] = useState({});
  const [cumulative28, setCumulative28] = useState(80);
  const [cumulative365, setCumulative365] = useState(900);

  const rules = REST_RULES[dutyType];
  const fatiguePenalty = FATIGUE_FACTORS.filter(f => fatigueFactors[f.key]).reduce((sum, f) => sum + f.penalty, 0);
  const effectiveMaxDuty = Math.max(rules.max_duty - fatiguePenalty, 4);

  const [reportHour] = reportTime.split(':').map(Number);
  const isEarlyStart = reportHour < 6;
  const isNightOps = reportHour >= 22 || reportHour < 4;

  const dutyUsed = flightHours + 1.5; // avg ground time
  const legalStatus = () => {
    if (flightHours > rules.max_flight) return 'illegal_flight';
    if (dutyUsed > effectiveMaxDuty) return 'illegal_duty';
    if (lastRestHours < rules.min_rest) return 'insufficient_rest';
    if (dutyUsed / effectiveMaxDuty > 0.9) return 'near_limit';
    return 'legal';
  };

  const status = legalStatus();
  const STATUS_CFG = {
    legal: { label: 'LEGAL FOR DISPATCH', color: 'text-green-400', bg: 'bg-green-900/30 border-green-500/40', icon: CheckCircle },
    near_limit: { label: 'NEAR DUTY LIMIT — MONITOR', color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-500/40', icon: AlertTriangle },
    illegal_flight: { label: 'ILLEGAL — FLIGHT TIME EXCEEDED', color: 'text-red-400', bg: 'bg-red-900/30 border-red-500/40', icon: AlertTriangle },
    illegal_duty: { label: 'ILLEGAL — DUTY PERIOD EXCEEDED', color: 'text-red-400', bg: 'bg-red-900/30 border-red-500/40', icon: AlertTriangle },
    insufficient_rest: { label: 'ILLEGAL — INSUFFICIENT REST', color: 'text-red-400', bg: 'bg-red-900/30 border-red-500/40', icon: AlertTriangle },
  };
  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.icon;

  const fatigueScore = Math.min(100, Math.round((dutyUsed / effectiveMaxDuty) * 60 + fatiguePenalty * 8 + (consecutiveDays > 4 ? 15 : 0)));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground tracking-wide">FAR 117 REST CALCULATOR</h1>
          <p className="text-xs font-mono text-primary tracking-widest">Crew Legality · Fatigue Risk Management</p>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-5">

        {/* Legal Status Banner */}
        <div className={cn('rounded-2xl border p-4 flex items-center gap-3', cfg.bg)}>
          <StatusIcon className={cn('w-6 h-6 flex-shrink-0', cfg.color)} />
          <div>
            <p className={cn('text-base font-extrabold', cfg.color)}>{cfg.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Effective max duty: <span className="font-bold text-foreground">{effectiveMaxDuty.toFixed(1)}h</span>
              {fatiguePenalty > 0 && <span className="text-amber-400"> (reduced by {fatiguePenalty}h for fatigue factors)</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Duty Parameters</p>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Operation Type</label>
                <select value={dutyType} onChange={e => setDutyType(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                  {Object.entries(REST_RULES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Report Time (Local)</label>
                  <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5">Consecutive Duty Days</label>
                  <input type="number" min={1} max={7} value={consecutiveDays} onChange={e => setConsecutiveDays(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Scheduled Flight Hours: {flightHours}h</label>
                <input type="range" min={0.5} max={18} step={0.5} value={flightHours} onChange={e => setFlightHours(Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Last Rest Period: {lastRestHours}h</label>
                <input type="range" min={4} max={20} step={0.5} value={lastRestHours} onChange={e => setLastRestHours(Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>
            </div>

            {/* Cumulative Limits */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Cumulative Flight Time</p>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">28-Day Hours: {cumulative28}h</label>
                <input type="range" min={0} max={100} value={cumulative28} onChange={e => setCumulative28(Number(e.target.value))}
                  className="w-full accent-primary" />
                <RestBar label="28-Day Limit" used={cumulative28} max={100} color="bg-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">365-Day Hours: {cumulative365}h</label>
                <input type="range" min={0} max={1000} value={cumulative365} onChange={e => setCumulative365(Number(e.target.value))}
                  className="w-full accent-primary" />
                <RestBar label="365-Day Limit" used={cumulative365} max={1000} color="bg-purple-500" />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Fatigue Score */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Fatigue Risk Index</p>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={fatigueScore >= 80 ? '#ef4444' : fatigueScore >= 60 ? '#f59e0b' : '#22c55e'}
                      strokeWidth="3" strokeDasharray={`${fatigueScore} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className={cn('text-xl font-black', fatigueScore >= 80 ? 'text-red-400' : fatigueScore >= 60 ? 'text-amber-400' : 'text-green-400')}>{fatigueScore}</span>
                    <span className="text-[9px] text-gray-500">/ 100</span>
                  </div>
                </div>
                <div>
                  <p className={cn('text-sm font-bold', fatigueScore >= 80 ? 'text-red-400' : fatigueScore >= 60 ? 'text-amber-400' : 'text-green-400')}>
                    {fatigueScore >= 80 ? 'HIGH RISK' : fatigueScore >= 60 ? 'MODERATE RISK' : 'LOW RISK'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">FRMS composite score based on duty, rest, and schedule factors</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <RestBar label="Duty Period" used={dutyUsed} max={effectiveMaxDuty} color="bg-primary" />
                <RestBar label="Flight Time" used={flightHours} max={rules.max_flight} color="bg-blue-500" />
                <RestBar label="Min Rest Required" used={lastRestHours} max={rules.min_rest} color="bg-green-500" />
              </div>
            </div>

            {/* Fatigue Factors */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Fatigue Factors (FAR 117.5)</p>
              {FATIGUE_FACTORS.map(f => (
                <label key={f.key} className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setFatigueFactors(p => ({ ...p, [f.key]: !p[f.key] }))}
                    className={cn('w-10 h-5 rounded-full transition-all flex items-center px-0.5 flex-shrink-0', fatigueFactors[f.key] ? 'bg-primary' : 'bg-white/10')}>
                    <div className={cn('w-4 h-4 rounded-full bg-white transition-all', fatigueFactors[f.key] ? 'translate-x-5' : 'translate-x-0')} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{f.label}</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400">-{f.penalty}h</span>
                </label>
              ))}
            </div>

            {/* Reg Reference */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">FAR 117 Quick Reference</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Max Flight Duty:</span> <span className="font-bold text-white">{rules.max_duty}h</span></div>
                <div><span className="text-gray-500">Min Rest:</span> <span className="font-bold text-white">{rules.min_rest}h</span></div>
                <div><span className="text-gray-500">Max Flight Time:</span> <span className="font-bold text-white">{rules.max_flight}h</span></div>
                <div><span className="text-gray-500">28-Day Limit:</span> <span className="font-bold text-white">100h</span></div>
                <div><span className="text-gray-500">365-Day Limit:</span> <span className="font-bold text-white">1000h</span></div>
                <div><span className="text-gray-500">WOCL:</span> <span className="font-bold text-white">0200–0559</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}