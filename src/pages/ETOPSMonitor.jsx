import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Globe, AlertTriangle, CheckCircle, RefreshCw, ChevronLeft,
  Shield, Plane, TrendingDown, Eye, Zap, Radio, Activity,
  ChevronDown, ChevronUp, X, Clock, ArrowDown, ArrowUp, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RVSMSystemMatrix, { computeApprovalImpact, getDispatchImpact, RVSM_SYSTEMS } from '@/components/etops/RVSMSystemMatrix';
import RVSMMonitoringProgram from '@/components/etops/RVSMMonitoringProgram';

// ── ETOPS certification tiers ────────────────────────────────────────────────
const getMaxETOPS = (acType = '') => {
  if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) return 370;
  if (['B737 MAX', 'A320', 'A321', 'B767'].some(t => acType.includes(t))) return 180;
  if (['B737-800', 'B737-900', 'B757'].some(t => acType.includes(t))) return 120;
  return 0;
};

const ETOPS_CFG = {
  370: { label: 'ETOPS-370', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  180: { label: 'ETOPS-180', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/40' },
  120: { label: 'ETOPS-120', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/40' },
  0:   { label: 'NON-ETOPS', color: 'text-red-400',  bg: 'bg-red-500/15',  border: 'border-red-500/40'  },
};

const CAT_CFG = {
  'CAT IIIc': { color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  'CAT IIIb': { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/40' },
  'CAT IIIa': { color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/40' },
  'CAT II':   { color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40' },
  'CAT I':    { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40' },
};

export const CAT_RANK = { 'CAT IIIc': 5, 'CAT IIIb': 4, 'CAT IIIa': 3, 'CAT II': 2, 'CAT I': 1 };

const getMaxCAT = (acType = '') => {
  if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) return 'CAT IIIc';
  if (['B737 MAX', 'A320', 'A321'].some(t => acType.includes(t))) return 'CAT IIIb';
  if (['B737-800', 'B737-900', 'B757', 'B767'].some(t => acType.includes(t))) return 'CAT IIIa';
  return 'CAT II';
};

// ── Risk Badge ───────────────────────────────────────────────────────────────
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

// ── KPI Strip Card ───────────────────────────────────────────────────────────
function KpiCard({ label, icon: Icon, value, subLabel, color }) {
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
      riskLevel === 'warning'  ? 'border-amber-500/50 bg-amber-950/10' : cfg.border
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
          <p className="text-muted-foreground">Current</p>
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

// ── Enhanced CAT / RVSM Card ─────────────────────────────────────────────────
function CATRVSMCard({ aircraft, melItems, onExpand, expanded }) {
  const maxCat = getMaxCAT(aircraft.aircraft_type);
  const { catDowngradeLevel, rvsmBlock, reasons } = computeApprovalImpact(melItems, aircraft);

  // Compute effective CAT: worst of stored value vs MEL-derived downgrade
  const storedCat = aircraft.cat_approval || maxCat;
  const melCat = catDowngradeLevel;
  const effectiveCat = (() => {
    if (!melCat) return storedCat;
    return CAT_RANK[melCat] < CAT_RANK[storedCat] ? melCat : storedCat;
  })();

  const isDowngraded = CAT_RANK[effectiveCat] < CAT_RANK[maxCat];
  const rvsmOk = aircraft.rvsm_approved !== false && !rvsmBlock;
  const dispatchImpacts = getDispatchImpact(isDowngraded ? effectiveCat : null, !rvsmOk);
  const catCfg = CAT_CFG[effectiveCat] ?? CAT_CFG['CAT I'];

  const riskLevel = isDowngraded ? 'critical' : !rvsmOk ? 'critical' : reasons.length > 0 ? 'warning' : 'ok';

  return (
    <div className={cn('rounded-2xl border bg-card transition-all',
      riskLevel === 'critical' ? 'border-red-500/60 bg-red-950/10' :
      riskLevel === 'warning'  ? 'border-amber-500/50 bg-amber-950/10' :
      catCfg.border
    )}>
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-extrabold text-primary font-mono">{aircraft.tail_number}</p>
            <p className="text-[10px] text-muted-foreground">{aircraft.aircraft_type}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', catCfg.bg, catCfg.color, catCfg.border)}>
              {effectiveCat}
            </span>
            <RiskBadge level={riskLevel} />
          </div>
        </div>

        {/* 3-column status grid */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
            <p className="text-muted-foreground">Max CAT</p>
            <p className="font-bold text-foreground">{maxCat}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
            <p className="text-muted-foreground">Effective</p>
            <p className={cn('font-bold', isDowngraded ? 'text-red-400' : 'text-foreground')}>{effectiveCat}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
            <p className="text-muted-foreground">RVSM</p>
            <p className={cn('font-bold', rvsmOk ? 'text-green-400' : 'text-red-400')}>{rvsmOk ? 'APVD' : 'N/O'}</p>
          </div>
        </div>

        {/* MEL-derived downgrade alert */}
        {melCat && (
          <div className="flex items-start gap-2 text-[10px] text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-2">
            <ArrowDown className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">AUTO-DOWNGRADE: MEL → {melCat}</p>
              <p className="text-red-300/70 mt-0.5">
                {reasons.filter(r => r.type === 'cat' || r.type === 'both').map(r => r.text.split(':')[0]).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* RVSM MEL block alert */}
        {rvsmBlock && (
          <div className="flex items-start gap-2 text-[10px] text-orange-400 bg-orange-900/20 border border-orange-500/30 rounded-lg px-2.5 py-2">
            <Radio className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">RVSM N/O — MEL-triggered</p>
              <p className="text-orange-300/70 mt-0.5">
                {reasons.filter(r => r.type === 'rvsm' || r.type === 'both').map(r => r.text.split(':')[0]).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Dispatch impact strip */}
        {dispatchImpacts.length > 0 && (
          <div className="space-y-1">
            {dispatchImpacts.map((impact, i) => (
              <div key={i} className={cn('flex items-start gap-2 text-[10px] rounded-lg px-2.5 py-1.5',
                impact.severity === 'critical'
                  ? 'bg-red-900/15 border border-red-500/25 text-red-300'
                  : 'bg-amber-900/15 border border-amber-500/25 text-amber-300'
              )}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{impact.text}</p>
                  <p className="text-[9px] opacity-70 mt-0.5">{impact.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expand/collapse system matrix */}
        <button
          onClick={() => onExpand(aircraft.tail_number)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary/30 border border-white/8 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide' : 'Show'} System Matrix ({RVSM_SYSTEMS.length} systems)
        </button>
      </div>

      {/* System matrix expansion */}
      {expanded && (
        <div className="border-t border-white/8 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-xs font-extrabold text-foreground">RVSM / CAT System Health Matrix</p>
          </div>
          <RVSMSystemMatrix aircraft={aircraft} melItems={melItems} impactReasons={reasons} />
        </div>
      )}
    </div>
  );
}

// ── At-Risk Row ───────────────────────────────────────────────────────────────
function AtRiskRow({ aircraft, melItems }) {
  const maxEtops = getMaxETOPS(aircraft.aircraft_type);
  const curEtops = aircraft.etops_approval ?? maxEtops;
  const etopsDg = maxEtops > 0 && curEtops < maxEtops;
  const maxCat = getMaxCAT(aircraft.aircraft_type);

  const { catDowngradeLevel, rvsmBlock, reasons } = computeApprovalImpact(melItems, aircraft);
  const storedCat = aircraft.cat_approval || maxCat;
  const effectiveCat = catDowngradeLevel && CAT_RANK[catDowngradeLevel] < CAT_RANK[storedCat] ? catDowngradeLevel : storedCat;
  const catDg = CAT_RANK[effectiveCat] < CAT_RANK[maxCat];
  const noRvsm = aircraft.rvsm_approved === false || rvsmBlock;
  const tailMels = melItems.filter(m => m.aircraft_tail === aircraft.tail_number && (m.status === 'open' || m.status === 'deferred'));
  const dispatchImpacts = getDispatchImpact(catDg ? effectiveCat : null, noRvsm);

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-extrabold text-primary font-mono">{aircraft.tail_number}</p>
          <p className="text-xs text-muted-foreground">{aircraft.aircraft_type} · {aircraft.base_station || '—'}</p>
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-lg font-bold',
          aircraft.status === 'active' ? 'bg-green-500/20 text-green-400' :
          aircraft.status === 'oos' ? 'bg-red-500/20 text-red-400' :
          'bg-orange-500/20 text-orange-400')}>
          {aircraft.status?.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {etopsDg && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-2 text-xs text-red-400">
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold">ETOPS DOWNGRADED</p>
              <p className="text-[10px] text-red-300/70">{curEtops > 0 ? `${curEtops} min` : 'NONE'} / max {maxEtops} min</p>
            </div>
          </div>
        )}
        {catDg && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-2.5 py-2 text-xs text-red-400">
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold">CAT DOWNGRADED</p>
              <p className="text-[10px] text-red-300/70">{effectiveCat} (max: {maxCat}){catDowngradeLevel ? ' · MEL auto-dg' : ''}</p>
            </div>
          </div>
        )}
        {noRvsm && (
          <div className="flex items-center gap-2 bg-orange-900/20 border border-orange-500/30 rounded-lg px-2.5 py-2 text-xs text-orange-400">
            <Radio className="w-3.5 h-3.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold">RVSM N/O{rvsmBlock ? ' (MEL)' : ''}</p>
              <p className="text-[10px] text-orange-300/70">FL290–FL410 blocked</p>
            </div>
          </div>
        )}
        {tailMels.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-500/30 rounded-lg px-2.5 py-2 text-xs text-amber-400">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold">{tailMels.length} OPEN MEL{tailMels.length > 1 ? 'S' : ''}</p>
              <p className="text-[10px] text-amber-300/70">{reasons.length > 0 ? `${reasons.length} affect qual` : 'May affect approvals'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dispatch impacts */}
      {dispatchImpacts.length > 0 && (
        <div className="space-y-1">
          {dispatchImpacts.map((impact, i) => (
            <div key={i} className={cn('text-[10px] rounded-lg px-2.5 py-1.5 font-bold',
              impact.severity === 'critical' ? 'bg-red-900/20 text-red-300' : 'bg-amber-900/20 text-amber-300'
            )}>
              ⚡ {impact.text}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Link to={`/TechOpsLogbook?tail=${aircraft.tail_number}`}
          className="flex-1 text-center py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-[10px] font-bold text-primary hover:bg-primary/25 transition-colors">
          Open E-Logbook
        </Link>
        <Link to="/MEL"
          className="flex-1 text-center py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 hover:bg-amber-500/20 transition-colors">
          Review MELs
        </Link>
      </div>
    </div>
  );
}

// ── MAIN ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'etops',   label: '🌍 ETOPS',          icon: Globe },
  { id: 'cat',     label: '🛡️ CAT II/RVSM',     icon: Shield },
  { id: 'matrix',  label: '⚙️ System Matrix',   icon: Activity },
  { id: 'program', label: '📋 Monitoring Prog.',icon: Clock },
  { id: 'risks',   label: '🚨 At-Risk Fleet',   icon: AlertTriangle },
];

export default function ETOPSMonitor() {
  const [activeTab, setActiveTab] = useState('etops');
  const [filter, setFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState({});
  const [matrixTail, setMatrixTail] = useState(null);
  const qc = useQueryClient();

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['etops-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['etops-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const toggleExpand = (tail) => setExpandedCards(p => ({ ...p, [tail]: !p[tail] }));

  // ── Fleet-wide risk computation ──────────────────────────────────────────
  const etopsDowngraded = aircraft.filter(a => {
    const max = getMaxETOPS(a.aircraft_type);
    return max > 0 && (a.etops_approval ?? max) < max;
  });

  const catDowngradedList = aircraft.filter(a => {
    const max = getMaxCAT(a.aircraft_type);
    const { catDowngradeLevel } = computeApprovalImpact(melItems, a);
    const stored = a.cat_approval || max;
    const eff = catDowngradeLevel && CAT_RANK[catDowngradeLevel] < CAT_RANK[stored] ? catDowngradeLevel : stored;
    return CAT_RANK[eff] < CAT_RANK[max];
  });

  const rvsmNonApproved = aircraft.filter(a => {
    const { rvsmBlock } = computeApprovalImpact(melItems, a);
    return a.rvsm_approved === false || rvsmBlock;
  });

  const atRiskFleet = aircraft.filter(a => {
    const tailMels = melItems.filter(m => m.aircraft_tail === a.tail_number && (m.status === 'open' || m.status === 'deferred'));
    const { catDowngradeLevel, rvsmBlock, reasons } = computeApprovalImpact(melItems, a);
    const hasEtopsRisk = tailMels.some(m => m.flight_restrictions?.includes('ETOPS') || m.mel_reference?.includes('ETOPS'));
    const isEtopsDg = (() => { const max = getMaxETOPS(a.aircraft_type); return max > 0 && (a.etops_approval ?? max) < max; })();
    return isEtopsDg || !!catDowngradeLevel || a.rvsm_approved === false || rvsmBlock || hasEtopsRisk;
  });

  // ── Filters ──────────────────────────────────────────────────────────────
  const filteredEtops = aircraft.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'downgraded') { const max = getMaxETOPS(a.aircraft_type); return max > 0 && (a.etops_approval ?? max) < max; }
    if (filter === 'non') return getMaxETOPS(a.aircraft_type) === 0;
    if (filter === 'ok') { const max = getMaxETOPS(a.aircraft_type); return max > 0 && (a.etops_approval ?? max) === max; }
    return true;
  });

  const filteredCat = aircraft.filter(a => {
    const { catDowngradeLevel, rvsmBlock } = computeApprovalImpact(melItems, a);
    const max = getMaxCAT(a.aircraft_type);
    const stored = a.cat_approval || max;
    const eff = catDowngradeLevel && CAT_RANK[catDowngradeLevel] < CAT_RANK[stored] ? catDowngradeLevel : stored;
    if (filter === 'all') return true;
    if (filter === 'downgraded') return CAT_RANK[eff] < CAT_RANK[max];
    if (filter === 'rvsm') return a.rvsm_approved === false || rvsmBlock;
    if (filter === 'ok') return eff === max && a.rvsm_approved !== false && !rvsmBlock;
    return true;
  });

  const matrixAircraft = matrixTail ? aircraft.find(a => a.tail_number === matrixTail) : aircraft[0];
  const matrixMelItems = matrixAircraft ? melItems.filter(m => m.aircraft_tail === matrixAircraft?.tail_number) : [];
  const matrixImpact = matrixAircraft ? computeApprovalImpact(melItems, matrixAircraft) : { reasons: [] };

  const etopsFilters = [
    { key: 'all', label: 'All' },
    { key: 'ok', label: '✅ Fully Certified' },
    { key: 'downgraded', label: `⚠️ Downgraded (${etopsDowngraded.length})` },
    { key: 'non', label: '🚫 Non-ETOPS' },
  ];

  const catFilters = [
    { key: 'all', label: 'All' },
    { key: 'ok', label: '✅ Full CAT' },
    { key: 'downgraded', label: `⚠️ Downgraded (${catDowngradedList.length})` },
    { key: 'rvsm', label: `📡 RVSM N/O (${rvsmNonApproved.length})` },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">AIRCRAFT QUALIFICATIONS</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">ETOPS · CAT II/IIIa/b/c · RVSM · System Health · Risk Monitor</p>
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
          <KpiCard label="Fleet Total" icon={Plane} value={aircraft.length} subLabel="Tracked aircraft" color="text-foreground" />
          <KpiCard label="ETOPS Dg" icon={Globe} value={etopsDowngraded.length} subLabel="Below max certification" color={etopsDowngraded.length > 0 ? 'text-red-400' : 'text-green-400'} />
          <KpiCard label="CAT/RVSM Issue" icon={Shield} value={catDowngradedList.length + rvsmNonApproved.length} subLabel="CAT dg + RVSM N/O" color={(catDowngradedList.length + rvsmNonApproved.length) > 0 ? 'text-red-400' : 'text-green-400'} />
          <KpiCard label="At-Risk" icon={AlertTriangle} value={atRiskFleet.length} subLabel="MEL or qual issue" color={atRiskFleet.length > 0 ? 'text-amber-400' : 'text-green-400'} />
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
                  <p className="text-xs text-red-300/70 mt-0.5">Affected: {etopsDowngraded.map(a => a.tail_number).join(', ')}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredEtops.map(a => <ETOPSCard key={a.id} aircraft={a} melItems={melItems} />)}
            </div>
          </>
        )}

        {/* ── CAT / RVSM Tab ── */}
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

            {/* Intelligence banner */}
            {(catDowngradedList.length > 0 || rvsmNonApproved.length > 0) && filter !== 'ok' && (
              <div className="rounded-xl border border-red-500/40 bg-red-900/10 px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-extrabold text-red-400">CAT/RVSM qualification alerts active</p>
                </div>
                {catDowngradedList.length > 0 && (
                  <p className="text-xs text-red-300/80">⬇️ {catDowngradedList.length} aircraft CAT-downgraded (MEL auto-logic applied) — low-vis ops restricted</p>
                )}
                {rvsmNonApproved.length > 0 && (
                  <p className="text-xs text-orange-300/80">📡 {rvsmNonApproved.length} aircraft RVSM N/O — NAT HLA + FL290–FL410 blocked</p>
                )}
                <p className="text-[10px] text-muted-foreground font-mono">Auto-downgrade engine active: pitot-static · ADC · altimetry · AP · ILS · RA MELs trigger real-time downgrade</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCat.map(a => (
                <CATRVSMCard
                  key={a.id}
                  aircraft={a}
                  melItems={melItems}
                  onExpand={toggleExpand}
                  expanded={!!expandedCards[a.tail_number]}
                />
              ))}
            </div>
          </>
        )}

        {/* ── System Matrix Tab ── */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            {/* Explanation panel */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 px-4 py-3 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-blue-300">RVSM/CAT System Health Matrix</p>
                <p className="text-xs text-blue-300/70 mt-0.5">
                  10 FAA/ICAO-defined critical systems monitored per tail. Any open MEL matching pitot-static, ADC, altimetry, transponder, autopilot, ILS, radio altimeter, FMA, autobrakes, or AOA automatically triggers the downgrade engine. Compliance references: ICAO Doc 9574, FAA AC 91-85B, FAA AC 120-29A, EASA AMC1 SPA.LVO.
                </p>
              </div>
            </div>

            {/* Tail selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tail:</span>
              {aircraft.slice(0, 24).map(ac => {
                const { reasons } = computeApprovalImpact(melItems, ac);
                return (
                  <button
                    key={ac.tail_number}
                    onClick={() => setMatrixTail(ac.tail_number)}
                    className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all',
                      (matrixTail || aircraft[0]?.tail_number) === ac.tail_number
                        ? 'bg-primary text-primary-foreground border-primary'
                        : reasons.length > 0
                        ? 'bg-red-900/20 border-red-500/40 text-red-400 hover:bg-red-900/40'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {ac.tail_number}
                    {reasons.length > 0 && <span className="ml-1 text-[8px]">⚠</span>}
                  </button>
                );
              })}
            </div>

            {matrixAircraft && (
              <>
                {/* Computed qualification status */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(() => {
                    const { catDowngradeLevel, rvsmBlock } = computeApprovalImpact(melItems, matrixAircraft);
                    const maxCat = getMaxCAT(matrixAircraft.aircraft_type);
                    const stored = matrixAircraft.cat_approval || maxCat;
                    const eff = catDowngradeLevel && CAT_RANK[catDowngradeLevel] < CAT_RANK[stored] ? catDowngradeLevel : stored;
                    const catDg = CAT_RANK[eff] < CAT_RANK[maxCat];
                    const rvsmOk = matrixAircraft.rvsm_approved !== false && !rvsmBlock;
                    return (
                      <>
                        <div className={cn('rounded-xl border px-3 py-2.5', catDg ? 'border-red-500/40 bg-red-900/10' : 'border-green-500/30 bg-green-900/10')}>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Max CAT</p>
                          <p className="text-xl font-black text-foreground font-mono mt-0.5">{maxCat}</p>
                        </div>
                        <div className={cn('rounded-xl border px-3 py-2.5', catDg ? 'border-red-500/40 bg-red-900/10' : 'border-green-500/30 bg-green-900/10')}>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Effective CAT</p>
                          <p className={cn('text-xl font-black font-mono mt-0.5', catDg ? 'text-red-400' : 'text-green-400')}>{eff}</p>
                          {catDowngradeLevel && <p className="text-[8px] text-red-400 font-bold">AUTO-DOWNGRADE</p>}
                        </div>
                        <div className={cn('rounded-xl border px-3 py-2.5', rvsmOk ? 'border-green-500/30 bg-green-900/10' : 'border-red-500/40 bg-red-900/10')}>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">RVSM</p>
                          <p className={cn('text-xl font-black font-mono mt-0.5', rvsmOk ? 'text-green-400' : 'text-red-400')}>{rvsmOk ? 'APVD' : 'N/O'}</p>
                          {rvsmBlock && <p className="text-[8px] text-red-400 font-bold">MEL-TRIGGERED</p>}
                        </div>
                        <div className="rounded-xl border border-border px-3 py-2.5">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Open MELs</p>
                          <p className={cn('text-xl font-black font-mono mt-0.5', matrixImpact.reasons.length > 0 ? 'text-amber-400' : 'text-foreground')}>
                            {melItems.filter(m => m.aircraft_tail === matrixAircraft.tail_number && (m.status === 'open' || m.status === 'deferred')).length}
                          </p>
                          {matrixImpact.reasons.length > 0 && <p className="text-[8px] text-amber-400 font-bold">{matrixImpact.reasons.length} AFFECT QUAL</p>}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <RVSMSystemMatrix
                  aircraft={matrixAircraft}
                  melItems={melItems}
                  impactReasons={matrixImpact.reasons}
                />
              </>
            )}
          </div>
        )}

        {/* ── Monitoring Program Tab ── */}
        {activeTab === 'program' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 px-4 py-3 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-blue-300">RVSM Monitoring Program (RMP)</p>
                <p className="text-xs text-blue-300/70 mt-0.5">
                  Tracks 5 mandatory RVSM certification items per tail: Height Monitoring (HMA · 5yr), Altimetry System Check (1yr), ADC Calibration (2yr), Transponder Encode Check (2yr · 14 CFR 91.413), and Pitot Heat Functional Test (1yr). Expiry automatically elevates risk status in the At-Risk fleet view.
                </p>
              </div>
            </div>
            <RVSMMonitoringProgram aircraft={aircraft} />
          </div>
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
                    <p className="text-xs text-amber-300/70 mt-0.5">Downgraded qualifications, MEL conflicts, RVSM violations, or auto-downgrade triggers active</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {atRiskFleet.map(a => (
                    <AtRiskRow key={a.id} aircraft={a} melItems={melItems} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}