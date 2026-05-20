import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Globe, AlertTriangle, CheckCircle, RefreshCw, ChevronLeft,
  Shield, Plane, TrendingDown, Eye, Lock, Zap, Radio, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── ETOPS certification tiers per aircraft family ───────────────────────────
const getMaxETOPS = (acType = '') => {
  if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) return 370;
  if (['B737 MAX', 'A320', 'A321', 'B767'].some(t => acType.includes(t))) return 180;
  if (['B737-800', 'B737-900', 'B757'].some(t => acType.includes(t))) return 120;
  return 0;
};

const ETOPS_CFG = {
  370: { label: 'ETOPS-370', short: '370', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  180: { label: 'ETOPS-180', short: '180', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/40' },
  120: { label: 'ETOPS-120', short: '120', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/40' },
  0:   { label: 'NON-ETOPS', short: 'N/A', color: 'text-red-400',  bg: 'bg-red-500/15',  border: 'border-red-500/40'  },
};

// ── CAT approval config ─────────────────────────────────────────────────────
const CAT_CFG = {
  'CAT IIIc': { color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40', risk: false },
  'CAT IIIb': { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/40', risk: false },
  'CAT IIIa': { color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/40', risk: false },
  'CAT II':   { color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', risk: false },
  'CAT I':    { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40', risk: true },
};

const getMaxCAT = (acType = '') => {
  if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) return 'CAT IIIc';
  if (['B737 MAX', 'A320', 'A321'].some(t => acType.includes(t))) return 'CAT IIIb';
  if (['B737-800', 'B737-900', 'B757', 'B767'].some(t => acType.includes(t))) return 'CAT IIIa';
  return 'CAT II';
};

const CAT_RANK = { 'CAT IIIc': 5, 'CAT IIIb': 4, 'CAT IIIa': 3, 'CAT II': 2, 'CAT I': 1 };

function RiskBadge({ level }) {
  if (level === 'critical') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-extrabold animate-pulse">
      <AlertTriangle className="w-2.5 h-2.5" /> CRITICAL
    </span>
  );
  if (level === 'warning') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-extrabold">
      <AlertTriangle className="w-2.5 h-2.5" /> AT RISK
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-600/30 text-green-400 text-[9px] font-extrabold border border-green-500/30">
      <CheckCircle className="w-2.5 h-2.5" /> OK
    </span>
  );
}

// ── ETOPS Card ───────────────────────────────────────────────────────────────
function ETOPSCard({ aircraft, melItems }) {
  const maxEtops = getMaxETOPS(aircraft.aircraft_type);
  const currentEtops = aircraft.etops_approval ?? maxEtops;
  const cfg = ETOPS_CFG[currentEtops] ?? ETOPS_CFG[0];
  const isDowngraded = maxEtops > 0 && currentEtops < maxEtops;
  const isNonEtops = currentEtops === 0 || maxEtops === 0;
  const riskMels = melItems.filter(m => m.aircraft_tail === aircraft.tail_number &&
    (m.status === 'open' || m.status === 'deferred') &&
    (m.flight_restrictions?.includes('ETOPS') || m.mel_reference?.includes('ETOPS')));
  const riskLevel = isNonEtops ? 'critical' : isDowngraded ? 'critical' : riskMels.length > 0 ? 'warning' : 'ok';

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3 bg-card transition-all hover:brightness-110',
      riskLevel === 'critical' ? 'border-red-500/60 bg-red-950/10' :
      riskLevel === 'warning'  ? 'border-amber-500/50 bg-amber-950/10' :
      cfg.border
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-extrabold text-primary font-mono">{aircraft.tail_number}</p>
          <p className="text-[10px] text-muted-foreground">{aircraft.aircraft_type}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>{cfg.label}</span>
          <RiskBadge level={riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Max Certified</p>
          <p className="font-bold text-foreground">{maxEtops > 0 ? `${maxEtops} min` : 'N/A'}</p>
        </div>
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Current Approval</p>
          <p className={cn('font-bold', isDowngraded ? 'text-red-400' : 'text-foreground')}>
            {currentEtops > 0 ? `${currentEtops} min` : 'NONE'}
          </p>
        </div>
      </div>

      {isDowngraded && (
        <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          <TrendingDown className="w-3 h-3 flex-shrink-0" />
          <span>Downgraded from ETOPS-{maxEtops} · Restricted routing</span>
        </div>
      )}

      {riskMels.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{riskMels.length} open MEL{riskMels.length > 1 ? 's' : ''} affecting ETOPS</span>
        </div>
      )}

      {aircraft.engine_type && (
        <p className="text-[10px] text-muted-foreground truncate">🔧 {aircraft.engine_type}</p>
      )}
    </div>
  );
}

// ── CAT / RVSM Card ──────────────────────────────────────────────────────────
function CATCard({ aircraft, melItems }) {
  const maxCat = getMaxCAT(aircraft.aircraft_type);
  const currentCat = aircraft.cat_approval || maxCat;
  const cfg = CAT_CFG[currentCat] ?? CAT_CFG['CAT I'];
  const isDowngraded = CAT_RANK[currentCat] < CAT_RANK[maxCat];
  const rvsmOk = aircraft.rvsm_approved !== false;

  const riskMels = melItems.filter(m => m.aircraft_tail === aircraft.tail_number &&
    (m.status === 'open' || m.status === 'deferred') &&
    (m.flight_restrictions?.includes('CAT') || m.flight_restrictions?.includes('ILS') ||
     m.flight_restrictions?.includes('RVSM')));

  const riskLevel = isDowngraded ? 'critical' : !rvsmOk ? 'critical' : riskMels.length > 0 ? 'warning' : 'ok';

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3 bg-card transition-all hover:brightness-110',
      riskLevel === 'critical' ? 'border-red-500/60 bg-red-950/10' :
      riskLevel === 'warning'  ? 'border-amber-500/50 bg-amber-950/10' :
      cfg.border
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-extrabold text-primary font-mono">{aircraft.tail_number}</p>
          <p className="text-[10px] text-muted-foreground">{aircraft.aircraft_type}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>{currentCat}</span>
          <RiskBadge level={riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Max CAT</p>
          <p className="font-bold text-foreground">{maxCat}</p>
        </div>
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Current</p>
          <p className={cn('font-bold', isDowngraded ? 'text-red-400' : 'text-foreground')}>{currentCat}</p>
        </div>
        <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">RVSM</p>
          <p className={cn('font-bold', rvsmOk ? 'text-green-400' : 'text-red-400')}>{rvsmOk ? 'APVD' : 'N/O'}</p>
        </div>
      </div>

      {isDowngraded && (
        <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          <TrendingDown className="w-3 h-3 flex-shrink-0" />
          <span>Downgraded from {maxCat} · Low-vis ops restricted</span>
        </div>
      )}

      {!rvsmOk && (
        <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          <Radio className="w-3 h-3 flex-shrink-0" />
          <span>RVSM NOT APPROVED · FL290–FL410 restricted</span>
        </div>
      )}

      {riskMels.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{riskMels.length} open MEL{riskMels.length > 1 ? 's' : ''} affecting CAT/RVSM ops</span>
        </div>
      )}
    </div>
  );
}

// ── Risk Summary Strip ───────────────────────────────────────────────────────
function RiskStrip({ label, icon: Icon, value, subLabel, color }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <p className={cn('text-3xl font-black font-mono leading-none', color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{subLabel}</p>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'etops', label: '🌍 ETOPS', icon: Globe },
  { id: 'cat',   label: '🛡️ CAT II/RVSM', icon: Shield },
  { id: 'risks', label: '🚨 At-Risk Fleet', icon: AlertTriangle },
];

export default function ETOPSMonitor() {
  const [activeTab, setActiveTab] = useState('etops');
  const [filter, setFilter] = useState('all');
  const qc = useQueryClient();

  const { data: aircraft = [] , isLoading } = useQuery({
    queryKey: ['etops-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['etops-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 500),
    refetchInterval: 60000,
  });

  // ── Compute risk classifications ─────────────────────────────────────────
  const etopsDowngraded = aircraft.filter(a => {
    const max = getMaxETOPS(a.aircraft_type);
    return max > 0 && (a.etops_approval ?? max) < max;
  });

  const catDowngraded = aircraft.filter(a => {
    const max = getMaxCAT(a.aircraft_type);
    const cur = a.cat_approval || max;
    return CAT_RANK[cur] < CAT_RANK[max];
  });

  const rvsmNonApproved = aircraft.filter(a => a.rvsm_approved === false);

  const atRiskFleet = aircraft.filter(a => {
    const tailMels = melItems.filter(m => m.aircraft_tail === a.tail_number &&
      (m.status === 'open' || m.status === 'deferred'));
    const hasEtopsRisk = tailMels.some(m =>
      m.flight_restrictions?.includes('ETOPS') || m.mel_reference?.includes('ETOPS'));
    const hasCatRisk = tailMels.some(m =>
      m.flight_restrictions?.includes('CAT') || m.flight_restrictions?.includes('ILS') ||
      m.flight_restrictions?.includes('RVSM'));
    const isEtopsDg = (() => { const max = getMaxETOPS(a.aircraft_type); return max > 0 && (a.etops_approval ?? max) < max; })();
    const isCatDg = (() => { const max = getMaxCAT(a.aircraft_type); const cur = a.cat_approval || max; return CAT_RANK[cur] < CAT_RANK[max]; })();
    return isEtopsDg || isCatDg || a.rvsm_approved === false || hasEtopsRisk || hasCatRisk;
  });

  // ── Filter helpers ───────────────────────────────────────────────────────
  const filteredEtops = aircraft.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'downgraded') {
      const max = getMaxETOPS(a.aircraft_type);
      return max > 0 && (a.etops_approval ?? max) < max;
    }
    if (filter === 'non') return getMaxETOPS(a.aircraft_type) === 0;
    if (filter === 'ok') {
      const max = getMaxETOPS(a.aircraft_type);
      return max > 0 && (a.etops_approval ?? max) === max;
    }
    return true;
  });

  const filteredCat = aircraft.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'downgraded') {
      const max = getMaxCAT(a.aircraft_type);
      return CAT_RANK[a.cat_approval || max] < CAT_RANK[max];
    }
    if (filter === 'rvsm') return a.rvsm_approved === false;
    if (filter === 'ok') {
      const max = getMaxCAT(a.aircraft_type);
      return (a.cat_approval || max) === max && a.rvsm_approved !== false;
    }
    return true;
  });

  const etopsFilters = [
    { key: 'all', label: 'All' },
    { key: 'ok', label: '✅ Fully Certified' },
    { key: 'downgraded', label: `⚠️ Downgraded (${etopsDowngraded.length})` },
    { key: 'non', label: '🚫 Non-ETOPS' },
  ];

  const catFilters = [
    { key: 'all', label: 'All' },
    { key: 'ok', label: '✅ Full CAT' },
    { key: 'downgraded', label: `⚠️ Downgraded (${catDowngraded.length})` },
    { key: 'rvsm', label: `📡 RVSM N/O (${rvsmNonApproved.length})` },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/ETOPSMonitor" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">AIRCRAFT QUALIFICATIONS</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">ETOPS · CAT II/IIIa/b/c · RVSM · Risk Monitoring</p>
            </div>
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['etops-aircraft', 'etops-mel'] })}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RiskStrip label="Fleet Total" icon={Plane} value={aircraft.length} subLabel="Tracked aircraft" color="text-foreground" />
          <RiskStrip label="ETOPS Downgraded" icon={Globe} value={etopsDowngraded.length} subLabel="Below max certification" color={etopsDowngraded.length > 0 ? 'text-red-400' : 'text-green-400'} />
          <RiskStrip label="CAT Downgraded" icon={Shield} value={catDowngraded.length} subLabel="Below max CAT approval" color={catDowngraded.length > 0 ? 'text-red-400' : 'text-green-400'} />
          <RiskStrip label="At-Risk Aircraft" icon={AlertTriangle} value={atRiskFleet.length} subLabel="MEL or downgrade risk" color={atRiskFleet.length > 0 ? 'text-amber-400' : 'text-green-400'} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => { setActiveTab(id); setFilter('all'); }}
              className={cn('px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── ETOPS Tab ── */}
        {activeTab === 'etops' && (
          <>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {etopsFilters.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                    filter === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                  {label}
                </button>
              ))}
            </div>
            {etopsDowngraded.length > 0 && filter !== 'ok' && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/10 px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-red-400">⚠️ {etopsDowngraded.length} aircraft below max ETOPS certification</p>
                  <p className="text-xs text-red-300/70 mt-0.5">Affected tails: {etopsDowngraded.map(a => a.tail_number).join(', ')}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredEtops.map(a => (
                <ETOPSCard key={a.id} aircraft={a} melItems={melItems} />
              ))}
            </div>
          </>
        )}

        {/* ── CAT/RVSM Tab ── */}
        {activeTab === 'cat' && (
          <>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {catFilters.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                    filter === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                  {label}
                </button>
              ))}
            </div>
            {(catDowngraded.length > 0 || rvsmNonApproved.length > 0) && filter !== 'ok' && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/10 px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  {catDowngraded.length > 0 && (
                    <p className="text-sm font-extrabold text-red-400">⚠️ {catDowngraded.length} aircraft below max CAT approval — low-vis ops restricted</p>
                  )}
                  {rvsmNonApproved.length > 0 && (
                    <p className="text-sm font-extrabold text-orange-400">📡 {rvsmNonApproved.length} aircraft RVSM not approved — FL290–FL410 restricted</p>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredCat.map(a => (
                <CATCard key={a.id} aircraft={a} melItems={melItems} />
              ))}
            </div>
          </>
        )}

        {/* ── At-Risk Tab ── */}
        {activeTab === 'risks' && (
          <>
            {atRiskFleet.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <CheckCircle className="w-14 h-14 text-green-500" />
                <p className="text-lg font-extrabold text-green-400">All Clear</p>
                <p className="text-sm text-muted-foreground">No aircraft at certification risk</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-amber-500/40 bg-amber-900/10 px-4 py-3 flex items-start gap-3">
                  <Eye className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold text-amber-400">{atRiskFleet.length} aircraft require attention</p>
                    <p className="text-xs text-amber-300/70 mt-0.5">Downgraded qualifications, MEL conflicts, or RVSM status issues</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {atRiskFleet.map(a => {
                    const maxEtops = getMaxETOPS(a.aircraft_type);
                    const curEtops = a.etops_approval ?? maxEtops;
                    const etopsDg = maxEtops > 0 && curEtops < maxEtops;
                    const maxCat = getMaxCAT(a.aircraft_type);
                    const curCat = a.cat_approval || maxCat;
                    const catDg = CAT_RANK[curCat] < CAT_RANK[maxCat];
                    const noRvsm = a.rvsm_approved === false;
                    const tailMels = melItems.filter(m => m.aircraft_tail === a.tail_number && (m.status === 'open' || m.status === 'deferred'));

                    return (
                      <div key={a.id} className="rounded-2xl border border-amber-500/40 bg-card p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-base font-extrabold text-primary font-mono">{a.tail_number}</p>
                            <p className="text-xs text-muted-foreground">{a.aircraft_type} · {a.base_station || '—'}</p>
                          </div>
                          <span className={cn('text-xs px-2 py-1 rounded-lg font-bold',
                            a.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            a.status === 'oos' ? 'bg-red-500/20 text-red-400' :
                            'bg-orange-500/20 text-orange-400')}>
                            {a.status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {etopsDg && (
                            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-2 text-xs text-red-400">
                              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                              <div>
                                <p className="font-extrabold">ETOPS DOWNGRADED</p>
                                <p className="text-[10px] text-red-300/70">{curEtops > 0 ? `${curEtops} min` : 'NONE'} (max: {maxEtops} min)</p>
                              </div>
                            </div>
                          )}
                          {catDg && (
                            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-2 text-xs text-red-400">
                              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                              <div>
                                <p className="font-extrabold">CAT DOWNGRADED</p>
                                <p className="text-[10px] text-red-300/70">{curCat} (max: {maxCat})</p>
                              </div>
                            </div>
                          )}
                          {noRvsm && (
                            <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-500/30 rounded-lg px-2.5 py-2 text-xs text-orange-400">
                              <Radio className="w-3.5 h-3.5 flex-shrink-0" />
                              <div>
                                <p className="font-extrabold">RVSM N/O</p>
                                <p className="text-[10px] text-orange-300/70">FL290–FL410 blocked</p>
                              </div>
                            </div>
                          )}
                          {tailMels.length > 0 && (
                            <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-500/30 rounded-lg px-2.5 py-2 text-xs text-amber-400">
                              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                              <div>
                                <p className="font-extrabold">{tailMels.length} OPEN MEL{tailMels.length > 1 ? 'S' : ''}</p>
                                <p className="text-[10px] text-amber-300/70">May affect approvals</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}