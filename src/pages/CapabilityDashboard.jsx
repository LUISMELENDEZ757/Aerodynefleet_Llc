import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Globe, Shield, Radio, Plane, CheckCircle, AlertTriangle, XCircle,
  BarChart3, Search, ChevronDown, Info, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getEtopsCapability(type = '') {
  if (['B777','B787','A350'].some(t => type.includes(t))) return 370;
  if (['B737 MAX','A320','A321','B767'].some(t => type.includes(t))) return 180;
  if (['B737-800','B737-900','B757'].some(t => type.includes(t))) return 120;
  return 0;
}

function getMaxCat(type = '') {
  if (['B777','B787','A350'].some(t => type.includes(t))) return 'CAT IIIc';
  if (['B737 MAX','A320','A321'].some(t => type.includes(t))) return 'CAT IIIb';
  if (['B737-800','B737-900','B757','B767'].some(t => type.includes(t))) return 'CAT IIIa';
  return 'CAT II';
}

function getRVSMStatus(type = '') {
  // All modern commercial jets are RVSM capable
  return ['CRJ700','CRJ900','E190','E175'].some(t => type.includes(t)) ? 'capable' : 'approved';
}

const CAT_RANK = { 'CAT IIIc': 5, 'CAT IIIb': 4, 'CAT IIIa': 3, 'CAT II': 2, 'CAT I': 1 };

