import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, Activity, AlertTriangle, CheckCircle, Clock, Zap,
  RefreshCw, TrendingUp, TrendingDown, Database, Radio, BarChart2,
  Thermometer, Gauge, Download, Cpu, Globe, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

// ── Mock Skywise Data ─────────────────────────────────────────────────────────
const SKYWISE_AIRCRAFT = [
  { tail: 'F-ABCD', type: 'A320', skywise_id: 'SKY-00421', health_score: 94, faults: 0, advisories: 1, open_orders: 2, predictive_alerts: 1, last_sync: '4 min ago' },
  { tail: 'F-BXYZ', type: 'A321', skywise_id: 'SKY-00422', health_score: 78, faults: 2, advisories: 3, open_orders: 5, predictive_alerts: 2, last_sync: '1 min ago' },
  { tail: 'F-CMNP', type: 'A320', skywise_id: 'SKY-00423', health_score: 97, faults: 0, advisories: 0, open_orders: 0, predictive_alerts: 0, last_sync: '9 min ago' },
  { tail: 'F-DRTQ', type: 'A321', skywise_id: 'SKY-00424', health_score: 85, faults: 1, advisories: 2, open_orders: 3, predictive_alerts: 1, last_sync: '7 min ago' },
  { tail: 'F-EKLW', type: 'A350', skywise_id: 'SKY-00425', health_score: 91, faults: 0, advisories: 1, open_orders: 1, predictive_alerts: 0, last_sync: '2 min ago' },
];

const SKYWISE_FAULTS = [
  { tail: 'F-BXYZ', ata: '32', system: 'Landing Gear', code: 'LG-ACTUATOR-RESP-SLOW', severity: 'FAULT', message: 'Main gear retraction actuator response time 2.1s vs 1.5s limit. Dispatch under MEL 32-10. Requires inspection before next flight.', timestamp: '13:45Z', flight: 'AFR1421' },
  { tail: 'F-BXYZ', ata: '21', system: 'Air Conditioning', code: 'PACK1-FLOW-LO', severity: 'FAULT', message: 'Pack 1 flow rate below minimum — 18% reduction from baseline. Cabin pressurization within limits but monitor.', timestamp: '14:02Z', flight: 'AFR1421' },
  { tail: 'F-DRTQ', ata: '29', system: 'Hydraulic System', code: 'HYD-BLUE-LO-PRESS', severity: 'FAULT', message: 'Blue hydraulic system pressure below 2800 PSI during level flight. Check reservoir level and pump output.', timestamp: '12:30Z', flight: 'AFR1398' },
  { tail: 'F-BXYZ', ata: '77', system: 'Engine Indicating', code: 'ENG2-N1-VIBRATION', severity: 'ADVISORY', message: 'Engine 2 N1 vibration 0.62 IPS, approaching 0.70 limit. Trend indicates progressive fan imbalance.', timestamp: '14:10Z', flight: 'AFR1421' },
  { tail: 'F-DRTQ', ata: '31', system: 'Indicating Systems', code: 'ECAM-PRESS-SENS-DEGRADE', severity: 'ADVISORY', message: 'ECAM pressure sensor drift detected. Cross-check with standby instruments. BITE test recommended at base.', timestamp: '11:55Z', flight: 'AFR1398' },
  { tail: 'F-ABCD', ata: '49', system: 'APU', code: 'APU-START-ATTEMPTS-3', severity: 'ADVISORY', message: 'APU required 3 start attempts before successful ignition on last 2 events. Ignition unit approaching service interval.', timestamp: '08:22Z', flight: 'GROUND' },
  { tail: 'F-EKLW', ata: '34', system: 'Navigation', code: 'ADIRU3-DIFF-HIGH', severity: 'ADVISORY', message: 'ADIRU 3 showing increased difference vs ADIRU 1&2. Within ETOPS limits but review before long-range dispatch.', timestamp: '10:45Z', flight: 'AFR1502' },
];

const PREDICTIVE_ALERTS = [
  { tail: 'F-BXYZ', system: 'Engine 2 Fan', confidence: 86, timeframe: '30-50 FH', description: 'Fan blade erosion pattern detected via vibration signature. Borescope inspection recommended at next C check.' },
  { tail: 'F-DRTQ', system: 'Blue Hydraulic Pump', confidence: 79, timeframe: '15-25 FH', description: 'Pump efficiency degrading — predictive model indicates 73% probability of low pressure event within 25 flight hours.' },
  { tail: 'F-ABCD', system: 'APU Ignition Unit', confidence: 71, timeframe: '20-40 starts', description: 'Ignition exciter capacitor degradation. 3-attempt starts suggest approaching service life limit.' },
  { tail: 'F-EKLW', system: 'ADIRU 3', confidence: 68, timeframe: '60-90 FH', description: 'Gradual drift trending outside tight tolerances. LRU swap recommended at scheduled base maintenance.' },
];

