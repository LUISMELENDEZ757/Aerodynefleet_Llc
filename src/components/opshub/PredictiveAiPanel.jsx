import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, TrendingUp, Wrench, Users, AlertTriangle, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const RISK_COLOR = {
  low:      'text-green-400',
  medium:   'text-amber-400',
  high:     'text-orange-400',
  critical: 'text-red-400',
};

const RISK_BG = {
  low:      'bg-green-500/15',
  medium:   'bg-amber-500/15',
  high:     'bg-orange-500/15',
  critical: 'bg-red-500/15',
};

function RiskBadge({ level }) {
  return (
    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase', RISK_BG[level], RISK_COLOR[level])}>
      {level}
    </span>
  );
}

export default function PredictiveAiPanel({ flights, aircraft, crew, melItems }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayFlights = flights.filter(f => f.flight_date === today);
  const delayed      = todayFlights.filter(f => f.status === 'delayed' || (f.delay_minutes || 0) >= 15);
  const oosAircraft  = aircraft.filter(a => a.status === 'oos');
  const illegal      = crew.filter(c => c.legal_status === 'illegal');
  const expiredMel   = melItems.filter(m => m.status === 'expired' || m.status === 'expiring_soon');

  // Quick local heuristic risk scores while AI loads
  const delayRisk    = delayed.length > 3 ? 'critical' : delayed.length > 1 ? 'high' : delayed.length > 0 ? 'medium' : 'low';
  const mxRisk       = oosAircraft.length > 2 ? 'critical' : oosAircraft.length > 0 ? 'high' : expiredMel.length > 0 ? 'medium' : 'low';
  const crewRisk     = illegal.length > 2 ? 'critical' : illegal.length > 0 ? 'high' : 'low';
  const iropsRisk    = (delayed.length + oosAircraft.length) > 4 ? 'high' : (delayed.length + oosAircraft.length) > 2 ? 'medium' : 'low';

  const runAI = async () => {
    setLoading(true);
    setInsights(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an airline operations AI. Analyze this live operational snapshot and provide brief, actionable insights:
- Flights today: ${todayFlights.length} total, ${delayed.length} delayed
- Aircraft: ${aircraft.length} fleet, ${oosAircraft.length} OOS, ${aircraft.filter(a=>a.status==='maintenance').length} in maintenance
- Crew: ${crew.length} assigned today, ${illegal.length} FAR 117 violations, ${crew.filter(c=>c.legal_status==='near_limit').length} near limits
- MEL items: ${melItems.filter(m=>m.status!=='cleared').length} open, ${expiredMel.length} expired/expiring

Respond with JSON: {
  delay_prediction: { risk: "low|medium|high|critical", summary: "brief", actions: ["action1","action2"] },
  maintenance_risk: { risk: "low|medium|high|critical", summary: "brief", actions: ["action1"] },
  crew_fatigue: { risk: "low|medium|high|critical", summary: "brief", actions: ["action1"] },
  irops_recovery: { risk: "low|medium|high|critical", summary: "brief", actions: ["action1","action2"] }
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            delay_prediction:  { type: 'object', properties: { risk: { type: 'string' }, summary: { type: 'string' }, actions: { type: 'array', items: { type: 'string' } } } },
            maintenance_risk:  { type: 'object', properties: { risk: { type: 'string' }, summary: { type: 'string' }, actions: { type: 'array', items: { type: 'string' } } } },
            crew_fatigue:      { type: 'object', properties: { risk: { type: 'string' }, summary: { type: 'string' }, actions: { type: 'array', items: { type: 'string' } } } },
            irops_recovery:    { type: 'object', properties: { risk: { type: 'string' }, summary: { type: 'string' }, actions: { type: 'array', items: { type: 'string' } } } },
          }
        }
      });
      setInsights(res);
    } catch (e) {
      setInsights({ error: e.message });
    }
    setLoading(false);
  };

  const display = insights || {
    delay_prediction: { risk: delayRisk,  summary: `${delayed.length} flights delayed today` },
    maintenance_risk: { risk: mxRisk,     summary: `${oosAircraft.length} AOG, ${expiredMel.length} MEL issues` },
    crew_fatigue:     { risk: crewRisk,   summary: `${illegal.length} FAR 117 violations` },
    irops_recovery:   { risk: iropsRisk,  summary: `${(delayed.length + oosAircraft.length)} disruptions detected` },
  };

  const cards = [
    { key: 'delay_prediction', label: 'Delay Prediction',   icon: TrendingUp },
    { key: 'maintenance_risk', label: 'Maintenance Risk',   icon: Wrench },
    { key: 'crew_fatigue',     label: 'Crew Fatigue',       icon: Users },
    { key: 'irops_recovery',   label: 'IROPS Recovery',     icon: AlertTriangle },
  ];

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <p className="text-sm font-extrabold text-white tracking-wide">PREDICTIVE AI</p>
          {insights && !insights.error && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">AI ANALYZED</span>
          )}
        </div>
        <button
          onClick={runAI}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {loading ? 'Analyzing…' : 'Run AI'}
        </button>
      </div>

      <div className="p-4 grid grid-cols-2 gap-2">
        {cards.map(({ key, label, icon: Icon }) => {
          const item = display[key] || {};
          const risk = item.risk || 'low';
          return (
            <div key={key} className="bg-[#0d1117] rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className={cn('w-3.5 h-3.5', RISK_COLOR[risk])} />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</p>
              </div>
              <RiskBadge level={risk} />
              {item.summary && <p className="text-[10px] text-gray-500 leading-relaxed">{item.summary}</p>}
              {item.actions?.length > 0 && (
                <ul className="space-y-0.5">
                  {item.actions.slice(0, 2).map((a, i) => (
                    <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                      <span className="text-primary mt-0.5 flex-shrink-0">›</span> {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {insights?.error && (
        <p className="px-4 pb-3 text-[10px] text-red-400">AI error: {insights.error}</p>
      )}
    </div>
  );
}