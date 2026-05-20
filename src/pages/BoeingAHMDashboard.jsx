import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, Activity, AlertTriangle, CheckCircle, Clock, Zap,
  RefreshCw, Plane, TrendingDown, TrendingUp, Database, Radio,
  BarChart2, Thermometer, Gauge, Settings, Download, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

// ── Mock AHM Data ─────────────────────────────────────────────────────────────
const AHM_AIRCRAFT = [
  { tail: 'N738AD', type: 'B737-800', ahm_status: 'NOMINAL', last_sync: '12 min ago', faults: 0, advisories: 1, acars_active: true, dfdr_available: true },
  { tail: 'N745AD', type: 'B737 MAX 9', ahm_status: 'ADVISORY', last_sync: '3 min ago', faults: 1, advisories: 3, acars_active: true, dfdr_available: true },
  { tail: 'N761AD', type: 'B737-900', ahm_status: 'NOMINAL', last_sync: '18 min ago', faults: 0, advisories: 0, acars_active: true, dfdr_available: false },
  { tail: 'N782AD', type: 'B737 MAX 8', ahm_status: 'FAULT', last_sync: '1 min ago', faults: 2, advisories: 4, acars_active: true, dfdr_available: true },
  { tail: 'N789AD', type: 'B737-800', ahm_status: 'NOMINAL', last_sync: '27 min ago', faults: 0, advisories: 1, acars_active: false, dfdr_available: true },
  { tail: 'N801AD', type: 'B737-900', ahm_status: 'NOMINAL', last_sync: '8 min ago', faults: 0, advisories: 0, acars_active: true, dfdr_available: true },
];

const AHM_FAULTS = [
  { tail: 'N782AD', ata: '29', system: 'Hydraulic System', code: 'HYD-PUMP-A-LO-PRESS', severity: 'FAULT', message: 'Hydraulic System A pump low pressure detected during cruise phase. Dispatch may require MEL reference.', flight: 'FLT4412', timestamp: '14:32Z' },
  { tail: 'N782AD', ata: '34', system: 'Navigation', code: 'IRS-2-DRIFT-HIGH', severity: 'ADVISORY', message: 'IRS #2 drift rate exceeds normal limits. Cross-check with GPS position.', flight: 'FLT4412', timestamp: '14:38Z' },
  { tail: 'N745AD', ata: '72', system: 'Engine 1', code: 'ENG1-EGT-MARGIN-LOW', severity: 'FAULT', message: 'Engine 1 EGT margin degraded to 28°C above redline. Trend analysis indicates progressive deterioration.', flight: 'FLT4487', timestamp: '13:55Z' },
  { tail: 'N745AD', ata: '49', system: 'APU', code: 'APU-OIL-CONS-HIGH', severity: 'ADVISORY', message: 'APU oil consumption rate 1.1 qt/hr, exceeds 0.8 qt/hr limit. Service required within 10 APU hours.', flight: 'GROUND', timestamp: '11:20Z' },
  { tail: 'N738AD', ata: '24', system: 'Electrical', code: 'ELEC-BUS-VOLT-FLUC', severity: 'ADVISORY', message: 'Bus voltage fluctuation detected during APU-to-engine generator transfer. Monitor for recurrence.', flight: 'FLT4401', timestamp: '09:15Z' },
  { tail: 'N789AD', ata: '27', system: 'Flight Controls', code: 'SPOILER-CONT-DEGRADE', severity: 'ADVISORY', message: 'Spoiler control actuator response slightly degraded. Within limits but trending.', flight: 'FLT4453', timestamp: '12:08Z' },
];

const EGT_TREND = [
  { flight: 'FLT001', egt: 710 }, { flight: 'FLT002', egt: 714 }, { flight: 'FLT003', egt: 718 },
  { flight: 'FLT004', egt: 716 }, { flight: 'FLT005', egt: 722 }, { flight: 'FLT006', egt: 725 },
  { flight: 'FLT007', egt: 729 }, { flight: 'FLT008', egt: 731 },
];

const FUEL_BURN = [
  { sector: 'EWR-LAX', actual: 28.4, planned: 27.9, variance: 0.5 },
  { sector: 'EWR-ORD', actual: 11.2, planned: 11.5, variance: -0.3 },
  { sector: 'EWR-MIA', actual: 14.8, planned: 14.6, variance: 0.2 },
  { sector: 'EWR-ATL', actual: 10.1, planned: 10.3, variance: -0.2 },
  { sector: 'EWR-DFW', actual: 17.6, planned: 17.2, variance: 0.4 },
  { sector: 'EWR-SFO', actual: 30.1, planned: 29.4, variance: 0.7 },
];

