import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Send, Brain, Search, TrendingUp, Loader2, Plane, Zap, AlertTriangle,
  Clock, RefreshCw, ChevronRight, Package, Users, FileText, Shield,
  Activity, BarChart3, Wrench, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// ── Suggested queries covering the whole app ──────────────────────────────────
const SUGGESTED_QUERIES = [
  { label: 'Fleet-wide AOG summary and recommended recovery actions', category: 'fleet' },
  { label: 'Which MEL deferrals are expiring in the next 72 hours?', category: 'mel' },
  { label: 'Identify aircraft with recurring ATA 29 faults and recommend interventions', category: 'mx' },
  { label: 'Summarize crew legality risks across current assignments', category: 'crew' },
  { label: 'What parts are on critical shortage that could ground aircraft?', category: 'parts' },
  { label: 'Generate a shift handover brief for the outgoing MCC team', category: 'ops' },
  { label: 'Which aircraft require ETOPS checks in the next 24 hours?', category: 'etops' },
  { label: 'Recommend corrective actions for the top 3 open discrepancies', category: 'mx' },
  { label: 'Summarize all open RII items requiring inspector sign-off', category: 'records' },
  { label: 'What is the overall fleet health score and key risk factors?', category: 'fleet' },
];

const CATEGORY_COLORS = {
  fleet:   'text-primary border-primary/30 bg-primary/10',
  mel:     'text-amber-400 border-amber-500/30 bg-amber-500/10',
  mx:      'text-blue-400 border-blue-500/30 bg-blue-500/10',
  crew:    'text-purple-400 border-purple-500/30 bg-purple-500/10',
  parts:   'text-green-400 border-green-500/30 bg-green-500/10',
  ops:     'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  etops:   'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  records: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
};

const TABS = [
  { id: 'chat',       label: 'Chat',        icon: Brain },
  { id: 'nlp',        label: 'NLP Search',  icon: Search },
  { id: 'predictive', label: 'Predictive',  icon: TrendingUp },
  { id: 'context',    label: 'Live Context',icon: Activity },
];

