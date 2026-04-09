import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Zap, AlertTriangle, Brain, TrendingUp, Wrench, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

function RiskMeter({ score }) {
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f59e0b' : score >= 25 ? '#3b82f6' : '#22c55e';
  const label = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW';
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-extrabold" style={{ color }}>{label}</span>
    </div>
  );
}

export default function AOGProbabilityForecast() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: aircraft = [] } = useQuery({ queryKey: ['aog-aircraft'], queryFn: () => base44.entities.Aircraft.list('tail_number', 500) });
  const { data: faults = [] } = useQuery({ queryKey: ['aog-faults'], queryFn: () => base44.entities.FaultMessage.list('-created_date', 300) });
  const { data: mel = [] } = useQuery({ queryKey: ['aog-mel'], queryFn: () => base44.entities.MELItem.list('-deferred_date', 300) });
  const { data: logbook = [] } = useQuery({ queryKey: ['aog-logbook'], queryFn: () => base44.entities.LogbookEntry.list('-created_date', 300) });

  const runForecast = async () => {
    setLoading(true);
    const activeFaults = faults.filter(f => f.status === 'active');
    const openMel = mel.filter(m => m.status === 'open' || m.status === 'expiring_soon');
    const expiredMel = mel.filter(m => m.status === 'expired');
    const recentDiscrepancies = logbook.filter(e => e.entry_type === 'discrepancy' && e.discrepancy_status !== 'CLOSED');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert aircraft maintenance AI analyst. Predict AOG (Aircraft on Ground) probability for the next 24-72 hours for each aircraft.

FLEET DATA:
${JSON.stringify(aircraft.slice(0, 20).map(a => ({
  tail: a.tail_number, type: a.aircraft_type, status: a.status,
  base: a.base_station, engine: a.engine_type
})), null, 2)}

ACTIVE FAULTS BY AIRCRAFT:
${JSON.stringify(
  Object.entries(activeFaults.reduce((acc, f) => {
    if (!acc[f.aircraft_tail]) acc[f.aircraft_tail] = [];
    acc[f.aircraft_tail].push({ code: f.fault_code, system: f.system, severity: f.severity, ata: f.ata_chapter });
    return acc;
  }, {})).slice(0, 15),
  null, 2
)}

OPEN MEL ITEMS (expiring/expired):
${JSON.stringify(
  [...expiredMel.slice(0, 5), ...openMel.filter(m => m.category === 'A' || m.category === 'B').slice(0, 5)].map(m => ({
    tail: m.aircraft_tail, cat: m.category, ata: m.ata_chapter, expires: m.expiry_date, desc: m.description?.substring(0, 50)
  })),
  null, 2
)}

RECENT OPEN DISCREPANCIES:
${JSON.stringify(recentDiscrepancies.slice(0, 10).map(e => ({
  tail: e.aircraft_tail, ata: e.ata_chapter, desc: e.description?.substring(0, 60), status: e.discrepancy_status
})), null, 2)}

Return JSON with:
{
  "forecast_generated": "ISO timestamp",
  "aircraft_risks": [
    {
      "tail": "tail number",
      "aircraft_type": "type",
      "aog_risk_24h": 0-100,
      "aog_risk_72h": 0-100,
      "primary_risk_factors": ["factor1", "factor2"],
      "recommended_action": "specific action",
      "urgency": "immediate|watch|monitor|ok"
    }
  ],
  "fleet_summary": "one sentence overall fleet health",
  "top_concerns": ["concern1", "concern2", "concern3"]
}
Only include aircraft with aog_risk_24h > 10.`,
      response_json_schema: {
        type: 'object',
        properties: {
          forecast_generated: { type: 'string' },
          aircraft_risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tail: { type: 'string' },
                aircraft_type: { type: 'string' },
                aog_risk_24h: { type: 'number' },
                aog_risk_72h: { type: 'number' },
                primary_risk_factors: { type: 'array', items: { type: 'string' } },
                recommended_action: { type: 'string' },
                urgency: { type: 'string' },
              },
            },
          },
          fleet_summary: { type: 'string' },
          top_concerns: { type: 'array', items: { type: 'string' } },
        },
      },
      model: 'claude_sonnet_4_6',
    });
    setAnalysis(result);
    setLoading(false);
  };

  const URGENCY_CFG = {
    immediate: { label: 'IMMEDIATE ACTION', color: 'text-red-400', bg: 'bg-red-900/30 border-red-500/40' },
    watch: { label: 'WATCH', color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-500/40' },
    monitor: { label: 'MONITOR', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-500/40' },
    ok: { label: 'OK', color: 'text-green-400', bg: 'bg-green-900/30 border-green-500/40' },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-foreground">AOG PROBABILITY FORECAST</h1>
          <p className="text-xs font-mono text-red-400">Predictive · 24h / 72h Risk Model · Claude AI</p>
        </div>
        <button onClick={runForecast} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-600/30 disabled:opacity-50">
          {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running…</> : <><Brain className="w-3.5 h-3.5" /> Run Forecast</>}
        </button>
      </div>

      <div className="p-4 max-w-5xl mx-auto space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Fleet Size', value: aircraft.length, color: 'text-white' },
            { label: 'Active Faults', value: faults.filter(f => f.status === 'active').length, color: 'text-red-400' },
            { label: 'Exp/Exp MEL', value: mel.filter(m => m.status === 'expired').length, color: 'text-red-400' },
            { label: 'OOS Aircraft', value: aircraft.filter(a => a.status === 'oos').length, color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className={cn('text-3xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {!analysis && !loading && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-4">
            <Zap className="w-14 h-14 text-red-400/30 mx-auto" />
            <p className="text-white font-extrabold text-lg">AOG Risk Predictor</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              AI analyzes fault patterns, MEL expiry dates, open discrepancies, and historical data to predict which aircraft are at risk of going AOG in the next 24–72 hours.
            </p>
            <button onClick={runForecast} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 mx-auto">
              <Brain className="w-4 h-4" /> Run AOG Forecast
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-red-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-red-500 animate-spin" />
              <Brain className="absolute inset-0 m-auto w-7 h-7 text-red-400" />
            </div>
            <p className="text-white font-extrabold">Analyzing {aircraft.length} aircraft…</p>
            <p className="text-muted-foreground text-sm">Reviewing {faults.filter(f => f.status === 'active').length} faults, {mel.length} MEL items, {logbook.length} logbook entries</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-4">
            {/* Fleet Summary */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2">Fleet Summary</p>
              <p className="text-sm text-foreground">{analysis.fleet_summary}</p>
              {analysis.top_concerns?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {analysis.top_concerns.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aircraft Risk Cards */}
            {analysis.aircraft_risks?.sort((a, b) => b.aog_risk_24h - a.aog_risk_24h).map(risk => {
              const cfg = URGENCY_CFG[risk.urgency] || URGENCY_CFG.monitor;
              return (
                <div key={risk.tail} className={cn('bg-card border rounded-2xl p-5', cfg.bg)}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <RiskMeter score={risk.aog_risk_24h} />
                      <div>
                        <p className="text-base font-extrabold text-foreground font-mono">{risk.tail}</p>
                        <p className="text-xs text-muted-foreground">{risk.aircraft_type}</p>
                        <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded mt-1 inline-block', cfg.color, cfg.bg.replace('bg-', 'border-').replace('/30', '/40'))}>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">24h Risk</p>
                      <p className={cn('text-2xl font-black', risk.aog_risk_24h >= 75 ? 'text-red-400' : risk.aog_risk_24h >= 50 ? 'text-amber-400' : 'text-blue-400')}>{risk.aog_risk_24h}%</p>
                      <p className="text-xs text-muted-foreground">72h: {risk.aog_risk_72h}%</p>
                    </div>
                  </div>
                  {risk.primary_risk_factors?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {risk.primary_risk_factors.map(f => (
                        <span key={f} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-foreground">{f}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-foreground flex items-start gap-1.5">
                    <Wrench className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
                    {risk.recommended_action}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}