const SYSTEM_RADAR = [
  { system: 'Hydraulics', score: 72 },
  { system: 'Engines', score: 85 },
  { system: 'Avionics', score: 94 },
  { system: 'Fuel', score: 91 },
  { system: 'Electrical', score: 88 },
  { system: 'Flight Ctrl', score: 78 },
];

const STATUS_CFG = {
  NOMINAL:  { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  ADVISORY: { color: 'text-amber-400',   bg: 'bg-amber-500/20',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  FAULT:    { color: 'text-red-400',     bg: 'bg-red-500/20',     border: 'border-red-500/30',     dot: 'bg-red-500 animate-pulse' },
};

const SEVERITY_CFG = {
  FAULT:    'text-red-400 bg-red-500/20 border-red-500/30',
  ADVISORY: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
};

const TABS = [
  { id: 'fleet',    label: 'Fleet Health',      icon: Activity },
  { id: 'faults',  label: 'Active Faults',      icon: AlertTriangle },
  { id: 'egt',     label: 'Engine Trend (EGT)', icon: Thermometer },
  { id: 'fuel',    label: 'Fuel Analytics',     icon: Gauge },
  { id: 'acars',   label: 'ACARS / DFDR',       icon: Radio },
];

export default function BoeingAHMDashboard() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['ahm-aircraft'],
    queryFn: () => base44.entities.Aircraft.filter({ aircraft_type: 'B737-800' }),
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const faultCount  = AHM_FAULTS.filter(f => f.severity === 'FAULT').length;
  const advisoryCount = AHM_FAULTS.filter(f => f.severity === 'ADVISORY').length;
  const nominalCount = AHM_AIRCRAFT.filter(a => a.ahm_status === 'NOMINAL').length;

  return (
    <div className="min-h-screen bg-[#06080f] text-white pb-24">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#080b18] px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/FleetDashboard" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-blue-700/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 40 40" className="w-7 h-7 fill-blue-300">
                <path d="M20 4 L28 14 H24 L24 22 H32 L36 30 H26 L26 36 H14 L14 30 H4 L8 22 H16 L16 14 H12 Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white">BOEING AIRCRAFT HEALTH MGMT</h1>
              <p className="text-xs text-blue-400 mt-0.5">AHM · MyBoeingFleet Integration · B737 Family</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className={cn('w-4 h-4 text-slate-400', isRefreshing && 'animate-spin')} />
            </button>
            <div className="bg-[#0f1624] border border-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">AHM Feed</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-black text-blue-400">LIVE</span>
              </div>
            </div>
            <div className="bg-[#0f1624] border border-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Aircraft</p>
              <p className="text-sm font-black text-white mt-0.5">{AHM_AIRCRAFT.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id ? 'bg-blue-700 text-white' : 'bg-[#141c2e] border border-white/8 text-slate-400 hover:text-white'
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 mt-5">
        {[
          { label: 'Aircraft Nominal',   value: nominalCount,   color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Active Faults',      value: faultCount,     color: 'text-red-400',     icon: AlertTriangle },
          { label: 'Advisories',         value: advisoryCount,  color: 'text-amber-400',   icon: Zap },
          { label: 'ACARS Active',       value: AHM_AIRCRAFT.filter(a => a.acars_active).length, color: 'text-blue-400', icon: Radio },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-[#0a0f1e] border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
            <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
            <div>
              <p className={cn('text-3xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 mt-5 space-y-4">

        {/* ── FLEET HEALTH TAB ── */}
        {activeTab === 'fleet' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase tracking-wider">Fleet AHM Status</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Database className="w-3 h-3" /> MyBoeingFleet Integration
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AHM_AIRCRAFT.map((ac) => {
                const cfg = STATUS_CFG[ac.ahm_status] || STATUS_CFG.NOMINAL;
                return (
                  <div key={ac.tail} className={cn('bg-[#0a0f1e] border rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all', cfg.border)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-black text-primary font-mono">{ac.tail}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{ac.type}</p>
                      </div>
                      <span className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />{ac.ahm_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#141c2e] rounded-lg px-3 py-2">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Faults</p>
                        <p className={cn('font-black text-base mt-0.5', ac.faults > 0 ? 'text-red-400' : 'text-emerald-400')}>{ac.faults}</p>
                      </div>
                      <div className="bg-[#141c2e] rounded-lg px-3 py-2">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Advisories</p>
                        <p className={cn('font-black text-base mt-0.5', ac.advisories > 0 ? 'text-amber-400' : 'text-slate-400')}>{ac.advisories}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Sync: {ac.last_sync}
                      </span>
                      <span className="flex items-center gap-1">
                        <Radio className={cn('w-3 h-3', ac.acars_active ? 'text-blue-400' : 'text-slate-600')} />
                        {ac.acars_active ? 'ACARS ON' : 'ACARS OFF'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* System Radar */}
            <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4">Fleet System Health Index</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={SYSTEM_RADAR}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="system" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name="Health" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ── ACTIVE FAULTS TAB ── */}
        {activeTab === 'faults' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase tracking-wider">Active Faults & Advisories</h2>
              <span className="text-[11px] text-slate-500">{AHM_FAULTS.length} items</span>
            </div>
            <div className="space-y-3">
              {AHM_FAULTS.map((fault, i) => (
                <div key={i} className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">{fault.tail}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/5 text-slate-300">ATA {fault.ata}</span>
                      <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase', SEVERITY_CFG[fault.severity])}>{fault.severity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="font-mono">{fault.flight}</span>
                      <span>{fault.timestamp}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{fault.system}</p>
                    <p className="text-[11px] font-mono text-blue-300 mt-0.5">{fault.code}</p>
                    <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{fault.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-600 transition-colors">Create Log Entry</button>
                    <button className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-colors">Acknowledge</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── EGT TREND TAB ── */}
        {activeTab === 'egt' && (
          <>
            <h2 className="text-base font-black text-white uppercase tracking-wider">Engine EGT Trend Analysis</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Current EGT Margin', value: '28°C', color: 'text-red-400', sub: 'N745AD Eng 1' },
                { label: 'Fleet Avg EGT Margin', value: '61°C', color: 'text-emerald-400', sub: 'All engines' },
                { label: 'Shop Visit Risk', value: '91%', color: 'text-amber-400', sub: 'N745AD / 200 cycles' },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="bg-[#0a0f1e] border border-white/10 rounded-2xl px-4 py-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</p>
                  <p className={cn('text-3xl font-black mt-1', color)}>{value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4">N745AD — Engine 1 EGT Trend (Last 8 Flights)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={EGT_TREND} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <XAxis dataKey="flight" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[700, 745]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Line type="monotone" dataKey="egt" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span>EGT trending up +21°C over 8 flights. Shop visit recommended within 200 cycles.</span>
              </div>
            </div>
          </>
        )}

        {/* ── FUEL ANALYTICS TAB ── */}
        {activeTab === 'fuel' && (
          <>
            <h2 className="text-base font-black text-white uppercase tracking-wider">Fuel Burn Analytics</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Avg Variance', value: '+0.3 t', color: 'text-amber-400', icon: TrendingUp },
                { label: 'Over-burn Sectors', value: '4', color: 'text-red-400', icon: AlertTriangle },
                { label: 'Under-burn Sectors', value: '2', color: 'text-emerald-400', icon: TrendingDown },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-[#0a0f1e] border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-3">
                  <Icon className={cn('w-5 h-5', color)} />
                  <div>
                    <p className={cn('text-2xl font-black', color)}>{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4">Actual vs Planned Fuel Burn (tonnes)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={FUEL_BURN} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <XAxis dataKey="sector" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="planned" fill="#1e40af" radius={[4, 4, 0, 0]} name="Planned" />
                  <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ── ACARS / DFDR TAB ── */}
        {activeTab === 'acars' && (
          <>
            <h2 className="text-base font-black text-white uppercase tracking-wider">ACARS & DFDR / QAR Status</h2>
            <div className="space-y-3">
              {AHM_AIRCRAFT.map((ac) => (
                <div key={ac.tail} className="bg-[#0a0f1e] border border-white/10 rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-blue-300 font-mono">{ac.tail}</span>
                      <span className="text-xs text-slate-500">{ac.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border',
                        ac.acars_active ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-700/40 text-slate-500 border-slate-600/30')}>
                        <Radio className="w-3 h-3" />{ac.acars_active ? 'ACARS ACTIVE' : 'ACARS INACTIVE'}
                      </span>
                      <span className={cn('flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border',
                        ac.dfdr_available ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700/40 text-slate-500 border-slate-600/30')}>
                        <Database className="w-3 h-3" />{ac.dfdr_available ? 'DFDR READY' : 'DFDR N/A'}
                      </span>
                      {ac.dfdr_available && (
                        <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                          <Download className="w-3 h-3" /> Download
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" /> Last AHM sync: {ac.last_sync}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}