import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Package, Brain, RefreshCw, Plus, AlertTriangle, TrendingUp, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PredictivePartsOrdering() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState({});

  const { data: faults = [] } = useQuery({ queryKey: ['ppo-faults'], queryFn: () => base44.entities.FaultMessage.list('-created_date', 300) });
  const { data: mel = [] } = useQuery({ queryKey: ['ppo-mel'], queryFn: () => base44.entities.MELItem.list('-deferred_date', 200) });
  const { data: logbook = [] } = useQuery({ queryKey: ['ppo-logbook'], queryFn: () => base44.entities.LogbookEntry.list('-created_date', 300) });
  const { data: parts = [] } = useQuery({ queryKey: ['ppo-parts'], queryFn: () => base44.entities.Part.list('-created_date', 200) });
  const { data: aircraft = [] } = useQuery({ queryKey: ['ppo-aircraft'], queryFn: () => base44.entities.Aircraft.list('tail_number', 200) });

  const createReqMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplyRequisition.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ppo-parts'] }),
  });

  const runPrediction = async () => {
    setLoading(true);
    const activeFaults = faults.filter(f => f.status === 'active');
    const openMel = mel.filter(m => m.status === 'open' || m.status === 'expiring_soon');
    const recentWork = logbook.filter(e => e.parts_used).slice(0, 30);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert aviation supply chain analyst. Based on fault trends and maintenance data, predict which parts should be proactively ordered.

ACTIVE FAULTS (${activeFaults.length}):
${JSON.stringify(activeFaults.slice(0, 15).map(f => ({ code: f.fault_code, system: f.system, ata: f.ata_chapter, tail: f.aircraft_tail })), null, 2)}

OPEN MEL ITEMS (${openMel.length}):
${JSON.stringify(openMel.slice(0, 10).map(m => ({ cat: m.category, ata: m.ata_chapter, desc: m.description?.substring(0, 60), tail: m.aircraft_tail })), null, 2)}

RECENT PARTS USED:
${JSON.stringify(recentWork.slice(0, 10).map(e => ({ parts: e.parts_used?.substring(0, 60), ata: e.ata_chapter })), null, 2)}

FLEET SIZE: ${aircraft.length} aircraft

Return JSON with an array of parts recommendations:
{
  "recommendations": [
    {
      "part_name": "descriptive name",
      "part_number": "estimated PN format",
      "ata_chapter": "chapter",
      "quantity": number,
      "priority": "aog|critical|routine",
      "reason": "why needed based on data",
      "confidence": "high|medium|low",
      "estimated_cost": number,
      "aircraft_tails": ["tail numbers most likely to need this"]
    }
  ],
  "analysis_summary": "one sentence summary"
}
Return 8-12 recommendations sorted by priority.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                part_name: { type: 'string' },
                part_number: { type: 'string' },
                ata_chapter: { type: 'string' },
                quantity: { type: 'number' },
                priority: { type: 'string' },
                reason: { type: 'string' },
                confidence: { type: 'string' },
                estimated_cost: { type: 'number' },
                aircraft_tails: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          analysis_summary: { type: 'string' },
        },
      },
      model: 'claude_sonnet_4_6',
    });
    setPredictions(result);
    setLoading(false);
  };

  const orderPart = async (rec, i) => {
    setOrdering(p => ({ ...p, [i]: true }));
    await createReqMutation.mutateAsync({
      part_name: rec.part_name,
      part_number: rec.part_number,
      ata_chapter: rec.ata_chapter,
      quantity: rec.quantity,
      priority: rec.priority,
      reason: `[AI PREDICTIVE ORDER] ${rec.reason}`,
      status: 'pending_approval',
    });
    setOrdering(p => ({ ...p, [i]: false }));
  };

  const PRIORITY_CFG = {
    aog: { label: 'AOG', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/40' },
    critical: { label: 'CRITICAL', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/40' },
    routine: { label: 'ROUTINE', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/40' },
  };
  const CONF_CFG = {
    high: 'text-green-400', medium: 'text-amber-400', low: 'text-gray-400',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Package className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-foreground">PREDICTIVE PARTS ORDERING</h1>
          <p className="text-xs font-mono text-emerald-400">AI Supply Chain · Fault-Driven Procurement</p>
        </div>
        <button onClick={runPrediction} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 disabled:opacity-50">
          {loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing…</> : <><Brain className="w-3.5 h-3.5" /> Run AI Analysis</>}
        </button>
      </div>

      <div className="p-4 max-w-5xl mx-auto space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active Faults', value: faults.filter(f => f.status === 'active').length, color: 'text-red-400' },
            { label: 'Open MEL', value: mel.filter(m => m.status === 'open').length, color: 'text-amber-400' },
            { label: 'Fleet Size', value: aircraft.length, color: 'text-white' },
            { label: 'Existing Reqs', value: parts.length, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className={cn('text-3xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {!predictions && !loading && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-4">
            <Package className="w-14 h-14 text-emerald-400/30 mx-auto" />
            <p className="text-white font-extrabold text-lg">AI-Powered Parts Prediction</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Analyzes active fault codes, MEL items, and recent parts consumption to predict what you'll need before aircraft go AOG.
            </p>
            <button onClick={runPrediction} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 mx-auto">
              <Brain className="w-4 h-4" /> Predict Parts Needs
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
              <Brain className="absolute inset-0 m-auto w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-extrabold">Analyzing parts demand…</p>
          </div>
        )}

        {predictions && !loading && (
          <div className="space-y-4">
            <div className="bg-card border border-emerald-500/30 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-400 mb-1">AI Analysis Summary</p>
              <p className="text-sm text-foreground">{predictions.analysis_summary}</p>
            </div>
            {predictions.recommendations?.map((rec, i) => {
              const pcfg = PRIORITY_CFG[rec.priority] || PRIORITY_CFG.routine;
              return (
                <div key={i} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded border', pcfg.bg, pcfg.color)}>{pcfg.label}</span>
                        <span className="text-xs font-bold text-foreground">{rec.part_name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{rec.part_number}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Qty</p>
                      <p className="text-xl font-black text-foreground">{rec.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">ATA {rec.ata_chapter}</span>
                    <span className={cn('text-[10px] font-bold', CONF_CFG[rec.confidence])}>
                      {rec.confidence?.toUpperCase()} CONFIDENCE
                    </span>
                    {rec.estimated_cost > 0 && (
                      <span className="text-[10px] text-green-400">${rec.estimated_cost.toLocaleString()} est.</span>
                    )}
                    {rec.aircraft_tails?.map(t => (
                      <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded">{t}</span>
                    ))}
                    <div className="ml-auto">
                      <button
                        onClick={() => orderPart(rec, i)}
                        disabled={ordering[i]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 disabled:opacity-50 transition-colors"
                      >
                        {ordering[i] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        {ordering[i] ? 'Creating…' : 'Create Requisition'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}