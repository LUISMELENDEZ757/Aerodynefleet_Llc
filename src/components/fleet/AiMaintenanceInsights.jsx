import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Brain, RefreshCw, AlertTriangle, CheckCircle, Wrench,
  TrendingUp, Zap, Clock, Shield, ChevronDown, ChevronUp,
  Plane, Activity, Target, BarChart3, Lightbulb, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 },
};

// ── Severity badge ────────────────────────────────────────────────────────────
function SeverityBadge({ level }) {
  const map = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/40',
    warning:  'bg-amber-500/20 text-amber-400 border-amber-500/40',
    moderate: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    low:      'bg-blue-500/20 text-blue-400 border-blue-500/40',
    good:     'bg-green-500/20 text-green-400 border-green-500/40',
  };
  return (
    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-widest', map[level] || map.low)}>
      {level}
    </span>
  );
}

// ── Insight Card ──────────────────────────────────────────────────────────────
function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false);
  const icons = { critical: AlertTriangle, warning: Wrench, good: CheckCircle, moderate: Activity, low: Lightbulb };
  const Icon = icons[insight.severity] || Lightbulb;
  const colors = {
    critical: 'border-red-500/30 bg-red-500/5',
    warning:  'border-amber-500/30 bg-amber-500/5',
    moderate: 'border-orange-500/30 bg-orange-500/5',
    low:      'border-blue-500/30 bg-blue-500/5',
    good:     'border-green-500/30 bg-green-500/5',
  };

  return (
    <div className={cn('rounded-2xl border p-4 transition-all', colors[insight.severity] || colors.low)}>
      <button className="w-full text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
              insight.severity === 'critical' ? 'bg-red-500/20' :
              insight.severity === 'warning' ? 'bg-amber-500/20' :
              insight.severity === 'good' ? 'bg-green-500/20' : 'bg-blue-500/20'
            )}>
              <Icon className={cn('w-4 h-4',
                insight.severity === 'critical' ? 'text-red-400' :
                insight.severity === 'warning' ? 'text-amber-400' :
                insight.severity === 'good' ? 'text-green-400' : 'text-blue-400'
              )} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <SeverityBadge level={insight.severity} />
                {insight.aircraft_tail && (
                  <span className="text-[10px] font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-lg">
                    {insight.aircraft_tail}
                  </span>
                )}
                {insight.ata_chapter && (
                  <span className="text-[10px] text-gray-500">ATA {insight.ata_chapter}</span>
                )}
              </div>
              <p className="text-sm font-bold text-white leading-snug">{insight.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{insight.summary}</p>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
          {insight.details && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Analysis</p>
              <p className="text-xs text-gray-300 leading-relaxed">{insight.details}</p>
            </div>
          )}
          {insight.recommendation && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Recommendation</p>
              <p className="text-xs text-gray-200 leading-relaxed">{insight.recommendation}</p>
            </div>
          )}
          {insight.action_items?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Action Items</p>
              <ul className="space-y-1">
                {insight.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Fleet Health Score Ring ───────────────────────────────────────────────────
function HealthScoreRing({ score }) {
  const color = score >= 85 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';
  const label = score >= 85 ? 'EXCELLENT' : score >= 65 ? 'FAIR' : 'CRITICAL';
  const data = [{ value: score }, { value: 100 - score }];
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-32 h-32">
        <PieChart width={128} height={128}>
          <Pie data={data} cx={60} cy={60} innerRadius={44} outerRadius={58} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black" style={{ color }}>{score}</p>
          <p className="text-[9px] font-bold text-gray-500">/ 100</p>
        </div>
      </div>
      <p className="text-xs font-extrabold tracking-widest" style={{ color }}>{label}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiMaintenanceInsights({ aircraft = [] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  // Fetch maintenance data
  const { data: faults = [] } = useQuery({
    queryKey: ['ai-faults'],
    queryFn: () => base44.entities.FaultMessage.list('-created_date', 200),
  });
  const { data: melItems = [] } = useQuery({
    queryKey: ['ai-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 200),
  });
  const { data: oosEntries = [] } = useQuery({
    queryKey: ['ai-oos'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 100),
  });
  const { data: logEntries = [] } = useQuery({
    queryKey: ['ai-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 200),
  });

  // Derived quick stats
  const activeFaults   = faults.filter(f => f.status === 'active');
  const criticalFaults = activeFaults.filter(f => f.severity === 'warning');
  const openMEL        = melItems.filter(m => m.status === 'open' || m.status === 'expiring_soon');
  const expiredMEL     = melItems.filter(m => m.status === 'expired');
  const openOOS        = oosEntries.filter(e => e.status !== 'released');
  const activeAc       = aircraft.filter(a => a.status === 'active').length;
  const oosAc          = aircraft.filter(a => a.status === 'oos' || a.status === 'maintenance').length;
  const dispatchRate   = aircraft.length > 0 ? Math.round((activeAc / aircraft.length) * 100) : 0;

  // ATA chapter fault frequency
  const ataMap = {};
  faults.forEach(f => {
    const ata = f.ata_chapter || 'Unknown';
    ataMap[ata] = (ataMap[ata] || 0) + 1;
  });
  const ataChartData = Object.entries(ataMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ata, count]) => ({ ata: `ATA ${ata}`, count }));

  // System breakdown for faults
  const sysMap = {};
  faults.forEach(f => { sysMap[f.system || 'other'] = (sysMap[f.system || 'other'] || 0) + 1; });
  const sysData = Object.entries(sysMap).map(([name, value]) => ({ name, value }));
  const SYS_COLORS = ['#f59e0b','#3b82f6','#22c55e','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `You are an expert aviation maintenance AI analyst. Analyze the following real fleet maintenance data and provide actionable insights.

FLEET OVERVIEW:
- Total aircraft: ${aircraft.length}
- Active / In-service: ${activeAc}
- Out of service / In maintenance: ${oosAc}
- Dispatch reliability rate: ${dispatchRate}%

FAULT DATA (${faults.length} total, ${activeFaults.length} active):
- Critical/Warning faults: ${criticalFaults.length}
- By system: ${JSON.stringify(sysMap)}
- Top ATA chapters: ${JSON.stringify(ataMap)}
- Sample active faults: ${JSON.stringify(activeFaults.slice(0, 10).map(f => ({ code: f.fault_code, system: f.system, severity: f.severity, ata: f.ata_chapter, aircraft: f.aircraft_tail })))}

MEL STATUS (${melItems.length} total):
- Open items: ${openMEL.length}
- Expired items: ${expiredMEL.length}
- Category breakdown: ${JSON.stringify(melItems.reduce((acc, m) => { acc[m.category || 'unknown'] = (acc[m.category || 'unknown'] || 0) + 1; return acc; }, {}))}
- Sample items: ${JSON.stringify(openMEL.slice(0, 5).map(m => ({ aircraft: m.aircraft_tail, ata: m.ata_chapter, category: m.category, desc: m.description?.substring(0, 80) })))}

OOS ENTRIES (${oosEntries.length} total, ${openOOS.length} open):
${JSON.stringify(openOOS.slice(0, 5).map(e => ({ tail: e.tail_number, status: e.status, description: e.work_description?.substring(0, 80) })))}

LOGBOOK SNAPSHOT (${logEntries.length} recent entries):
- Discrepancies: ${logEntries.filter(e => e.entry_type === 'discrepancy').length}
- Corrective actions: ${logEntries.filter(e => e.entry_type === 'corrective_action').length}
- Deferred items: ${logEntries.filter(e => e.is_deferred).length}

Please analyze this data and return a JSON with:
1. health_score: integer 0-100 (fleet overall health)
2. health_summary: one sentence summary
3. dispatch_rate: number (percentage)
4. insights: array of 6-8 insight objects, each with:
   - title: short title (max 8 words)
   - summary: 1-2 sentence insight (max 25 words)  
   - details: deeper analysis paragraph
   - severity: "critical" | "warning" | "moderate" | "low" | "good"
   - recommendation: specific recommended action
   - action_items: array of 2-3 specific action strings
   - aircraft_tail: (optional) specific tail if relevant
   - ata_chapter: (optional) ATA chapter if relevant
5. top_risks: array of 3 strings (top maintenance risks)
6. trending_systems: array of 3 strings (systems showing most issues)
7. recommended_actions: array of 4 strings (immediate actions)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            health_score: { type: 'number' },
            health_summary: { type: 'string' },
            dispatch_rate: { type: 'number' },
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  details: { type: 'string' },
                  severity: { type: 'string' },
                  recommendation: { type: 'string' },
                  action_items: { type: 'array', items: { type: 'string' } },
                  aircraft_tail: { type: 'string' },
                  ata_chapter: { type: 'string' },
                },
              },
            },
            top_risks: { type: 'array', items: { type: 'string' } },
            trending_systems: { type: 'array', items: { type: 'string' } },
            recommended_actions: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      setResult(response);
      setLastRun(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-base font-extrabold text-white">AI Maintenance Insights</p>
            <p className="text-xs text-gray-500">
              {lastRun ? `Last analyzed: ${lastRun.toLocaleTimeString()}` : 'Powered by Claude AI · Analyzes faults, MEL, OOS & logbook data'}
            </p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-extrabold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Fleet…</>
            : <><Brain className="w-4 h-4" /> {result ? 'Re-Analyze' : 'Run AI Analysis'}</>
          }
        </button>
      </div>

      {/* ── Quick Stats (always visible) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Faults',   value: activeFaults.length,  color: criticalFaults.length > 0 ? 'text-red-400'    : 'text-amber-400', icon: Zap },
          { label: 'Open MEL Items',  value: openMEL.length,       color: expiredMEL.length > 0   ? 'text-red-400'    : 'text-amber-400', icon: Shield },
          { label: 'Open OOS',        value: openOOS.length,       color: openOOS.length > 0      ? 'text-orange-400' : 'text-green-400', icon: Wrench },
          { label: 'Dispatch Rate',   value: `${dispatchRate}%`,   color: dispatchRate >= 85      ? 'text-green-400'  : 'text-amber-400', icon: Target },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-[#1a1f2e] border border-white/8 rounded-2xl p-4 flex items-center gap-3">
            <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
            <div>
              <p className={cn('text-2xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts (always visible) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ATA Chapter Fault Frequency */}
        <div className="bg-[#1a1f2e] border border-white/8 rounded-2xl p-5">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-primary" /> Fault Frequency by ATA Chapter
          </p>
          {ataChartData.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No fault data</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ataChartData} margin={{ left: -20 }}>
                <XAxis dataKey="ata" tick={{ fill: '#6b7280', fontSize: 9 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Faults" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* System Breakdown Pie */}
        <div className="bg-[#1a1f2e] border border-white/8 rounded-2xl p-5">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" /> Faults by Aircraft System
          </p>
          {sysData.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No fault data</p>
          ) : (
            <div className="flex items-center gap-4">
              <PieChart width={140} height={140}>
                <Pie data={sysData} cx={65} cy={65} innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {sysData.map((_, i) => <Cell key={i} fill={SYS_COLORS[i % SYS_COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {sysData.slice(0, 6).map(({ name, value }, i) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SYS_COLORS[i % SYS_COLORS.length] }} />
                    <span className="text-xs text-gray-400 capitalize truncate flex-1">{name}</span>
                    <span className="text-xs font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Pre-Analysis prompt ── */}
      {!result && !loading && !error && (
        <div className="bg-[#1a1f2e] border border-violet-500/20 rounded-2xl p-8 text-center space-y-4">
          <Brain className="w-14 h-14 text-violet-400/40 mx-auto" />
          <div>
            <p className="text-white font-extrabold text-lg">Ready to Analyze Your Fleet</p>
            <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
              Click "Run AI Analysis" to get AI-powered insights from your real fault messages, MEL items, OOS entries, and logbook data. Uses Claude AI.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Fault Pattern Detection', 'MEL Risk Assessment', 'Predictive Maintenance', 'Dispatch Risk Scoring'].map(tag => (
              <span key={tag} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">{tag}</span>
            ))}
          </div>
          <button onClick={runAnalysis}
            className="mt-2 flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-extrabold transition-all mx-auto">
            <Brain className="w-4 h-4" /> Run AI Analysis
          </button>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="bg-[#1a1f2e] border border-violet-500/20 rounded-2xl p-10 text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin" />
            <Brain className="absolute inset-0 m-auto w-7 h-7 text-violet-400" />
          </div>
          <div>
            <p className="text-white font-extrabold">Analyzing Fleet Maintenance Data…</p>
            <p className="text-gray-500 text-sm mt-1">Processing {faults.length} faults · {melItems.length} MEL items · {oosEntries.length} OOS entries</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-400">Analysis failed</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── AI Results ── */}
      {result && !loading && (
        <div className="space-y-5">

          {/* Health Score + Summary */}
          <div className="bg-[#1a1f2e] border border-white/8 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <HealthScoreRing score={result.health_score ?? 72} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fleet Health Summary</p>
                <p className="text-base font-bold text-white leading-relaxed">{result.health_summary}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.trending_systems?.map(sys => (
                    <span key={sys} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5" /> {sys}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Risks + Recommended Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.top_risks?.length > 0 && (
              <div className="bg-[#1a1f2e] border border-red-500/20 rounded-2xl p-5">
                <p className="text-xs font-extrabold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Top Maintenance Risks
                </p>
                <ul className="space-y-2.5">
                  {result.top_risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-gray-300 leading-relaxed">{risk}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.recommended_actions?.length > 0 && (
              <div className="bg-[#1a1f2e] border border-primary/20 rounded-2xl p-5">
                <p className="text-xs font-extrabold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" /> Immediate Recommended Actions
                </p>
                <ul className="space-y-2.5">
                  {result.recommended_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-300 leading-relaxed">{action}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Insight Cards */}
          {result.insights?.length > 0 && (
            <div>
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-violet-400" /> Detailed Insights ({result.insights.length})
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {result.insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-gray-600 pt-2 border-t border-white/5">
            <span>Analysis based on {faults.length} faults · {melItems.length} MEL items · {oosEntries.length} OOS entries · {logEntries.length} log entries</span>
            <span>Powered by Claude AI · {lastRun?.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}