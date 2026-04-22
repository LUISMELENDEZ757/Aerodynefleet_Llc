import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, addDays, format } from 'date-fns';
import {
  Wrench, AlertTriangle, RefreshCw, Plus, CheckCircle,
  Search, Filter, X, Bell, Plane, ChevronDown, ChevronUp,
  Clock, FileText, Eye, MapPin, Brain, Wifi, Monitor, Shield,
  Smile, ChevronRight, Loader2, Sparkles
} from 'lucide-react';

const STATIONS = ['All Stations','KEWR','KJFK','KLAX','KORD','KDFW','KATL','KMIA','KSFO','KBOS','KDEN','KPHX','KIAH','KLAS','KMCO'];
// Fallback modals - component imports may fail
const MELNewModal = ({ aircraft, onSave, onClose, isPending }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
      <p className="text-sm font-bold text-foreground mb-4">New MEL Item</p>
      <div className="space-y-3">
        <button onClick={onClose} className="w-full px-4 py-2 bg-secondary rounded-lg text-foreground text-sm font-semibold hover:bg-secondary/80">Close</button>
      </div>
    </div>
  </div>
);

const MELDetailModal = ({ item, onClose, onClear, onRefresh }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
      <p className="text-sm font-bold text-foreground mb-4">{item.description}</p>
      <button onClick={onClose} className="w-full px-4 py-2 bg-secondary rounded-lg text-foreground text-sm font-semibold hover:bg-secondary/80">Close</button>
    </div>
  </div>
);

const TODAY = new Date().toISOString().split('T')[0];

