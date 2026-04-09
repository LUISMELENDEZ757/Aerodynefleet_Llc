import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, CloudLightning, RefreshCw, AlertTriangle, Info, Wind, Thermometer, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIGMET_TYPES = [
  { type: 'CONVECTIVE', label: 'Convective SIGMET', color: 'bg-red-500/20 border-red-500/50 text-red-400', dot: 'bg-red-500', severity: 'critical' },
  { type: 'TURBULENCE', label: 'Turbulence SIGMET', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400', dot: 'bg-orange-500', severity: 'high' },
  { type: 'ICING', label: 'Icing SIGMET', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400', dot: 'bg-blue-500', severity: 'medium' },
  { type: 'VOLCANIC', label: 'Volcanic Ash SIGMET', color: 'bg-gray-500/20 border-gray-500/50 text-gray-400', dot: 'bg-gray-500', severity: 'critical' },
  { type: 'TROPICAL', label: 'Tropical Cyclone SIGMET', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400', dot: 'bg-purple-500', severity: 'critical' },
];

const SAMPLE_SIGMETS = [
  { id: 'C1', type: 'CONVECTIVE', region: 'MKKA', area: 'FROM 40NW MKK TO 30W SPI TO 20SW IND TO 40NW MKK', altitudes: 'SFC-FL430', valid: '2026-04-09T14:55Z', expires: '2026-04-09T17:00Z', intensity: 'EMBD TS OBS AND FCST', movement: 'MOV E 20KT', flights_affected: ['AA4474', 'UA1832', 'DL556'] },
  { id: 'T3', type: 'TURBULENCE', region: 'KMSP', area: 'FROM 100NE MSP TO 80N DSM TO 60E DBQ TO 100NE MSP', altitudes: 'FL350-FL450', valid: '2026-04-09T13:00Z', expires: '2026-04-09T19:00Z', intensity: 'SEV TURB MOD-SEV ICE', movement: 'MOV NE 25KT', flights_affected: ['WN2341'] },
  { id: 'I2', type: 'ICING', region: 'KBOS', area: 'FROM BOS TO ALB TO SYR TO BOS', altitudes: 'FL080-FL200', valid: '2026-04-09T12:30Z', expires: '2026-04-09T18:30Z', intensity: 'MOD ICING IN CLDS', movement: 'STNR', flights_affected: ['B61234', 'AA509'] },
  { id: 'C2', type: 'CONVECTIVE', region: 'KCHI', area: 'FROM 50W ORD TO 30SW RFD TO 40N CWI TO 50W ORD', altitudes: 'SFC-FL280', valid: '2026-04-09T15:10Z', expires: '2026-04-09T17:15Z', intensity: 'ISOL SEV TS OBS', movement: 'MOV SE 15KT', flights_affected: ['UA456', 'AA7891', 'DL1023', 'WN8820'] },
];

const AIRMET_CATEGORIES = [
  { code: 'SIERRA', desc: 'IFR conditions and mountain obscuration', count: 3, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { code: 'TANGO', desc: 'Turbulence, wind shear, low-level jet', count: 5, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { code: 'ZULU', desc: 'Icing and freezing level', count: 2, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
];

export default function LiveSIGMETMap() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: flights = [] } = useQuery({
    queryKey: ['sigmet-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 100),
  });

  const activeFlights = flights.filter(f => ['airborne', 'departed', 'boarding'].includes(f.status));

  const filtered = filter === 'ALL' ? SAMPLE_SIGMETS : SAMPLE_SIGMETS.filter(s => s.type === filter);

  const runAiAnalysis = async () => {
    setAnalyzing(true);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert meteorologist and dispatcher. Analyze these active SIGMETs and their impact on flight operations:

ACTIVE SIGMETS:
${JSON.stringify(SAMPLE_SIGMETS, null, 2)}

ACTIVE FLIGHTS:
${JSON.stringify(activeFlights.slice(0, 10).map(f => ({ fn: f.flight_number, route: `${f.origin}-${f.destination}`, status: f.status })), null, 2)}

Provide:
1. Which flights are most at risk
2. Recommended altitude changes or route deviations
3. Any flights that should consider holding or diverting
4. Priority action items for the dispatcher

Keep response concise and actionable. Use bullet points.`,
      model: 'claude_sonnet_4_6',
    });
    setAiAnalysis(response);
    setAnalyzing(false);
  };

  const getSigmetCfg = (type) => SIGMET_TYPES.find(s => s.type === type) || SIGMET_TYPES[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <CloudLightning className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-foreground">SIGMET / AIRMET MONITOR</h1>
          <p className="text-xs font-mono text-blue-400">Live Aviation Weather Hazards · Route Impact Analysis</p>
        </div>
        <button onClick={() => setLastUpdated(new Date())} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-foreground">{SAMPLE_SIGMETS.length} Active SIGMETs</span>
            <span className="text-xs text-muted-foreground">Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold">
            <AlertTriangle className="w-3 h-3" /> {activeFlights.length} flights potentially affected
          </div>
        </div>

        {/* AIRMET Summary */}
        <div className="grid grid-cols-3 gap-3">
          {AIRMET_CATEGORIES.map(a => (
            <div key={a.code} className={cn('rounded-xl border px-3 py-2.5', a.color)}>
              <p className="text-xs font-extrabold tracking-widest">{a.code}</p>
              <p className="text-lg font-black">{a.count}</p>
              <p className="text-[10px] opacity-75 leading-snug">{a.desc}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['ALL', ...SIGMET_TYPES.map(s => s.type)].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn('flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all', filter === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* SIGMET List */}
          <div className="space-y-3">
            {filtered.map(sigmet => {
              const cfg = getSigmetCfg(sigmet.type);
              const isSelected = selected?.id === sigmet.id;
              return (
                <button key={sigmet.id} onClick={() => setSelected(isSelected ? null : sigmet)}
                  className={cn('w-full text-left bg-card border rounded-2xl p-4 transition-all', isSelected ? 'border-primary' : `border-border hover:border-white/20`)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase', cfg.color)}>
                        {sigmet.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground">{sigmet.id}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Expires {new Date(sigmet.expires).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}Z</span>
                  </div>
                  <p className="text-xs text-foreground font-medium mb-1">{sigmet.area}</p>
                  <p className="text-xs text-muted-foreground mb-2">{sigmet.altitudes} · {sigmet.intensity}</p>
                  {sigmet.flights_affected.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sigmet.flights_affected.map(fn => (
                        <span key={fn} className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded">
                          {fn}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail / AI Analysis Panel */}
          <div className="space-y-3">
            {selected ? (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getSigmetCfg(selected.type).color)}>{selected.type}</span>
                  <p className="text-sm font-extrabold text-foreground">SIGMET {selected.id} Detail</p>
                </div>
                {[
                  ['Region', selected.region],
                  ['Area', selected.area],
                  ['Altitudes', selected.altitudes],
                  ['Phenomenon', selected.intensity],
                  ['Movement', selected.movement],
                  ['Valid From', new Date(selected.valid).toLocaleString()],
                  ['Expires', new Date(selected.expires).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-muted-foreground w-24 flex-shrink-0">{k}:</span>
                    <span className="text-foreground font-medium">{v}</span>
                  </div>
                ))}
                {selected.flights_affected.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-bold mb-1.5">⚠ Flights Potentially Affected:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.flights_affected.map(fn => (
                        <span key={fn} className="text-xs font-mono font-bold px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">{fn}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-5 text-center">
                <CloudLightning className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a SIGMET to view details</p>
              </div>
            )}

            {/* AI Route Impact Analysis */}
            <div className="bg-card border border-violet-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">AI Route Impact Analysis</p>
                <button onClick={runAiAnalysis} disabled={analyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-400 text-xs font-bold hover:bg-violet-600/30 disabled:opacity-50">
                  {analyzing ? <><RefreshCw className="w-3 h-3 animate-spin" /> Analyzing…</> : <><CloudLightning className="w-3 h-3" /> Analyze</>}
                </button>
              </div>
              {aiAnalysis ? (
                <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
              ) : (
                <p className="text-xs text-muted-foreground">Click "Analyze" to get AI-powered route impact assessment for active flights based on current SIGMETs.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}