// ── Message bubbles ───────────────────────────────────────────────────────────
function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({ content, isStreaming }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Brain className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="max-w-[82%] bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-foreground">
        {isStreaming && !content ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Analyzing all fleet systems…</span>
          </div>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_h3]:text-primary [&_h3]:font-black [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1 [&_h2]:text-white [&_h2]:font-black [&_h2]:text-sm [&_h2]:mt-3"
            components={{
              code: ({ inline, children }) =>
                inline ? (
                  <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                ) : (
                  <pre className="bg-black/30 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">
                    <code>{children}</code>
                  </pre>
                ),
              strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
              a: ({ children, href }) => <a href={href} className="text-accent underline" target="_blank" rel="noreferrer">{children}</a>,
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ── Live Context panel — shows what the AI "sees" ─────────────────────────────
function LiveContextPanel({ ctx }) {
  const sections = [
    {
      title: 'Fleet Status', icon: Plane, color: 'text-primary',
      items: [
        { label: 'Total Aircraft', value: ctx.totalAircraft },
        { label: 'AOG', value: ctx.aogCount, highlight: ctx.aogCount > 0 ? 'text-red-400' : 'text-green-400' },
        { label: 'In Maintenance', value: ctx.inWorkCount, highlight: 'text-blue-400' },
        { label: 'Active / In Service', value: ctx.activeCount, highlight: 'text-green-400' },
      ],
    },
    {
      title: 'Maintenance', icon: Wrench, color: 'text-blue-400',
      items: [
        { label: 'Open Discrepancies', value: ctx.openDiscs, highlight: ctx.openDiscs > 0 ? 'text-amber-400' : 'text-green-400' },
        { label: 'Pending RII', value: ctx.pendingRII, highlight: ctx.pendingRII > 0 ? 'text-red-400' : 'text-green-400' },
        { label: 'OOS Entries', value: ctx.oosCount },
        { label: 'Open Work Packages', value: ctx.workPackages },
      ],
    },
    {
      title: 'MEL / Deferrals', icon: FileText, color: 'text-amber-400',
      items: [
        { label: 'Open MEL Items', value: ctx.openMels, highlight: ctx.openMels > 0 ? 'text-amber-400' : 'text-green-400' },
        { label: 'Expired MELs', value: ctx.expiredMels, highlight: ctx.expiredMels > 0 ? 'text-red-400' : 'text-green-400' },
        { label: 'CAT A (24h)', value: ctx.catA, highlight: ctx.catA > 0 ? 'text-red-400' : 'text-green-400' },
        { label: 'CAT B (3 day)', value: ctx.catB, highlight: ctx.catB > 0 ? 'text-amber-400' : 'text-green-400' },
      ],
    },
    {
      title: 'Crew & Dispatch', icon: Users, color: 'text-purple-400',
      items: [
        { label: 'Crew Assignments', value: ctx.crewAssignments },
        { label: 'Active Flights', value: ctx.activeFlights },
        { label: 'IROPS Events', value: ctx.iropsEvents, highlight: ctx.iropsEvents > 0 ? 'text-red-400' : 'text-green-400' },
        { label: 'Dispatch Releases', value: ctx.dispatchReleases },
      ],
    },
    {
      title: 'Parts & Supply', icon: Package, color: 'text-green-400',
      items: [
        { label: 'Supply Requisitions', value: ctx.requisitions },
        { label: 'Inventory Items', value: ctx.inventoryItems },
        { label: 'AOG Parts Req.', value: ctx.aogParts, highlight: ctx.aogParts > 0 ? 'text-red-400' : 'text-green-400' },
      ],
    },
    {
      title: 'ETOPS & Compliance', icon: Shield, color: 'text-indigo-400',
      items: [
        { label: 'ETOPS Aircraft', value: ctx.etopsAircraft },
        { label: 'Open AD Items', value: ctx.adItems },
        { label: 'Pending CRS', value: ctx.pendingCRS },
        { label: 'Safety Reports', value: ctx.safetyReports },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
          Live application data visible to AI — updated in real time
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(({ title, icon: Icon, color, items }) => (
          <div key={title} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={cn('w-4 h-4', color)} />
              <p className="text-xs font-extrabold text-white uppercase tracking-widest">{title}</p>
            </div>
            <div className="space-y-2">
              {items.map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={cn('text-sm font-black tabular-nums', highlight || 'text-white')}>{value ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Predictive panel ─────────────────────────────────────────────────────────
function PredictivePanel({ ctx, aircraft, logEntries, melItems, onAsk }) {
  const [aiInsights, setAiInsights] = useState('');
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    const prompt = buildSystemContext(ctx, aircraft, logEntries, melItems) + `

Based on ALL the above fleet data, provide a structured predictive maintenance brief with:
1. **Top 3 AOG/OOS Risks** — specific tails, root cause analysis, recommended actions
2. **MEL Deferral Alerts** — items expiring soon, regulatory exposure
3. **Recurring Fault Patterns** — ATA system trends, possible systemic issues
4. **Dispatch Readiness** — fleet availability for next 24h
5. **Recommended Immediate Actions** — prioritized action list for MCC

Be specific, use tail numbers and ATA chapters from the data. Format with clear headers and bullet points.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
    setAiInsights(result);
    setLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'AOG', value: ctx.aogCount, color: ctx.aogCount > 0 ? 'text-red-400' : 'text-green-400', bg: ctx.aogCount > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5' },
          { label: 'Open MELs', value: ctx.openMels, color: ctx.openMels > 0 ? 'text-amber-400' : 'text-green-400', bg: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'Open Write-Ups', value: ctx.openDiscs, color: ctx.openDiscs > 0 ? 'text-blue-400' : 'text-green-400', bg: 'border-blue-500/20 bg-blue-500/5' },
          { label: 'IROPS Events', value: ctx.iropsEvents, color: ctx.iropsEvents > 0 ? 'text-red-400' : 'text-green-400', bg: 'border-red-500/20 bg-red-500/5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4 text-center', bg)}>
            <p className={cn('text-3xl font-black', color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">{label}</p>
          </div>
        ))}
      </div>

      {/* AI brief */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-white">AI Predictive Brief</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">FULL APP CONTEXT</span>
          </div>
          <button
            onClick={generateInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {aiInsights ? 'Regenerate' : 'Generate Brief'}
          </button>
        </div>
        {aiInsights ? (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none [&_p]:my-1.5 [&_li]:my-0.5 [&_h2]:text-primary [&_h2]:font-black [&_h2]:text-sm [&_h2]:mt-3 [&_strong]:text-primary"
          >
            {aiInsights}
          </ReactMarkdown>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Click "Generate Brief" to get an AI analysis of the full fleet state</p>
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'AOG Recovery Plan', q: 'Provide a step-by-step AOG recovery plan for each grounded aircraft in the fleet', icon: AlertTriangle, color: 'text-red-400' },
          { label: 'MEL Expiry Report', q: 'List all MEL deferrals expiring in the next 72 hours with required actions', icon: FileText, color: 'text-amber-400' },
          { label: 'Fault Pattern Analysis', q: 'Analyze recurring fault patterns across the fleet by ATA chapter and recommend systemic fixes', icon: Activity, color: 'text-blue-400' },
          { label: 'Shift Handover Brief', q: 'Generate a complete MCC shift handover brief covering all aircraft status, open items, and priorities', icon: Radio, color: 'text-cyan-400' },
        ].map(({ label, q, icon: Icon, color }) => (
          <button key={label} onClick={() => onAsk(q)}
            className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-left hover:border-primary/40 transition-colors">
            <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
            <span className="text-xs font-bold text-white">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── NLP Search ────────────────────────────────────────────────────────────────
function NLPSearchPanel({ aircraft, logEntries, melItems, workPackages, oosEntries, requisitions }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const lower = query.toLowerCase();

    const matchAircraft = aircraft.filter(a =>
      a.tail_number?.toLowerCase().includes(lower) ||
      a.aircraft_type?.toLowerCase().includes(lower) ||
      a.base_station?.toLowerCase().includes(lower) ||
      a.engine_type?.toLowerCase().includes(lower)
    ).slice(0, 4).map(a => ({ type: 'aircraft', label: a.tail_number, sub: `${a.aircraft_type} · ${a.base_station || '—'} · Status: ${a.status}` }));

    const matchLogs = logEntries.filter(e =>
      e.description?.toLowerCase().includes(lower) ||
      e.ata_chapter?.toLowerCase().includes(lower) ||
      e.aircraft_tail?.toLowerCase().includes(lower) ||
      e.corrective_action?.toLowerCase().includes(lower)
    ).slice(0, 4).map(e => ({ type: 'logbook', label: `${e.aircraft_tail} — ${e.entry_type?.toUpperCase()}`, sub: (e.description || '—').slice(0, 120) }));

    const matchMels = melItems.filter(m =>
      m.mel_reference?.toLowerCase().includes(lower) ||
      m.title?.toLowerCase().includes(lower) ||
      m.description?.toLowerCase().includes(lower) ||
      m.aircraft_tail?.toLowerCase().includes(lower)
    ).slice(0, 3).map(m => ({ type: 'mel', label: `${m.aircraft_tail} — ${m.mel_reference || 'MEL'}`, sub: (m.title || m.description || '—').slice(0, 120) }));

    const matchOOS = oosEntries.filter(e =>
      e.tail_number?.toLowerCase().includes(lower) ||
      e.work_description?.toLowerCase().includes(lower) ||
      e.station?.toLowerCase().includes(lower)
    ).slice(0, 3).map(e => ({ type: 'oos', label: `OOS: ${e.tail_number}`, sub: `${e.work_description?.slice(0, 100) || '—'} · ${e.station || ''}` }));

    setTimeout(() => {
      setResults([...matchAircraft, ...matchLogs, ...matchMels, ...matchOOS]);
      setSearching(false);
    }, 400);
  };

  const TYPE_ICON = {
    aircraft: { icon: Plane, color: 'text-primary', bg: 'bg-primary/15' },
    logbook:  { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    mel:      { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    oos:      { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search tails, ATA chapters, fault descriptions, MEL references, stations…"
            className="flex-1 bg-transparent text-sm text-white placeholder-muted-foreground outline-none"
          />
        </div>
        <button onClick={handleSearch} disabled={!query.trim() || searching}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-colors hover:bg-primary/90">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">{results.length} results across fleet, logbooks, MEL & OOS</p>
          {results.map((r, i) => {
            const { icon: Icon, color, bg } = TYPE_ICON[r.type] || TYPE_ICON.aircraft;
            return (
              <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
                  <Icon className={cn('w-3.5 h-3.5', color)} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!searching && query && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">No results found for "{query}"</div>
      )}
    </div>
  );
}

// ── Build rich system context from all app data ────────────────────────────────
function buildSystemContext(ctx, aircraft, logEntries, melItems, oosEntries = [], crewAssignments = [], flights = [], requisitions = [], workPackages = [], safetyReports = []) {
  const aogTails = aircraft.filter(a => a.status === 'oos').map(a => `${a.tail_number} (${a.aircraft_type}${a.base_station ? ', ' + a.base_station : ''})`).join('; ') || 'None';
  const inWorkTails = aircraft.filter(a => a.status === 'maintenance').map(a => a.tail_number).join(', ') || 'None';
  const etopsTails = aircraft.filter(a => a.etops_approval).map(a => `${a.tail_number} ETOPS-${a.etops_approval}`).join(', ') || 'None';

  const openMelList = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided')
    .slice(0, 10)
    .map(m => `  - ${m.aircraft_tail}: ${m.mel_reference || 'MEL'} CAT ${m.mel_category || '?'} — ${(m.title || m.description || '—').slice(0, 80)}`)
    .join('\n') || '  None';

  const discrepancyList = logEntries.filter(e => e.entry_type === 'discrepancy' && e.discrepancy_status !== 'CLOSED')
    .slice(0, 10)
    .map(e => `  - ${e.aircraft_tail} ATA ${e.ata_chapter || '??'}: ${(e.description || '—').slice(0, 100)} [${e.discrepancy_status}]`)
    .join('\n') || '  None';

  const oosDetail = oosEntries.slice(0, 8)
    .map(e => `  - ${e.tail_number}: ${(e.work_description || '—').slice(0, 80)} @ ${e.station || '?'} [${e.status}]`)
    .join('\n') || '  None';

  const flightList = flights.slice(0, 10)
    .map(f => `  - ${f.flight_number || '?'} ${f.origin || '?'}→${f.destination || '?'} ${f.tail_number || ''} [${f.status || '?'}]`)
    .join('\n') || '  None';

  const requisitionList = requisitions.filter(r => r.status === 'pending').slice(0, 5)
    .map(r => `  - ${r.part_number || '?'} for ${r.aircraft_tail || '?'}: ${r.description || '—'} [${r.priority || 'normal'}]`)
    .join('\n') || '  None';

  return `You are the AI Maintenance Copilot for Aerodyne Fleet LLC — an enterprise aviation MRO platform.
You have full real-time access to every module in the application:
Fleet Management, E-Logbook, MEL/Deferrals, Dispatch, Crew Operations, Parts & Supply, ETOPS, QA/QC, Engineering, Records & Compliance.

You must act as a senior MCC (Maintenance Control Center) director with deep knowledge of:
- FAA 14 CFR Parts 43, 91, 121, 135
- Boeing AMM, Airbus AMM, Embraer AMM procedures
- MEL philosophy, CDL, NEF deferral authority
- ETOPS requirements (14 CFR 121.374)
- RII (Required Inspection Item) protocols
- ATA chapter system and fault isolation

═══════════════════════════════════════════════
LIVE APPLICATION DATA SNAPSHOT
═══════════════════════════════════════════════

FLEET OVERVIEW:
- Total registered aircraft: ${ctx.totalAircraft}
- AOG (Air on Ground): ${ctx.aogCount} tails: ${aogTails}
- Under maintenance: ${ctx.inWorkCount} tails: ${inWorkTails}
- Active / in service: ${ctx.activeCount}
- ETOPS-approved tails: ${etopsTails}

MAINTENANCE STATUS:
- Open discrepancies: ${ctx.openDiscs}
- Pending RII sign-offs: ${ctx.pendingRII}
- OOS entries: ${ctx.oosCount}
- Open work packages: ${ctx.workPackages}

OPEN DISCREPANCIES (TOP 10):
${discrepancyList}

MEL / DEFERRAL STATUS:
- Open MEL items: ${ctx.openMels} (Expired: ${ctx.expiredMels}, CAT A: ${ctx.catA}, CAT B: ${ctx.catB})

OPEN MEL ITEMS (TOP 10):
${openMelList}

OOS DETAIL:
${oosDetail}

CREW & DISPATCH:
- Active crew assignments: ${ctx.crewAssignments}
- Active/tracked flights: ${ctx.activeFlights}
- IROPS events open: ${ctx.iropsEvents}
- Dispatch releases: ${ctx.dispatchReleases}

ACTIVE FLIGHTS:
${flightList}

PARTS & SUPPLY:
- Open supply requisitions: ${ctx.requisitions}
- Inventory items tracked: ${ctx.inventoryItems}
- AOG-priority parts requests: ${ctx.aogParts}

PENDING PARTS (AOG/PRIORITY):
${requisitionList}

COMPLIANCE:
- ETOPS aircraft in fleet: ${ctx.etopsAircraft}
- Open AD items: ${ctx.adItems}
- Pending CRS releases: ${ctx.pendingCRS}
- Safety reports open: ${ctx.safetyReports}

═══════════════════════════════════════════════
RESPONSE GUIDELINES:
- Always reference specific tail numbers, ATA chapters, and regulatory citations
- Prioritize safety-critical items (AOG, RII, expired MELs, CAT A deferrals)
- Provide actionable, numbered recommendations
- Use proper aviation terminology (e.g., "return to service", "defer IAW MEL", "RII required")
- Format responses with clear **headers**, bullet points, and urgency indicators
- When data is missing, say so explicitly rather than assuming
═══════════════════════════════════════════════`;
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AICopilot() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Fetch ALL major app entities ──────────────────────────────────────────
  const { data: aircraft = [] }        = useQuery({ queryKey: ['cop-aircraft'],    queryFn: () => base44.entities.Aircraft.list('-created_date', 500), staleTime: 30000 });
  const { data: logEntries = [] }      = useQuery({ queryKey: ['cop-logs'],        queryFn: () => base44.entities.LogbookEntry.list('-created_date', 200), staleTime: 30000 });
  const { data: oosEntries = [] }      = useQuery({ queryKey: ['cop-oos'],         queryFn: () => base44.entities.OOSEntry.list('-created_date', 100), staleTime: 30000 });
  const { data: melItems = [] }        = useQuery({ queryKey: ['cop-mel'],         queryFn: () => base44.entities.MELItem.list('-created_date', 200), staleTime: 60000 });
  const { data: crewAssignments = [] } = useQuery({ queryKey: ['cop-crew'],        queryFn: () => base44.entities.CrewAssignment.list('-created_date', 100), staleTime: 60000 });
  const { data: flights = [] }         = useQuery({ queryKey: ['cop-flights'],     queryFn: () => base44.entities.Flight.list('-created_date', 100), staleTime: 30000 });
  const { data: requisitions = [] }    = useQuery({ queryKey: ['cop-parts'],       queryFn: () => base44.entities.SupplyRequisition.list('-created_date', 100), staleTime: 60000 });
  const { data: workPackages = [] }    = useQuery({ queryKey: ['cop-work'],        queryFn: () => base44.entities.WorkPackage.list('-created_date', 100), staleTime: 60000 });
  const { data: adItems = [] }         = useQuery({ queryKey: ['cop-ad'],          queryFn: () => base44.entities.AirworthinessDirective.list('-created_date', 100), staleTime: 120000 });
  const { data: safetyReports = [] }   = useQuery({ queryKey: ['cop-safety'],      queryFn: () => base44.entities.SafetyReport.list('-created_date', 50), staleTime: 120000 });
  const { data: iropsEvents = [] }     = useQuery({ queryKey: ['cop-irops'],       queryFn: () => base44.entities.IROPSEvent.list('-created_date', 50), staleTime: 30000 });
  const { data: dispatchReleases = []}= useQuery({ queryKey: ['cop-dispatch'],    queryFn: () => base44.entities.DispatchRelease.list('-created_date', 50), staleTime: 60000 });
  const { data: inventoryItems = [] }  = useQuery({ queryKey: ['cop-inventory'],   queryFn: () => base44.entities.InventoryItem.list('-created_date', 200), staleTime: 120000 });
  const { data: crsItems = [] }        = useQuery({ queryKey: ['cop-crs'],         queryFn: () => base44.entities.CertificateOfRelease.list('-created_date', 50), staleTime: 60000 });

  // ── Derive live context metrics ──────────────────────────────────────────
  const ctx = useMemo(() => {
    const openMelArr = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');
    const openDiscArr = logEntries.filter(e => e.entry_type === 'discrepancy' && e.discrepancy_status !== 'CLOSED');
    return {
      totalAircraft:   aircraft.length,
      aogCount:        aircraft.filter(a => a.status === 'oos').length,
      inWorkCount:     aircraft.filter(a => a.status === 'maintenance').length,
      activeCount:     aircraft.filter(a => a.status === 'active').length,
      openDiscs:       openDiscArr.length,
      pendingRII:      openDiscArr.filter(e => e.discrepancy_status === 'PENDING_RII').length,
      oosCount:        oosEntries.length,
      workPackages:    workPackages.filter(w => w.status !== 'completed').length,
      openMels:        openMelArr.length,
      expiredMels:     melItems.filter(m => m.status === 'expired').length,
      catA:            openMelArr.filter(m => m.mel_category === 'A').length,
      catB:            openMelArr.filter(m => m.mel_category === 'B').length,
      crewAssignments: crewAssignments.length,
      activeFlights:   flights.filter(f => f.status === 'active' || f.status === 'in_flight').length,
      iropsEvents:     iropsEvents.filter(e => e.status !== 'resolved' && e.status !== 'closed').length,
      dispatchReleases:dispatchReleases.length,
      requisitions:    requisitions.filter(r => r.status === 'pending').length,
      inventoryItems:  inventoryItems.length,
      aogParts:        requisitions.filter(r => r.priority === 'aog' || r.priority === 'critical').length,
      etopsAircraft:   aircraft.filter(a => a.etops_approval).length,
      adItems:         adItems.filter(a => a.status !== 'complied').length,
      pendingCRS:      crsItems.filter(c => c.status === 'pending' || c.status === 'draft').length,
      safetyReports:   safetyReports.filter(s => s.status !== 'closed').length,
    };
  }, [aircraft, logEntries, oosEntries, melItems, crewAssignments, flights, requisitions, workPackages, adItems, safetyReports, iropsEvents, dispatchReleases, inventoryItems, crsItems]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    setActiveTab('chat');

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    const history = messages.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
    const systemCtx = buildSystemContext(ctx, aircraft, logEntries, melItems, oosEntries, crewAssignments, flights, requisitions, workPackages, safetyReports);
    const prompt = `${systemCtx}\n\n${history ? 'CONVERSATION HISTORY:\n' + history + '\n\n' : ''}User: ${msg}\n\nAssistant:`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });

    setMessages(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = { role: 'assistant', content: result, isStreaming: false };
      return copy;
    });
    setIsLoading(false);
  };

  const hasMsgs = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wide">AI Maintenance Copilot</h1>
            <p className="text-[10px] text-muted-foreground">Full application context · {ctx.totalAircraft} aircraft · live data</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all',
                activeTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white')}>
              <Icon className="w-3.5 h-3.5" />
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {ctx.aogCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {ctx.aogCount} AOG
              </span>
            )}
            {ctx.openMels > 0 && (
              <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                {ctx.openMels} MELs
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground hidden lg:block">Claude Sonnet 4.5 · Full App Context</span>
          </div>
        </div>
      </div>

      {/* ── CHAT tab ── */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {!hasMsgs && (
              <div className="flex flex-col items-center justify-center min-h-full gap-6 py-8">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                  <p className="text-sm font-black text-white">Ask about anything in the system</p>
                  <p className="text-xs text-muted-foreground mt-1">Fleet · Maintenance · MEL · Crew · Parts · Dispatch · ETOPS · Records</p>
                </div>
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUERIES.map(({ label, category }, i) => (
                    <button key={i} onClick={() => sendMessage(label)}
                      className="flex items-start gap-2.5 text-left px-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground hover:border-primary/40 transition-all group">
                      <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5', CATEGORY_COLORS[category])}>
                        {category.toUpperCase()}
                      </span>
                      <span className="group-hover:text-white transition-colors text-xs leading-relaxed">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) =>
              msg.role === 'user'
                ? <UserBubble key={i} content={msg.content} />
                : <AssistantBubble key={i} content={msg.content} isStreaming={msg.isStreaming} />
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-background">
            {hasMsgs && (
              <button onClick={() => setMessages([])} className="text-[10px] text-muted-foreground hover:text-white mb-2 transition-colors">
                Clear conversation
              </button>
            )}
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about any tail, ATA chapter, MEL, crew, parts, dispatch, or request a recommendation…"
                className="flex-1 bg-transparent text-sm text-white placeholder-muted-foreground outline-none"
                disabled={isLoading}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold disabled:opacity-40 hover:bg-primary/90 transition-all flex-shrink-0">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                SEND
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'nlp' && (
        <NLPSearchPanel aircraft={aircraft} logEntries={logEntries} melItems={melItems} workPackages={workPackages} oosEntries={oosEntries} requisitions={requisitions} />
      )}

      {activeTab === 'predictive' && (
        <PredictivePanel ctx={ctx} aircraft={aircraft} logEntries={logEntries} melItems={melItems} onAsk={sendMessage} />
      )}

      {activeTab === 'context' && (
        <LiveContextPanel ctx={ctx} />
      )}
    </div>
  );
}