function StatusPill({ ok, label }) {
  return (
    <span className={cn(
      'flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black',
      ok ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
    )}>
      {ok ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

function SectionHeader({ icon: HeaderIcon, color, title, subtitle, count }) {
  return (
    <div className={cn('flex items-center gap-3 p-5 rounded-2xl border mb-4', color)}>
      <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center">
        <HeaderIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-base font-black text-white">{title}</p>
        <p className="text-xs text-white/60">{subtitle}</p>
      </div>
      {count !== undefined && (
        <div className="text-2xl font-black text-white">{count}</div>
      )}
    </div>
  );
}

// ── ETOPS Section ─────────────────────────────────────────────────────────────
function ETOPSSection({ aircraft }) {
  const etopsAircraft = useMemo(() =>
    aircraft
      .map(a => ({ ...a, _capability: getEtopsCapability(a.aircraft_type) }))
      .filter(a => a._capability > 0)
      .sort((a, b) => b._capability - a._capability),
    [aircraft]
  );

  const certified = etopsAircraft.filter(a => a.etops_approval > 0);
  const notCertified = etopsAircraft.filter(a => !a.etops_approval);

  const byRating = etopsAircraft.reduce((acc, a) => {
    const rating = a.etops_approval || a._capability;
    if (!acc[rating]) acc[rating] = [];
    acc[rating].push(a);
    return acc;
  }, {});

  return (
    <div>
      <SectionHeader
        icon={Globe}
        color="bg-cyan-900/30 border-cyan-500/30"
        title="ETOPS — Extended Operations"
        subtitle="14 CFR 121.161 · AC 120-42B · FAA Authorization"
        count={etopsAircraft.length}
      />
      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'ETOPS Capable', value: etopsAircraft.length, color: 'text-cyan-400', bg: 'bg-cyan-900/20 border-cyan-500/20' },
          { label: 'Certified', value: certified.length, color: 'text-green-400', bg: 'bg-green-900/20 border-green-500/20' },
          { label: 'Not Yet Certified', value: notCertified.length, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-500/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4 text-center', bg)}>
            <p className={cn('text-3xl font-black', color)}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Aircraft by ETOPS rating */}
      <div className="space-y-3">
        {Object.entries(byRating).sort(([a], [b]) => Number(b) - Number(a)).map(([rating, tails]) => (
          <div key={rating} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-cyan-900/20 border-b border-cyan-500/20">
              <span className="text-xs font-black text-cyan-400">ETOPS-{rating}</span>
              <span className="text-[10px] text-gray-500">{tails.length} aircraft</span>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {tails.map(a => (
                <Link key={a.id} to={`/AircraftDetail?tail=${a.tail_number}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border hover:border-cyan-500/40 transition-all">
                  <Plane className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-bold text-white font-mono">{a.tail_number}</span>
                  <span className="text-[9px] text-gray-500">{a.aircraft_type}</span>
                  {a.etops_approval ? (
                    <StatusPill ok label={`ETOPS-${a.etops_approval}`} />
                  ) : (
                    <StatusPill ok={false} label="Not Certified" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Requirements callout */}
      <div className="mt-4 bg-cyan-950/30 border border-cyan-700/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-cyan-300/80 leading-relaxed">
            <strong className="text-cyan-300">ETOPS Authorization Requirements:</strong> Maintenance program per AC 120-42B, ETOPS pre-departure service check, ETOPS-specific MEL items, cargo fire suppression time limits, fuel policy (OEI + depressurization), and alternates planning per 14 CFR 121.161.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RVSM Section ──────────────────────────────────────────────────────────────
function RVSMSection({ aircraft }) {
  const withRvsm = aircraft.filter(a => a.rvsm_approved !== false);
  const notApproved = aircraft.filter(a => a.rvsm_approved === false);

  return (
    <div>
      <SectionHeader
        icon={Radio}
        color="bg-violet-900/30 border-violet-500/30"
        title="RVSM — Reduced Vertical Separation Minima"
        subtitle="14 CFR 91.180 · FAA Order 7110.77 · FL290–FL410 Authorization"
        count={aircraft.length}
      />
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'RVSM Approved', value: withRvsm.length, color: 'text-green-400', bg: 'bg-green-900/20 border-green-500/20' },
          { label: 'Not Approved', value: notApproved.length, color: 'text-red-400', bg: 'bg-red-900/20 border-red-500/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl border p-4 text-center', bg)}>
            <p className={cn('text-3xl font-black', color)}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Aircraft table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 gap-0 px-4 py-2 bg-secondary/50 border-b border-border">
          {['Tail #', 'Type', 'Station', 'RVSM Status'].map(h => (
            <span key={h} className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {aircraft.map(a => {
            const ok = a.rvsm_approved !== false;
            return (
              <div key={a.id} className="grid grid-cols-4 gap-0 px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                <Link to={`/AircraftDetail?tail=${a.tail_number}`}
                  className="font-mono text-xs font-bold text-primary hover:underline">{a.tail_number}</Link>
                <span className="text-xs text-gray-400">{a.aircraft_type}</span>
                <span className="text-xs text-gray-500">{a.base_station || '—'}</span>
                <StatusPill ok={ok} label={ok ? 'APPROVED' : 'NOT APPROVED'} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 bg-violet-950/30 border border-violet-700/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-violet-300/80 leading-relaxed">
            <strong className="text-violet-300">RVSM Requirements:</strong> Aircraft must have dual autopilots, altitude alerting, automatic altitude control, and transponder. Procedures per 14 CFR 91.180 and OpSpec B046. Operations between FL290 and FL410 in RVSM airspace.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CAT Section ───────────────────────────────────────────────────────────────
function CATSection({ aircraft }) {
  const withCert = aircraft.map(a => ({
    ...a,
    _maxCat: a.cat_approval || getMaxCat(a.aircraft_type),
    _rank: CAT_RANK[a.cat_approval || getMaxCat(a.aircraft_type)] || 0,
  })).sort((a, b) => b._rank - a._rank);

  const byCat = withCert.reduce((acc, a) => {
    if (!acc[a._maxCat]) acc[a._maxCat] = [];
    acc[a._maxCat].push(a);
    return acc;
  }, {});

  const catColors = {
    'CAT IIIc': 'text-cyan-300 bg-cyan-900/30 border-cyan-500/30',
    'CAT IIIb': 'text-blue-300 bg-blue-900/30 border-blue-500/30',
    'CAT IIIa': 'text-green-300 bg-green-900/30 border-green-500/30',
    'CAT II':   'text-amber-300 bg-amber-900/30 border-amber-500/30',
    'CAT I':    'text-gray-300 bg-gray-900/30 border-gray-500/30',
  };

  const catDesc = {
    'CAT IIIc': 'No DH · No RVR limit — Zero/Zero autoland',
    'CAT IIIb': 'No DH · RVR ≥ 50m · Full autoland',
    'CAT IIIa': 'DH < 100ft · RVR ≥ 200m',
    'CAT II':   'DH 100ft · RVR ≥ 300m',
    'CAT I':    'DH 200ft · RVR ≥ 550m',
  };

  return (
    <div>
      <SectionHeader
        icon={Shield}
        color="bg-indigo-900/30 border-indigo-500/30"
        title="ILS CAT — Instrument Landing System Category"
        subtitle="14 CFR 91.189 · AC 120-29A · Low Visibility Operations"
        count={aircraft.length}
      />
      {/* Summary by CAT */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {['CAT IIIc','CAT IIIb','CAT IIIa','CAT II','CAT I'].map(cat => (
          <div key={cat} className={cn('rounded-xl border p-3 text-center', catColors[cat] || 'bg-gray-900/20 border-gray-500/20')}>
            <p className="text-2xl font-black">{(byCat[cat] || []).length}</p>
            <p className="text-[9px] mt-1 font-bold">{cat}</p>
          </div>
        ))}
      </div>

      {/* Aircraft groups by CAT */}
      <div className="space-y-3">
        {Object.entries(byCat).sort(([a], [b]) => (CAT_RANK[b] || 0) - (CAT_RANK[a] || 0)).map(([cat, tails]) => (
          <div key={cat} className={cn('rounded-xl border overflow-hidden', catColors[cat])}>
            <div className="flex items-center justify-between px-4 py-2.5 bg-black/20 border-b border-white/10">
              <div>
                <span className="text-xs font-black">{cat}</span>
                <span className="text-[10px] ml-2 opacity-60">{catDesc[cat]}</span>
              </div>
              <span className="text-[10px] opacity-60">{tails.length} aircraft</span>
            </div>
            <div className="p-3 bg-black/10 flex flex-wrap gap-2">
              {tails.map(a => (
                <Link key={a.id} to={`/AircraftDetail?tail=${a.tail_number}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 border border-white/10 hover:border-white/30 transition-all">
                  <Plane className="w-3 h-3 opacity-70" />
                  <span className="text-xs font-bold font-mono">{a.tail_number}</span>
                  <span className="text-[9px] opacity-50">{a.aircraft_type}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-indigo-950/30 border border-indigo-700/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-indigo-300/80 leading-relaxed">
            <strong className="text-indigo-300">CAT Requirements:</strong> CAT II/III requires dual ILS receivers, autoland-certified autopilot, HUD or equivalent, specific MEL authorizations, and crew training per 14 CFR 91.189 and OpSpec C059/C060. Ground equipment certification also required per AC 120-29A.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overview Matrix ───────────────────────────────────────────────────────────
function CapabilityMatrix({ aircraft }) {
  return (
    <div>
      <h2 className="text-lg font-black text-white mb-4">Fleet Capability Matrix</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 px-4 py-2.5 bg-secondary/60 border-b border-border text-[9px] font-black text-gray-500 uppercase tracking-wider gap-2">
          {['Tail #', 'Type', 'ETOPS', 'CAT', 'RVSM', 'RNP'].map(h => <span key={h}>{h}</span>)}
        </div>
        <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
          {aircraft.map(a => {
            const etopsCap = getEtopsCapability(a.aircraft_type);
            const maxCat = a.cat_approval || getMaxCat(a.aircraft_type);
            const rvsm = a.rvsm_approved !== false;
            const rnp = a.rnp_capability || 'RNP 0.3';
            return (
              <div key={a.id} className="grid grid-cols-6 px-4 py-2.5 hover:bg-secondary/30 gap-2 items-center">
                <Link to={`/AircraftDetail?tail=${a.tail_number}`}
                  className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  {a.tail_number}
                  <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                </Link>
                <span className="text-xs text-gray-400 truncate">{a.aircraft_type}</span>
                <span className={cn('text-[10px] font-bold', etopsCap > 0 ? 'text-cyan-400' : 'text-gray-600')}>
                  {a.etops_approval ? `ETOPS-${a.etops_approval}` : etopsCap > 0 ? `Cap ${etopsCap}min` : '—'}
                </span>
                <span className={cn('text-[10px] font-bold',
                  maxCat.includes('IIIc') ? 'text-cyan-300' :
                  maxCat.includes('IIIb') ? 'text-blue-300' :
                  maxCat.includes('IIIa') ? 'text-green-300' :
                  maxCat.includes('II') ? 'text-amber-300' : 'text-gray-400'
                )}>{maxCat}</span>
                <StatusPill ok={rvsm} label={rvsm ? 'YES' : 'NO'} />
                <span className="text-[10px] text-violet-300">{rnp}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'matrix', label: '📊 Matrix', icon: BarChart3 },
  { id: 'etops', label: '🌍 ETOPS', icon: Globe },
  { id: 'rvsm', label: '📡 RVSM', icon: Radio },
  { id: 'cat', label: '✈️ CAT', icon: Shield },
];

export default function CapabilityDashboard() {
  const [activeTab, setActiveTab] = useState('matrix');
  const [search, setSearch] = useState('');

  const { data: rawAircraft = [], isLoading } = useQuery({
    queryKey: ['capability-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 1000),
  });

  // Deduplicate
  const aircraft = useMemo(() =>
    Object.values(rawAircraft.reduce((acc, a) => {
      if (!acc[a.tail_number] || new Date(a.updated_date) > new Date(acc[a.tail_number].updated_date))
        acc[a.tail_number] = a;
      return acc;
    }, {})).filter(a => a.status !== 'retired'),
    [rawAircraft]
  );

  const filtered = useMemo(() =>
    aircraft.filter(a =>
      !search ||
      a.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.aircraft_type?.toLowerCase().includes(search.toLowerCase()) ||
      a.base_station?.toLowerCase().includes(search.toLowerCase())
    ),
    [aircraft, search]
  );

  // Fleet-level capability counts
  const etopsCount = filtered.filter(a => getEtopsCapability(a.aircraft_type) > 0).length;
  const cat3Count = filtered.filter(a => {
    const cat = a.cat_approval || getMaxCat(a.aircraft_type);
    return cat.includes('III');
  }).length;
  const rvsmCount = filtered.filter(a => a.rvsm_approved !== false).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-7 pb-4">
        <div className="flex items-center gap-3 mb-6 bg-card border border-border p-4 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">Capability Programs</h1>
            <p className="text-xs text-gray-500 font-mono">ETOPS · RVSM · CAT II/III · RNP</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/FleetDashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/30 transition-colors">
              <Plane className="w-3.5 h-3.5" /> Fleet Dashboard
            </Link>
          </div>
        </div>

        {/* KPI bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active Aircraft', value: filtered.length, color: 'text-white', sub: 'in fleet' },
            { label: 'ETOPS Capable', value: etopsCount, color: 'text-cyan-400', sub: 'extended ops' },
            { label: 'CAT III Capable', value: cat3Count, color: 'text-blue-400', sub: 'autoland' },
            { label: 'RVSM Approved', value: rvsmCount, color: 'text-violet-400', sub: 'FL290–FL410' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
              <p className={cn('text-4xl font-black mt-1', color)}>{isLoading ? '…' : value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 mb-4">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tail, type, station…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all',
                activeTab === id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-card text-gray-400 hover:text-white border border-border'
              )}>{label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {isLoading ? (
          <div className="text-center text-gray-600 py-20">Loading aircraft data…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-600 py-20">No aircraft found</div>
        ) : (
          <>
            {activeTab === 'matrix' && <CapabilityMatrix aircraft={filtered} />}
            {activeTab === 'etops' && <ETOPSSection aircraft={filtered} />}
            {activeTab === 'rvsm' && <RVSMSection aircraft={filtered} />}
            {activeTab === 'cat' && <CATSection aircraft={filtered} />}
          </>
        )}
      </div>
    </div>
  );
}