export const CAT_CFG = {
  A: { label: 'Cat A', color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',    desc: 'ASAP',       days: 0   },
  B: { label: 'Cat B', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40', desc: '3 Days',     days: 3   },
  C: { label: 'Cat C', color: 'text-primary',    bg: 'bg-primary/15',    border: 'border-primary/40',    desc: '10 Days',    days: 10  },
  D: { label: 'Cat D', color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   desc: '120 Days',   days: 120 },
};

export const STATUS_CFG = {
  open:          { label: 'Open',          color: 'text-foreground',   bg: 'bg-secondary'          },
  expiring_soon: { label: 'Expiring Soon', color: 'text-orange-400',   bg: 'bg-orange-500/15'      },
  expired:       { label: 'EXPIRED',       color: 'text-red-400',      bg: 'bg-red-500/15'         },
  cleared:       { label: 'Cleared ✓',     color: 'text-green-400',    bg: 'bg-green-500/15'       },
};

export function daysLeft(expiry) {
  if (!expiry) return null;
  return differenceInDays(parseISO(expiry), new Date());
}

export function computeStatus(item) {
  if (item.status === 'cleared') return 'cleared';
  const days = daysLeft(item.expiry_date);
  if (days === null) return item.status || 'open';
  if (days < 0) return 'expired';
  if (days <= 3) return 'expiring_soon';
  return 'open';
}

function CountdownBar({ item }) {
  const cat = CAT_CFG[item.category] || CAT_CFG.C;
  const totalDays = cat.days || 1;
  const days = daysLeft(item.expiry_date);
  if (days === null || item.computedStatus === 'cleared') return null;

  const elapsed = totalDays - Math.max(days, 0);
  const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  const barColor =
    days < 0    ? 'bg-red-500' :
    days <= 3   ? 'bg-orange-400' :
    days <= 10  ? 'bg-yellow-400' :
    'bg-green-500';

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[10px] font-bold">
        <span className="text-gray-500">Interval: {totalDays}d</span>
        <span className={days < 0 ? 'text-red-400' : days <= 3 ? 'text-orange-400' : 'text-gray-400'}>
          {days < 0 ? `${Math.abs(days)}d OVERDUE` : `${days}d remaining`}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MELCard({ item, onView, onClear }) {
  const cat = CAT_CFG[item.category] || CAT_CFG.C;
  const st = STATUS_CFG[item.computedStatus] || STATUS_CFG.open;
  const days = daysLeft(item.expiry_date);
  const urgent = item.computedStatus === 'expired' || item.computedStatus === 'expiring_soon';

  return (
    <div className={cn(
      'rounded-2xl bg-card border overflow-hidden transition-all hover:shadow-md',
      item.computedStatus === 'expired'       ? 'border-red-500/50 bg-red-900/5' :
      item.computedStatus === 'expiring_soon' ? 'border-orange-500/40 bg-orange-900/5' :
      item.computedStatus === 'cleared'       ? 'border-green-500/20 opacity-70' :
      'border-border'
    )}>
      <div className="px-4 py-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={cn('flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center', cat.bg)}>
              <Wrench className={cn('w-4 h-4', cat.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', cat.bg, cat.color)}>{cat.label} — {cat.desc}</span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', st.bg, st.color)}>{st.label}</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">{item.description}</p>
              <div className="flex flex-wrap gap-2 mt-0.5 text-[10px] text-muted-foreground">
                {item.aircraft_tail && (
                  <span className="flex items-center gap-1 font-mono font-bold text-foreground">
                    <Plane className="w-2.5 h-2.5" /> {item.aircraft_tail}
                  </span>
                )}
                {item.ata_chapter && <span>ATA {item.ata_chapter}</span>}
                {item.item_number && <span>Item {item.item_number}</span>}
                {item.logpage_number && <span>{item.logpage_number}</span>}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {days !== null && item.computedStatus !== 'cleared' && (
              <p className={cn('text-base font-black font-mono',
                days < 0 ? 'text-red-400' : days <= 3 ? 'text-orange-400' : days <= 10 ? 'text-yellow-400' : 'text-foreground')}>
                {days < 0 ? `+${Math.abs(days)}d` : `${days}d`}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">{item.expiry_date || '—'}</p>
          </div>
        </div>

        {/* Countdown bar */}
        <CountdownBar item={item} />

        {/* Restrictions */}
        {item.flight_restrictions && (
          <div className="mt-2 flex items-start gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-orange-300 leading-snug">{item.flight_restrictions}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button onClick={() => onView(item)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Eye className="w-3 h-3" /> Details
          </button>
          {item.computedStatus !== 'cleared' && (
            <button onClick={() => onClear(item)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">
              <CheckCircle className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Passenger Comfort MEL categories (IFE, Wi-Fi, Cabin) ──────────────────────
const COMFORT_ATA = ['23', '25', '33', '44', '45'];
const RESTRICTIVE_KEYWORDS = ['etops', 'dispatch', 'not dispatchable', 'ground', 'do not operate', 'flight restriction', 'cannot be deferred'];
const IFE_KEYWORDS = ['ife', 'entertainment', 'monitor', 'screen', 'seatback', 'video'];
const WIFI_KEYWORDS = ['wifi', 'wi-fi', 'internet', 'connectivity', 'router', 'ku-band', 'ka-band', 'satcom'];

function isComfort(item) {
  const desc = (item.description || '').toLowerCase();
  const ata = item.ata_chapter || '';
  return COMFORT_ATA.includes(ata) || IFE_KEYWORDS.some(k => desc.includes(k)) || WIFI_KEYWORDS.some(k => desc.includes(k));
}
function isIFE(item) {
  const desc = (item.description || '').toLowerCase();
  return IFE_KEYWORDS.some(k => desc.includes(k));
}
function isWifi(item) {
  const desc = (item.description || '').toLowerCase();
  return WIFI_KEYWORDS.some(k => desc.includes(k));
}
function isRestrictive(item) {
  const desc = (item.description || '').toLowerCase();
  const restrictions = (item.flight_restrictions || '').toLowerCase();
  return RESTRICTIVE_KEYWORDS.some(k => desc.includes(k) || restrictions.includes(k)) || item.category === 'A';
}

// ── AI MEL Intelligence Panel ──────────────────────────────────────────────────
function AiMelIntelligencePanel({ items }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const activeItems = items.filter(i => i.computedStatus !== 'cleared');
  const comfortItems = activeItems.filter(isComfort);
  const ifeItems = activeItems.filter(isIFE);
  const wifiItems = activeItems.filter(isWifi);
  const restrictiveItems = activeItems.filter(isRestrictive);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert aviation MEL (Minimum Equipment List) analyst specializing in passenger comfort systems and dispatch restrictions.

Analyze this MEL/NEF deferral data and provide concise, actionable AI recommendations:

TOTAL OPEN MELs: ${activeItems.length}
COMFORT-RELATED MELs (IFE/Wi-Fi/Cabin): ${comfortItems.length} items
IFE (Entertainment) MELs: ${ifeItems.length} items
Wi-Fi / Connectivity MELs: ${wifiItems.length} items
RESTRICTIVE MELs (may limit dispatch): ${restrictiveItems.length} items

COMFORT MEL DETAILS:
${comfortItems.slice(0,8).map(i => `- ${i.aircraft_tail || '?'} | ATA ${i.ata_chapter || '?'} | Cat ${i.category} | ${i.description?.slice(0,80)} | Expires: ${i.expiry_date || 'N/A'}`).join('\n')}

RESTRICTIVE MEL DETAILS:
${restrictiveItems.slice(0,5).map(i => `- ${i.aircraft_tail || '?'} | Cat ${i.category} | ${i.description?.slice(0,80)} | Restrictions: ${i.flight_restrictions || 'none stated'}`).join('\n')}

Provide JSON with:
1. comfort_recommendations: array of up to 4 objects with {tail, system, recommendation, priority ("HIGH"|"MEDIUM"|"LOW"), deferral_strategy}
2. wifi_updates: array of up to 3 objects with {tail, issue, update_window, revenue_impact}
3. restrictive_alerts: array of up to 4 objects with {tail, category, alert, dispatch_impact, urgency}
4. summary: one paragraph executive summary (2-3 sentences)
5. action_count: total recommended immediate actions (integer)`,
        response_json_schema: {
          type: 'object',
          properties: {
            comfort_recommendations: { type: 'array', items: { type: 'object', properties: { tail: { type: 'string' }, system: { type: 'string' }, recommendation: { type: 'string' }, priority: { type: 'string' }, deferral_strategy: { type: 'string' } } } },
            wifi_updates: { type: 'array', items: { type: 'object', properties: { tail: { type: 'string' }, issue: { type: 'string' }, update_window: { type: 'string' }, revenue_impact: { type: 'string' } } } },
            restrictive_alerts: { type: 'array', items: { type: 'object', properties: { tail: { type: 'string' }, category: { type: 'string' }, alert: { type: 'string' }, dispatch_impact: { type: 'string' }, urgency: { type: 'string' } } } },
            summary: { type: 'string' },
            action_count: { type: 'number' },
          }
        }
      });
      setResult(res);
      setExpanded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = { HIGH: 'text-red-400 bg-red-500/15 border-red-500/30', MEDIUM: 'text-amber-400 bg-amber-500/15 border-amber-500/30', LOW: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  const urgencyColor = { HIGH: 'text-red-400', MEDIUM: 'text-amber-400', LOW: 'text-emerald-400' };

  return (
    <div className="bg-card border border-violet-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-violet-500/10 border-b border-violet-500/20">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <p className="text-sm font-extrabold text-violet-300">AI MEL Intelligence</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">BETA</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-sky-400"><Smile className="w-3 h-3" /> {comfortItems.length} Comfort</span>
            <span className="flex items-center gap-1 text-cyan-400"><Wifi className="w-3 h-3" /> {wifiItems.length} Wi-Fi</span>
            <span className="flex items-center gap-1 text-red-400"><Shield className="w-3 h-3" /> {restrictiveItems.length} Restrictive</span>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-extrabold hover:bg-violet-500 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Analyzing…' : result ? 'Re-Analyze' : 'Run AI Analysis'}
          </button>
          {result && (
            <button onClick={() => setExpanded(e => !e)} className="text-violet-400 hover:text-violet-300">
              <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>

      {/* Quick category tiles (always visible) */}
      <div className="grid grid-cols-3 divide-x divide-border">
        {[
          { icon: Smile,   label: 'Passenger Comfort', value: comfortItems.length, color: 'text-sky-400',    sub: `${ifeItems.length} IFE · ${wifiItems.length} Wi-Fi` },
          { icon: Monitor, label: 'Entertainment',      value: ifeItems.length,    color: 'text-cyan-400',   sub: 'Seatback / IFE systems' },
          { icon: Shield,  label: 'Restrictive MELs',   value: restrictiveItems.length, color: restrictiveItems.length > 0 ? 'text-red-400' : 'text-muted-foreground', sub: 'Dispatch limiting' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="flex flex-col items-center py-3 px-2 text-center">
            <Icon className={cn('w-4 h-4 mb-1', color)} />
            <p className={cn('text-xl font-black', color)}>{value}</p>
            <p className="text-[10px] font-bold text-muted-foreground leading-tight">{label}</p>
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* AI Results */}
      {result && expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-violet-500/20 pt-4">
          {/* Summary */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
            <p className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest mb-1">AI Summary</p>
            <p className="text-xs text-slate-300 leading-relaxed">{result.summary}</p>
          </div>

          {/* Comfort Recommendations */}
          {result.comfort_recommendations?.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Smile className="w-3 h-3" /> Passenger Comfort Recommendations
              </p>
              <div className="space-y-2">
                {result.comfort_recommendations.map((r, i) => (
                  <div key={i} className="bg-secondary/50 border border-border rounded-xl px-3 py-2.5 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-extrabold text-primary">{r.tail}</span>
                      <span className="text-[10px] font-bold text-slate-400">{r.system}</span>
                      <span className={cn('text-[9px] font-extrabold px-2 py-0.5 rounded-full border', priorityColor[r.priority] || priorityColor.LOW)}>{r.priority}</span>
                    </div>
                    <p className="text-xs text-foreground">{r.recommendation}</p>
                    {r.deferral_strategy && <p className="text-[10px] text-muted-foreground italic">Strategy: {r.deferral_strategy}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wi-Fi Updates */}
          {result.wifi_updates?.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Wifi className="w-3 h-3" /> Wi-Fi / IFE Update Windows
              </p>
              <div className="space-y-2">
                {result.wifi_updates.map((w, i) => (
                  <div key={i} className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-primary">{w.tail}</span>
                        <span className="text-xs text-slate-300">{w.issue}</span>
                      </div>
                      <span className="text-[10px] font-bold text-cyan-400">{w.update_window}</span>
                    </div>
                    {w.revenue_impact && <p className="text-[10px] text-muted-foreground mt-1">Revenue impact: {w.revenue_impact}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restrictive MEL Alerts */}
          {result.restrictive_alerts?.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Restrictive MEL Dispatch Alerts
              </p>
              <div className="space-y-2">
                {result.restrictive_alerts.map((a, i) => (
                  <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-extrabold text-primary">{a.tail}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-700 text-white">Cat {a.category}</span>
                      <span className={cn('text-[10px] font-bold', urgencyColor[a.urgency] || urgencyColor.MEDIUM)}>{a.urgency} URGENCY</span>
                    </div>
                    <p className="text-xs text-foreground">{a.alert}</p>
                    {a.dispatch_impact && <p className="text-[10px] text-red-300 font-bold">⚠ {a.dispatch_impact}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="px-4 py-3 text-center text-[11px] text-muted-foreground">
          Click <span className="font-bold text-violet-400">Run AI Analysis</span> for passenger comfort MEL recommendations, Wi-Fi/IFE updates, and restrictive MEL dispatch alerts.
        </div>
      )}
    </div>
  );
}

export default function MELDashboard() {
  const [showNew, setShowNew] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [station, setStation] = useState('All Stations');
  const qc = useQueryClient();

  const { data: items = [], refetch, isLoading } = useQuery({
    queryKey: ['mel-items'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 200),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['mel-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MELItem.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mel-items'] }); setShowNew(false); },
  });

  const clearMutation = useMutation({
    mutationFn: ({ id, clearedBy }) => base44.entities.MELItem.update(id, {
      status: 'cleared', cleared_date: TODAY, cleared_by: clearedBy || 'Ops'
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mel-items'] }); setDetailItem(null); },
  });

  const alertMutation = useMutation({
    mutationFn: () => base44.functions.invoke('melAlertCheck', {}),
  });

  // Build tail→station map from aircraft data
  const tailToStation = aircraft.reduce((acc, a) => {
    if (a.tail_number && a.base_station) acc[a.tail_number] = a.base_station;
    return acc;
  }, {});

  const stationFilter = station === 'All Stations' ? null : station;

  const enriched = items
    .map(i => ({ ...i, computedStatus: computeStatus(i) }))
    .filter(i => !stationFilter || tailToStation[i.aircraft_tail] === stationFilter || i.station === stationFilter);

  const expired  = enriched.filter(i => i.computedStatus === 'expired').length;
  const expiring = enriched.filter(i => i.computedStatus === 'expiring_soon').length;
  const open     = enriched.filter(i => i.computedStatus === 'open').length;
  const cleared  = enriched.filter(i => i.computedStatus === 'cleared').length;

  const FILTERS = [
    { key: 'all',          label: `All Open (${open + expired + expiring})` },
    { key: 'expired',      label: `Expired (${expired})` },
    { key: 'expiring_soon',label: `Expiring (${expiring})` },
    { key: 'cleared',      label: `Cleared (${cleared})` },
  ];

  const filtered = enriched.filter(i => {
    const matchFilter =
      filter === 'all'     ? i.computedStatus !== 'cleared' :
      filter === 'cleared' ? i.computedStatus === 'cleared' :
      i.computedStatus === filter;
    const matchCat = catFilter === 'all' || i.category === catFilter;
    const matchSearch = !search ||
      i.aircraft_tail?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase()) ||
      i.ata_chapter?.toLowerCase().includes(search.toLowerCase()) ||
      i.item_number?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchCat && matchSearch;
  });

  // Sort: expired first, then expiring, then by days remaining
  const sorted = [...filtered].sort((a, b) => {
    const order = { expired: 0, expiring_soon: 1, open: 2, cleared: 3 };
    const ao = order[a.computedStatus] ?? 2;
    const bo = order[b.computedStatus] ?? 2;
    if (ao !== bo) return ao - bo;
    return (daysLeft(a.expiry_date) ?? 999) - (daysLeft(b.expiry_date) ?? 999);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Wrench className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">MEL TRACKER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Deferrals · Countdown · Alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => alertMutation.mutate()}
              title="Run alert check"
              className={cn('flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors',
                alertMutation.isPending ? 'border-primary/40 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              <Bell className={cn('w-3.5 h-3.5', alertMutation.isPending && 'animate-pulse')} />
              <span className="hidden sm:inline">{alertMutation.isPending ? 'Checking…' : 'Alerts'}</span>
            </button>
            <button onClick={refetch} className="w-8 h-8 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New MEL
            </button>
          </div>
        </div>

        {/* Alert banner */}
        {(expired > 0 || expiring > 0) && (
          <div className={cn(
            'mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
            expired > 0
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
          )}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {expired > 0
              ? `${expired} MEL item${expired > 1 ? 's' : ''} EXPIRED — affected aircraft may not be dispatchable`
              : `${expiring} MEL item${expiring > 1 ? 's' : ''} expiring within 3 days — action required`}
          </div>
        )}
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open',     value: open,     color: 'text-foreground',   key: 'all'           },
            { label: 'Expiring', value: expiring, color: expiring > 0 ? 'text-orange-400' : 'text-muted-foreground', key: 'expiring_soon' },
            { label: 'Expired',  value: expired,  color: expired  > 0 ? 'text-red-400'    : 'text-muted-foreground', key: 'expired'       },
            { label: 'Cleared',  value: cleared,  color: 'text-green-400',    key: 'cleared'       },
          ].map(({ label, value, color, key }) => (
            <button key={label} onClick={() => setFilter(key)}
              className={cn('rounded-2xl border px-4 py-3 text-left transition-all hover:border-primary/40',
                filter === key ? 'border-primary/60 bg-primary/5' : 'border-border bg-card')}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-black font-mono mt-0.5', color)}>{value}</p>
            </button>
          ))}
        </div>

        {/* Station + Search + filters */}
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <select value={station} onChange={e => setStation(e.target.value)}
            className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary font-bold">
            {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tail, ATA, description…"
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="relative">
            <button onClick={() => setShowCatFilter(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              <Filter className="w-3.5 h-3.5" />
              {catFilter !== 'all' ? `Cat ${catFilter}` : 'Cat'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showCatFilter && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowCatFilter(false)} />
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden z-30 shadow-xl min-w-[140px]">
                  <button onClick={() => { setCatFilter('all'); setShowCatFilter(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary">All Categories</button>
                  {Object.entries(CAT_CFG).map(([k, v]) => (
                    <button key={k} onClick={() => { setCatFilter(k); setShowCatFilter(false); }}
                      className={cn('w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-secondary', v.color)}>
                      {v.label} — {v.desc}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn('whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0',
                filter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-secondary')}>
              {f.label}
            </button>
          ))}
        </div>

        {/* AI MEL Intelligence Panel */}
        <AiMelIntelligencePanel items={enriched} />

        {/* Items */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12 text-sm">Loading MEL items…</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border px-4 py-12 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-green-500/30 mx-auto" />
            <p className="text-sm font-bold text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(item => (
              <MELCard
                key={item.id}
                item={item}
                onView={setDetailItem}
                onClear={(item) => {
                  const who = window.prompt('Cleared by (name / ID):');
                  if (who !== null) clearMutation.mutate({ id: item.id, clearedBy: who });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <MELNewModal
          aircraft={aircraft}
          onSave={(d) => createMutation.mutate(d)}
          onClose={() => setShowNew(false)}
          isPending={createMutation.isPending}
        />
      )}

      {detailItem && (
        <MELDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onClear={(id, clearedBy) => clearMutation.mutate({ id, clearedBy })}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['mel-items'] })}
        />
      )}
    </div>
  );
}