const N1_TREND = [
  { flight: 'F001', vib: 0.34 }, { flight: 'F002', vib: 0.38 }, { flight: 'F003', vib: 0.41 },
  { flight: 'F004', vib: 0.45 }, { flight: 'F005', vib: 0.49 }, { flight: 'F006', vib: 0.53 },
  { flight: 'F007', vib: 0.58 }, { flight: 'F008', vib: 0.62 },
];

const SYSTEM_RADAR = [
  { system: 'Hydraulics', score: 79 },
  { system: 'Engines', score: 88 },
  { system: 'Avionics', score: 91 },
  { system: 'Air Cond', score: 82 },
  { system: 'Electrical', score: 94 },
  { system: 'Flight Ctrl', score: 90 },
];

const OOP_DATA = [
  { month: 'Nov', open: 18 }, { month: 'Dec', open: 22 }, { month: 'Jan', open: 14 },
  { month: 'Feb', open: 17 }, { month: 'Mar', open: 11 }, { month: 'Apr', open: 13 },
];

function HealthRing({ score }) {
  const color = score >= 90 ? '#22c55e' : score >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${2 * Math.PI * 26 * score / 100} ${2 * Math.PI * 26 * (1 - score / 100)}`}
          strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-black text-white">{score}</span>
    </div>
  );
}

const TABS = [
  { id: 'fleet',    label: 'Fleet Overview',     icon: Activity },
  { id: 'faults',  label: 'Active Faults',       icon: AlertTriangle },
  { id: 'predict', label: 'Predictive Alerts',   icon: Cpu },
  { id: 'engine',  label: 'Engine Vibration',    icon: Thermometer },
  { id: 'oop',     label: 'Open Orders',         icon: Database },
];

export default function AirbusSkywiseDashboard() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const faultCount = SKYWISE_FAULTS.filter(f => f.severity === 'FAULT').length;
  const advisoryCount = SKYWISE_FAULTS.filter(f => f.severity === 'ADVISORY').length;
  const totalOpenOrders = SKYWISE_AIRCRAFT.reduce((s, a) => s + a.open_orders, 0);

  return (
    <div className="min-h-screen bg-[#06080f] text-white pb-24">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#080b18] px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/FleetDashboard" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-teal-700/30 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white">AIRBUS SKYWISE</h1>
              <p className="text-xs text-teal-400 mt-0.5">Connected Data Platform · A320 / A321 / A350 Family</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className={cn('w-4 h-4 text-slate-400', isRefreshing && 'animate-spin')} />
            </button>
            <div className="bg-[#0f1624] border border-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Skywise</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-black text-teal-400">LIVE</span>
              </div>
            </div>
            <div className="bg-[#0f1624] border border-white/10 rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Aircraft</p>
              <p className="text-sm font-black text-white mt-0.5">{SKYWISE_AIRCRAFT.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id ? 'bg-teal-700 text-white' : 'bg-[#141c2e] border border-white/8 text-slate-400 hover:text-white'
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 mt-5">
        {[
          { label: 'Active Faults',    value: faultCount,      color: 'text-red-400',     icon: AlertTriangle },
          { label: 'Advisories',       value: advisoryCount,   color: 'text-amber-400',   icon: Zap },
          { label: 'Open Orders',      value: totalOpenOrders, color: 'text-blue-400',    icon: Database },
          { label: 'Predictive Alerts',value: PREDICTIVE_ALERTS.length, color: 'text-teal-400', icon: Cpu },
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

        {/* ── FLEET OVERVIEW TAB ── */}
        {activeTab === 'fleet' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase tracking-wider">Skywise Fleet Health</h2>
              <span className="text-[10px] text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Connected via Skywise API</span>
            </div>
            <div className="space-y-3">
              {SKYWISE_AIRCRAFT.map((ac) => {
                const healthColor = ac.health_score >= 90 ? 'text-emerald-400' : ac.health_score >= 75 ? 'text-amber-400' : 'text-red-400';
                return (
                  <div key={ac.tail} className="bg-[#0a0f1e] border border-white/10 rounded-2xl px-5 py-4 hover:border-teal-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <HealthRing score={ac.health_score} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-base font-black text-teal-300 font-mono">{ac.tail}</p>
                          <span className="text-xs text-slate-500">{ac.type}</span>
                          <span className="text-[9px] font-mono text-slate-600">{ac.skywise_id}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {[
                            { label: 'Faults',    value: ac.faults,            color: ac.faults > 0 ? 'text-red-400' : 'text-slate-400' },
                            { label: 'Advisories', value: ac.advisories,       color: ac.advisories > 0 ? 'text-amber-400' : 'text-slate-400' },
                            { label: 'Open Orders', value: ac.open_orders,     color: ac.open_orders > 0 ? 'text-blue-400' : 'text-slate-400' },
                            { label: 'Pred. Alerts', value: ac.predictive_alerts, color: ac.predictive_alerts > 0 ? 'text-teal-400' : 'text-slate-400' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-[#141c2e] rounded-lg px-2 py-1.5 text-center">
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest">{label}</p>
                              <p className={cn('font-black text-base', color)}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ac.last_sync}</p>
                      </div>
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
                  <Radar name="Health" dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.25} strokeWidth={2} />
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
              <span className="text-[11px] text-slate-500">{SKYWISE_FAULTS.length} items</span>
            </div>
            <div className="space-y-3">
              {SKYWISE_FAULTS.map((fault, i) => (
                <div key={i} className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">{fault.tail}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/5 text-slate-300">ATA {fault.ata}</span>
                      <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase',
                        fault.severity === 'FAULT' ? 'text-red-400 bg-red-500/20 border-red-500/30' : 'text-amber-400 bg-amber-500/20 border-amber-500/30'
                      )}>{fault.severity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="font-mono">{fault.flight}</span>
                      <span>{fault.timestamp}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{fault.system}</p>
                    <p className="text-[11px] font-mono text-teal-300 mt-0.5">{fault.code}</p>
                    <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{fault.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-600 transition-colors">Create Log Entry</button>
                    <button className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-colors">Acknowledge</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PREDICTIVE ALERTS TAB ── */}
        {activeTab === 'predict' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase tracking-wider">Predictive Maintenance Alerts</h2>
              <span className="text-[11px] text-slate-500">Skywise AI Model</span>
            </div>
            <div className="space-y-3">
              {PREDICTIVE_ALERTS.map((alert, i) => {
                const confColor = alert.confidence >= 80 ? 'text-red-400' : alert.confidence >= 70 ? 'text-amber-400' : 'text-emerald-400';
                return (
                  <div key={i} className="bg-[#0a0f1e] border border-teal-500/20 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">{alert.tail}</span>
                          <span className="text-xs font-bold text-slate-400">{alert.system}</span>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {alert.timeframe}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{alert.description}</p>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Confidence</p>
                        <p className={cn('text-2xl font-black', confColor)}>{alert.confidence}%</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${alert.confidence}%`, background: alert.confidence >= 80 ? '#ef4444' : '#f59e0b' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── ENGINE VIBRATION TAB ── */}
        {activeTab === 'engine' && (
          <>
            <h2 className="text-base font-black text-white uppercase tracking-wider">Engine Vibration Monitoring</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Current N1 Vib', value: '0.62 IPS', color: 'text-amber-400', sub: 'F-BXYZ Eng 2' },
                { label: 'Limit', value: '0.70 IPS', color: 'text-red-400', sub: 'EASA AMM ref' },
                { label: 'Trend', value: '+0.28 IPS', color: 'text-orange-400', sub: 'Over 8 flights' },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="bg-[#0a0f1e] border border-white/10 rounded-2xl px-4 py-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</p>
                  <p className={cn('text-3xl font-black mt-1', color)}>{value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4">F-BXYZ — Engine 2 N1 Vibration Trend (IPS)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={N1_TREND} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <XAxis dataKey="flight" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0.3, 0.75]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Line type="monotone" dataKey="vib" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Vibration trending up +0.28 IPS over 8 flights. Borescope inspection recommended at next line check.</span>
              </div>
            </div>
          </>
        )}

        {/* ── OPEN ORDERS TAB ── */}
        {activeTab === 'oop' && (
          <>
            <h2 className="text-base font-black text-white uppercase tracking-wider">Open Orders & Maintenance Status</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Open Orders', value: totalOpenOrders, color: 'text-blue-400', icon: Database },
                { label: 'Avg per Aircraft',  value: (totalOpenOrders / SKYWISE_AIRCRAFT.length).toFixed(1), color: 'text-amber-400', icon: BarChart2 },
                { label: 'Aircraft Clean',    value: SKYWISE_AIRCRAFT.filter(a => a.open_orders === 0).length, color: 'text-emerald-400', icon: CheckCircle },
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
              <p className="text-sm font-extrabold text-white mb-4">Open Orders Trend — 6 Months</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={OOP_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="oopGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Area type="monotone" dataKey="open" stroke="#14b8a6" strokeWidth={2.5} fill="url(#oopGrad)" dot={{ fill: '#14b8a6', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {SKYWISE_AIRCRAFT.map((ac) => (
                <div key={ac.tail} className="bg-[#0a0f1e] border border-white/10 rounded-xl px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-teal-300 font-mono">{ac.tail}</span>
                    <span className="text-xs text-slate-500">{ac.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={cn('font-black text-base', ac.open_orders > 3 ? 'text-red-400' : ac.open_orders > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                      {ac.open_orders} open
                    </span>
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(ac.open_orders / 6 * 100, 100)}%`, background: ac.open_orders > 3 ? '#ef4444' : ac.open_orders > 0 ? '#f59e0b' : '#22c55e' }} />
                    </div>
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