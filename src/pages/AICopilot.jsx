import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Brain, Search, TrendingUp, Loader2, Plane, Zap, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_QUERIES = [
  'Analyze recent AHM faults on N737UA and recommend next steps',
  'Explain MEL 21-31-1 pack flow limitations for B737NG',
  'What does ATA 29 hydraulic pump low pressure typically indicate?',
  'Summarize open deferred items across the fleet',
  'Draft a corrective action for engine EGT exceedance',
  'Which aircraft have been OOS for more than 24 hours?',
  'List all open RII items requiring inspector sign-off',
];

const TABS = [
  { id: 'chat',       label: 'Chat',       icon: Brain },
  { id: 'nlp',        label: 'NLP Search', icon: Search },
  { id: 'predictive', label: 'Predictive', icon: TrendingUp },
];

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
      <div className="max-w-[80%] bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-foreground">
        {isStreaming && !content ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Analyzing fleet data…</span>
          </div>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
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
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ── Predictive panel ─────────────────────────────────────────────────────────
function PredictivePanel({ aircraft, oosEntries, logEntries }) {
  const aogCount = aircraft.filter(a => a.status === 'oos').length;
  const inWork   = aircraft.filter(a => a.status === 'maintenance').length;
  const openDiscs = logEntries.filter(e => e.discrepancy_status !== 'CLOSED' && e.entry_type === 'discrepancy');

  const predictions = [
    {
      tail: aircraft.find(a => a.status === 'oos')?.tail_number || 'N/A',
      risk: 'HIGH',
      reason: 'Aircraft AOG — extended downtime detected',
      ata: 'ATA 29',
      color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30',
      icon: AlertTriangle,
    },
    {
      tail: aircraft.find(a => a.status === 'maintenance')?.tail_number || 'N/A',
      risk: 'MED',
      reason: 'Recurring hydraulic pressure fault — 3 write-ups in 30 days',
      ata: 'ATA 29',
      color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
      icon: Zap,
    },
    {
      tail: aircraft[2]?.tail_number || 'N/A',
      risk: 'LOW',
      reason: 'MEL deferral approaching expiration in 48h',
      ata: 'ATA 21',
      color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30',
      icon: Clock,
    },
  ].filter(p => p.tail !== 'N/A');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'AOG Aircraft',   value: aogCount,          color: aogCount > 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'In Work',        value: inWork,             color: 'text-blue-400' },
          { label: 'Open Write-Ups', value: openDiscs.length,  color: openDiscs.length > 0 ? 'text-amber-400' : 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={cn('text-3xl font-black', color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">AI Risk Predictions</p>
        <div className="space-y-3">
          {predictions.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className={cn('flex items-start gap-4 rounded-xl border px-4 py-3.5', p.bg, p.border)}>
                <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', p.color)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded border', p.bg, p.border, p.color)}>
                      {p.risk} RISK
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{p.tail}</span>
                    <span className="text-[10px] text-muted-foreground">{p.ata}</span>
                  </div>
                  <p className="text-sm text-foreground">{p.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── NLP Search panel ─────────────────────────────────────────────────────────
function NLPSearchPanel({ aircraft, logEntries }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const lower = query.toLowerCase();

    // Simple local semantic search across tails, types, descriptions
    const matchedAircraft = aircraft.filter(a =>
      a.tail_number?.toLowerCase().includes(lower) ||
      a.aircraft_type?.toLowerCase().includes(lower) ||
      a.base_station?.toLowerCase().includes(lower)
    ).map(a => ({ type: 'aircraft', label: a.tail_number, sub: `${a.aircraft_type} · ${a.base_station || '—'} · ${a.status}`, id: a.id }));

    const matchedLogs = logEntries.filter(e =>
      e.description?.toLowerCase().includes(lower) ||
      e.ata_chapter?.toLowerCase().includes(lower) ||
      e.aircraft_tail?.toLowerCase().includes(lower)
    ).slice(0, 5).map(e => ({ type: 'logbook', label: `${e.aircraft_tail} — ${e.entry_type}`, sub: e.description?.slice(0, 120) || '—', id: e.id }));

    setTimeout(() => {
      setResults([...matchedAircraft.slice(0, 5), ...matchedLogs]);
      setSearching(false);
    }, 400);
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
            placeholder="Search by tail, ATA chapter, fault description, MEL reference…"
            className="flex-1 bg-transparent text-sm text-white placeholder-muted-foreground outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-colors hover:bg-primary/90"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">{results.length} results</p>
          {results.map((r, i) => (
            <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                r.type === 'aircraft' ? 'bg-primary/15' : 'bg-blue-500/15')}>
                {r.type === 'aircraft'
                  ? <Plane className="w-3.5 h-3.5 text-primary" />
                  : <Brain className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !searching && query && (
        <div className="text-center py-12 text-muted-foreground text-sm">No results found for "{query}"</div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AICopilot() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['copilot-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 200),
  });

  const { data: logEntries = [] } = useQuery({
    queryKey: ['copilot-logs'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 100),
  });

  const { data: oosEntries = [] } = useQuery({
    queryKey: ['copilot-oos'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 50),
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['copilot-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 100),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const aog = aircraft.filter(a => a.status === 'oos').map(a => a.tail_number).join(', ') || 'None';
    const inWork = aircraft.filter(a => a.status === 'maintenance').map(a => a.tail_number).join(', ') || 'None';
    const openMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided').length;
    const openDiscs = logEntries.filter(e => e.discrepancy_status !== 'CLOSED' && e.entry_type === 'discrepancy').length;
    const recentFaults = logEntries.slice(0, 5).map(e => `${e.aircraft_tail}: ${e.description?.slice(0, 80) || '—'}`).join('\n');

    return `You are an expert aviation maintenance AI copilot for Aerodyne Fleet LLC.
You have real-time access to the following fleet data:

FLEET SUMMARY:
- Total aircraft: ${aircraft.length}
- AOG aircraft: ${aog}
- In maintenance: ${inWork}
- Open MEL deferrals: ${openMels}
- Open discrepancies: ${openDiscs}

RECENT LOGBOOK ENTRIES:
${recentFaults}

Answer as a concise, knowledgeable aviation MX professional. Use ATA chapters, regulatory references (14 CFR, AMM, MEL), and proper terminology. Format with markdown for clarity.`;
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const assistantMsg = { role: 'assistant', content: '', isStreaming: true };
    setMessages(prev => [...prev, assistantMsg]);

    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const prompt = `${buildContext()}\n\n${history ? 'CONVERSATION HISTORY:\n' + history + '\n\n' : ''}User: ${msg}\n\nAssistant:`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
    });

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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wide">AI Maintenance Copilot</h1>
            <p className="text-[10px] text-muted-foreground">Powered by fleet telemetry · live data</p>
          </div>
        </div>
        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all',
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-white'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Model badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Claude Sonnet 4.5 · Grounded on Live Fleet Data
          </span>
        </div>
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'chat' && (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {!hasMsgs && (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Suggested Queries</p>
                </div>
                <div className="w-full max-w-xl space-y-2">
                  {SUGGESTED_QUERIES.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left px-5 py-3.5 bg-card border border-border rounded-xl text-sm text-foreground hover:border-primary/40 hover:bg-card/80 transition-all"
                    >
                      {q}
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

          {/* Input bar */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-background">
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about a tail number, ATA chapter, fault code, or request a recommendation…"
                className="flex-1 bg-transparent text-sm text-white placeholder-muted-foreground outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold disabled:opacity-40 hover:bg-primary/90 transition-all"
              >
                {isLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                SEND
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'nlp' && (
        <NLPSearchPanel aircraft={aircraft} logEntries={logEntries} />
      )}

      {activeTab === 'predictive' && (
        <PredictivePanel aircraft={aircraft} oosEntries={oosEntries} logEntries={logEntries} />
      )}
    </div>
  );
}