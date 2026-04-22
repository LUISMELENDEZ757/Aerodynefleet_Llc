import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, Brain, Wrench, Package, Activity, BarChart2, ArrowLeftRight,
  RefreshCw, Loader2, TrendingUp, AlertTriangle, Clock, DollarSign, Database,
  Zap, CheckCircle, Target, CircleDot, Bell, MapPin, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadialBarChart, RadialBar, PolarAngleAxis, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// ── Confidence Ring ───────────────────────────────────────────────────────────
function ConfidenceRing({ value, color = '#22c55e' }) {
  const data = [{ value, fill: color }];
  return (
    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
      <RadialBarChart width={96} height={96} cx={48} cy={48} innerRadius={32} outerRadius={46}
        data={data} startAngle={90} endAngle={-270}>
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={6} angleAxisId={0} />
      </RadialBarChart>
      <span className="absolute text-base font-black text-white">{value}%</span>
    </div>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ level }) {
  const cfg = {
    HIGH:   'bg-rose-500/20 text-rose-400 border-rose-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    LOW:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  };
  return (
    <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-widest', cfg[level] || cfg.LOW)}>
      {level} PRIORITY
    </span>
  );
}

// ── Prediction Card ───────────────────────────────────────────────────────────
function PredictionCard({ pred }) {
  const ringColor = pred.confidence >= 85 ? '#22c55e' : pred.confidence >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-[#0f1624] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
              {pred.tail}
            </span>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
              ATA {pred.ata}
            </span>
            <PriorityBadge level={pred.priority} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">{pred.system}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{pred.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Timeframe</p>
              <p className="text-sm font-bold text-white mt-0.5">{pred.timeframe}</p>
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Cost Impact</p>
              <p className="text-sm font-bold text-white mt-0.5">{pred.costImpact}</p>
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Data Points</p>
              <p className="text-sm font-bold text-white mt-0.5">{pred.dataPoints?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Confidence</p>
          <ConfidenceRing value={pred.confidence} color={ringColor} />
        </div>
      </div>
    </div>
  );
}

// ── Trend Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = '#8b5cf6' }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, trend, trendDir, icon: Icon, color, sparkData }) {
  return (
    <div className="bg-[#0f1624] border border-white/10 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <p className={cn('text-3xl font-black', color)}>{value}</p>
      {sparkData && <Sparkline data={sparkData} color={color.replace('text-', '#').includes('#') ? color : '#8b5cf6'} />}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">{sub}</p>
        {trend && (
          <span className={cn('text-[10px] font-bold', trendDir === 'up' ? 'text-emerald-400' : 'text-rose-400')}>
            {trendDir === 'up' ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Static mock predictions ────────────────────────────────────────────────────
const PREDICTIONS = [
  { tail: 'N738AD', ata: '29', priority: 'HIGH',   system: 'Hydraulic System A', description: 'Pump failure likely within 45 flight hours', timeframe: '7-14 days', costImpact: '$12,500 – $18,000', dataPoints: 1247, confidence: 87 },
  { tail: 'N745AD', ata: '72', priority: 'HIGH',   system: 'Engine 1 EGT Margin', description: 'EGT margin degrading — shop visit within 200 cycles', timeframe: '30-45 days', costImpact: '$280,000 – $340,000', dataPoints: 4821, confidence: 91 },
  { tail: 'N761AD', ata: '32', priority: 'MEDIUM', system: 'Main Landing Gear', description: 'Strut seal wear detected — replacement recommended', timeframe: '21-28 days', costImpact: '$4,200 – $6,800', dataPoints: 892, confidence: 74 },
  { tail: 'N782AD', ata: '34', priority: 'MEDIUM', system: 'IRS #2 Navigation', description: 'Drift rate increasing — calibration or LRU swap needed', timeframe: '14-21 days', costImpact: '$8,500 – $12,000', dataPoints: 2103, confidence: 79 },
  { tail: 'N789AD', ata: '49', priority: 'LOW',    system: 'APU Oil Consumption', description: 'Consumption rate trending high — monitor for next 50 hrs', timeframe: '45-60 days', costImpact: '$1,800 – $3,200', dataPoints: 634, confidence: 68 },
  { tail: 'N801AD', ata: '27', priority: 'LOW',    system: 'Flight Control Actuator', description: 'Slight force ripple on L elevator — trending up slowly', timeframe: '60-90 days', costImpact: '$6,000 – $9,500', dataPoints: 1589, confidence: 65 },
];

const PARTS_DEMAND = [
  { part: 'Hydraulic Pump – P/N 65-29180-1', qty: 3, urgency: 'HIGH',   eta: '5 days', confidence: 89, cost: '$14,200' },
  { part: 'EGT Thermocouple Set', qty: 2, urgency: 'MEDIUM', eta: '12 days', confidence: 76, cost: '$3,400' },
  { part: 'MLG Strut Seal Kit',   qty: 4, urgency: 'MEDIUM', eta: '8 days',  confidence: 71, cost: '$1,800' },
  { part: 'IRS LRU – Honeywell',  qty: 1, urgency: 'MEDIUM', eta: '15 days', confidence: 78, cost: '$52,000' },
  { part: 'APU Oil Filter Kit',   qty: 6, urgency: 'LOW',    eta: '21 days', confidence: 64, cost: '$420' },
];

const RELIABILITY_DATA = [
  { month: 'Nov', rate: 98.2 }, { month: 'Dec', rate: 97.8 }, { month: 'Jan', rate: 98.5 },
  { month: 'Feb', rate: 97.1 }, { month: 'Mar', rate: 98.8 }, { month: 'Apr', rate: 99.1 },
];

const SYSTEM_HEALTH = [
  { system: 'Hydraulics', health: 72, color: '#f59e0b' },
  { system: 'Avionics',   health: 94, color: '#22c55e' },
  { system: 'Engines',    health: 81, color: '#f59e0b' },
  { system: 'Landing Gear', health: 88, color: '#22c55e' },
  { system: 'Flight Ctrl', health: 91, color: '#22c55e' },
  { system: 'APU',        health: 76, color: '#f59e0b' },
];

const SWAP_RECOMMENDATIONS = [
  { from: 'N745AD', to: 'N801AD', route: 'EWR–LHR', reason: 'Swap avoids ETOPS-degraded tail on trans-Atlantic', saving: '$42,000', confidence: 88 },
  { from: 'N782AD', to: 'N761AD', route: 'EWR–CDG', reason: 'IRS degradation — swap to fully-serviceable tail', saving: '$18,500', confidence: 83 },
];

const SPARKLINE_UP   = [{ v:2},{ v:5},{ v:3},{ v:7},{ v:6},{ v:9},{ v:8}];
const SPARKLINE_DOWN = [{ v:9},{ v:7},{ v:8},{ v:5},{ v:6},{ v:4},{ v:3}];

// ── Tire Monitoring Data ──────────────────────────────────────────────────────
const TIRE_ALERTS = [
  {
    tail: 'N738AD', station: 'KEWR', hub: 'Newark Hub', overnight: true,
    position: 'Main Gear L/H Outboard', pressure_psi: 162, nominal_psi: 195,
    pct_life: 91, tread_mm: 1.8, cycles_remaining: 42, status: 'CRITICAL',
    notification: 'Tire at 91% life cycle — replacement recommended at KEWR overnight turn. Pressure 17% below nominal.',
  },
  {
    tail: 'N745AD', station: 'KORD', hub: 'Chicago Hub', overnight: true,
    position: 'Nose Gear L/H', pressure_psi: 178, nominal_psi: 185,
    pct_life: 78, tread_mm: 3.1, cycles_remaining: 88, status: 'WARNING',
    notification: 'Tire pressure trending low over last 3 cycles. Inspect and service during KORD overnight.',
  },
  {
    tail: 'N761AD', station: 'KATL', hub: 'Atlanta Hub', overnight: false,
    position: 'Main Gear R/H Inboard', pressure_psi: 191, nominal_psi: 195,
    pct_life: 65, tread_mm: 4.2, cycles_remaining: 140, status: 'MONITOR',
    notification: 'Normal wear rate. Continue monitoring — schedule inspection within next 100 cycles.',
  },
  {
    tail: 'N782AD', station: 'KLAX', hub: 'Los Angeles Hub', overnight: true,
    position: 'Main Gear R/H Outboard', pressure_psi: 158, nominal_psi: 195,
    pct_life: 88, tread_mm: 2.1, cycles_remaining: 55, status: 'CRITICAL',
    notification: 'Significant pressure loss detected — 19% below nominal. Inspect for slow leak at KLAX overnight. Do not dispatch without tire check.',
  },
  {
    tail: 'N789AD', station: 'KDFW', hub: 'Dallas Hub', overnight: true,
    position: 'Nose Gear R/H', pressure_psi: 183, nominal_psi: 185,
    pct_life: 52, tread_mm: 5.8, cycles_remaining: 195, status: 'OK',
    notification: 'Serviceable. Slight pressure variance within limits. No action required at DFW overnight.',
  },
  {
    tail: 'N801AD', station: 'KBOS', hub: 'Boston Hub', overnight: false,
    position: 'Main Gear L/H Inboard', pressure_psi: 193, nominal_psi: 195,
    pct_life: 44, tread_mm: 6.9, cycles_remaining: 240, status: 'OK',
    notification: 'All parameters within limits. No overnight action required.',
  },
];

const TIRE_STATUS_CFG = {
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/40',    dot: 'bg-red-500',    label: 'CRITICAL' },
  WARNING:  { color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/40',  dot: 'bg-amber-500',  label: 'WARNING' },
  MONITOR:  { color: 'text-sky-400',    bg: 'bg-sky-500/20',    border: 'border-sky-500/30',    dot: 'bg-sky-500',    label: 'MONITOR' },
  OK:       { color: 'text-emerald-400',bg: 'bg-emerald-500/20',border: 'border-emerald-500/30',dot: 'bg-emerald-500',label: 'OK' },
};

function TireNotificationCard({ alert }) {
  const cfg = TIRE_STATUS_CFG[alert.status] || TIRE_STATUS_CFG.OK;
  const pressurePct = Math.round((alert.pressure_psi / alert.nominal_psi) * 100);
  const pressureColor = pressurePct < 85 ? 'text-red-400' : pressurePct < 95 ? 'text-amber-400' : 'text-emerald-400';
  const lifeColor = alert.pct_life >= 85 ? 'text-red-400' : alert.pct_life >= 70 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className={cn('bg-[#0f1624] border rounded-2xl p-5 space-y-4', cfg.border)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">{alert.tail}</span>
          <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
            <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5', cfg.dot)} />{cfg.label}
          </span>
          {alert.overnight && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Moon className="w-3 h-3" /> OVERNIGHT ACTION
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <MapPin className="w-3 h-3" /> {alert.station} · {alert.hub}
        </div>
      </div>

      {/* Position */}
      <div>
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Tire Position</p>
        <p className="text-sm font-bold text-white mt-0.5">{alert.position}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#141c2e] rounded-xl px-3 py-2.5 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Pressure</p>
          <p className={cn('text-lg font-black mt-0.5', pressureColor)}>{alert.pressure_psi}</p>
          <p className="text-[9px] text-slate-500">/{alert.nominal_psi} PSI</p>
        </div>
        <div className="bg-[#141c2e] rounded-xl px-3 py-2.5 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Life Used</p>
          <p className={cn('text-lg font-black mt-0.5', lifeColor)}>{alert.pct_life}%</p>
          <p className="text-[9px] text-slate-500">of cycle</p>
        </div>
        <div className="bg-[#141c2e] rounded-xl px-3 py-2.5 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Tread</p>
          <p className="text-lg font-black text-sky-400 mt-0.5">{alert.tread_mm}</p>
          <p className="text-[9px] text-slate-500">mm remain</p>
        </div>
        <div className="bg-[#141c2e] rounded-xl px-3 py-2.5 text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Cycles Left</p>
          <p className="text-lg font-black text-white mt-0.5">{alert.cycles_remaining}</p>
          <p className="text-[9px] text-slate-500">est.</p>
        </div>
      </div>

      {/* Life bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Operational Life Cycle</span>
          <span className={lifeColor}>{alert.pct_life}% consumed</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${alert.pct_life}%`, background: alert.pct_life >= 85 ? '#ef4444' : alert.pct_life >= 70 ? '#f59e0b' : '#22c55e' }} />
        </div>
      </div>

      {/* Notification */}
      <div className={cn('rounded-xl px-4 py-3 flex items-start gap-2.5 border', cfg.bg, cfg.border)}>
        <Bell className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cfg.color)} />
        <div>
          <p className={cn('text-[10px] font-extrabold uppercase tracking-widest mb-0.5', cfg.color)}>
            {alert.overnight ? `${alert.station} Overnight Notification` : 'Informational Alert'}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">{alert.notification}</p>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'maintenance', label: 'Maintenance Predictions', icon: Wrench },
  { id: 'parts',       label: 'Parts Demand',            icon: Package },
  { id: 'tires',       label: 'Tire Monitoring',         icon: CircleDot },
  { id: 'reliability', label: 'Reliability Metrics',    icon: Activity },
  { id: 'performance', label: 'Performance Insights',   icon: BarChart2 },
  { id: 'swaps',       label: 'Aircraft Swaps',         icon: ArrowLeftRight },
];

export default function AIForecastingDashboard() {
  const [activeTab, setActiveTab] = useState('maintenance');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['aif-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white pb-24">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#0a0f1e] px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/Home" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-violet-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider text-white">AI FORECASTING</h1>
              <p className="text-xs text-slate-400 mt-0.5">Predictive Analytics & Maintenance Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className={cn('w-4 h-4 text-slate-400', isRefreshing && 'animate-spin')} />
            </button>
            {/* AI Status */}
            <div className="flex flex-col items-center bg-[#0f1624] border border-white/10 rounded-xl px-4 py-2 min-w-[100px]">
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">AI Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-black text-emerald-400">ACTIVE</span>
              </div>
            </div>
            {/* Data Points */}
            <div className="flex flex-col items-center bg-[#0f1624] border border-white/10 rounded-xl px-4 py-2 min-w-[110px]">
              <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Data Points</p>
              <p className="text-sm font-black text-sky-400 mt-1">2.8M+</p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mt-5 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#141c2e] border border-white/8 text-slate-400 hover:text-white'
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Banner ── */}
      <div className="mx-6 mt-5 bg-gradient-to-r from-violet-900/30 to-sky-900/20 border border-violet-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Brain className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-violet-300">AI-Powered Predictions</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            These forecasts are generated using machine learning models trained on historical maintenance data, flight operations, and system health indicators. All predictions should be validated by qualified maintenance personnel before taking action.
          </p>
        </div>
      </div>

      <div className="px-6 mt-5 space-y-5">

        {/* ══ MAINTENANCE PREDICTIONS TAB ══ */}
        {activeTab === 'maintenance' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-wider text-white uppercase">Maintenance Predictions</h2>
              <span className="text-[11px] text-slate-500 font-bold">{PREDICTIONS.length} active predictions</span>
            </div>
            <div className="space-y-3">
              {PREDICTIONS.map((pred, i) => <PredictionCard key={i} pred={pred} />)}
            </div>
          </>
        )}

        {/* ══ PARTS DEMAND TAB ══ */}
        {activeTab === 'parts' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-wider text-white uppercase">Predicted Parts Demand</h2>
              <span className="text-[11px] text-slate-500 font-bold">Next 90 days</span>
            </div>
            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Predicted Orders', value: '23', color: 'text-violet-400', icon: Package },
                { label: 'Estimated Spend', value: '$142K', color: 'text-sky-400', icon: DollarSign },
                { label: 'AOG Risk Parts', value: '4', color: 'text-rose-400', icon: AlertTriangle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-[#0f1624] border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-3">
                  <Icon className={cn('w-5 h-5', color)} />
                  <div>
                    <p className={cn('text-2xl font-black', color)}>{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {PARTS_DEMAND.map((part, i) => (
                <div key={i} className="bg-[#0f1624] border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge level={part.urgency} />
                      <span className="text-[10px] text-slate-500">Qty: <span className="text-white font-bold">{part.qty}</span></span>
                    </div>
                    <p className="text-sm font-bold text-white">{part.part}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ETA: {part.eta}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {part.cost}</span>
                    </div>
                  </div>
                  <ConfidenceRing value={part.confidence} color={part.urgency === 'HIGH' ? '#ef4444' : part.urgency === 'MEDIUM' ? '#f59e0b' : '#22c55e'} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ TIRE MONITORING TAB ══ */}
        {activeTab === 'tires' && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-violet-400" /> Tire Inspection & Pressure Monitoring
              </h2>
              <span className="text-[11px] text-slate-500 font-bold">Hub Overnight Notifications</span>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Critical', value: TIRE_ALERTS.filter(a => a.status === 'CRITICAL').length, color: 'text-red-400', icon: AlertTriangle },
                { label: 'Warning',  value: TIRE_ALERTS.filter(a => a.status === 'WARNING').length,  color: 'text-amber-400', icon: Clock },
                { label: 'Overnight Action', value: TIRE_ALERTS.filter(a => a.overnight).length, color: 'text-indigo-400', icon: Moon },
                { label: 'Hubs Monitored', value: new Set(TIRE_ALERTS.map(a => a.station)).size, color: 'text-sky-400', icon: MapPin },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-[#0f1624] border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-3">
                  <Icon className={cn('w-5 h-5', color)} />
                  <div>
                    <p className={cn('text-2xl font-black', color)}>{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Overnight-action-first sort */}
            <div className="space-y-3">
              {[...TIRE_ALERTS].sort((a, b) => {
                const order = { CRITICAL: 0, WARNING: 1, MONITOR: 2, OK: 3 };
                return (order[a.status] ?? 4) - (order[b.status] ?? 4);
              }).map((alert, i) => (
                <TireNotificationCard key={i} alert={alert} />
              ))}
            </div>
          </>
        )}

        {/* ══ RELIABILITY METRICS TAB ══ */}
        {activeTab === 'reliability' && (
          <>
            <h2 className="text-lg font-black tracking-wider text-white uppercase">Reliability Metrics</h2>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Dispatch Reliability" value="99.1%" color="text-emerald-400" icon={CheckCircle} sub="Last 30 days" trend="+0.3%" trendDir="up" sparkData={SPARKLINE_UP} />
              <MetricCard label="MTBF (Avg)" value="1,847h" color="text-sky-400" icon={Clock} sub="Fleet average" trend="+12h" trendDir="up" sparkData={SPARKLINE_UP} />
              <MetricCard label="AOG Events" value="3" color="text-rose-400" icon={AlertTriangle} sub="Last 30 days" trend="-2" trendDir="up" sparkData={SPARKLINE_DOWN} />
              <MetricCard label="Predictive Accuracy" value="88.4%" color="text-violet-400" icon={Target} sub="Model accuracy" trend="+1.2%" trendDir="up" sparkData={SPARKLINE_UP} />
            </div>

            {/* Reliability trend chart */}
            <div className="bg-[#0f1624] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4">Dispatch Reliability Rate — 6 Months</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={RELIABILITY_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reliGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[96, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Area type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#reliGrad)" dot={{ fill: '#8b5cf6', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* System health bars */}
            <div className="bg-[#0f1624] border border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-extrabold text-white">Fleet System Health Index</p>
              {SYSTEM_HEALTH.map(({ system, health, color }) => (
                <div key={system} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">{system}</span>
                    <span className="font-extrabold" style={{ color }}>{health}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${health}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ PERFORMANCE INSIGHTS TAB ══ */}
        {activeTab === 'performance' && (
          <>
            <h2 className="text-lg font-black tracking-wider text-white uppercase">Performance Insights</h2>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Avg Fuel Burn" value="6.2 t/h" color="text-amber-400" icon={Zap} sub="Fleet average" trend="-0.1 t/h" trendDir="up" sparkData={SPARKLINE_DOWN} />
              <MetricCard label="On-Time Perf" value="91.3%" color="text-emerald-400" icon={TrendingUp} sub="Last 30 days" trend="+2.1%" trendDir="up" sparkData={SPARKLINE_UP} />
              <MetricCard label="Delay Cost (Est)" value="$318K" color="text-rose-400" icon={DollarSign} sub="Month to date" trend="-$42K" trendDir="up" sparkData={SPARKLINE_DOWN} />
              <MetricCard label="Preventive vs Reactive" value="74% / 26%" color="text-sky-400" icon={BarChart2} sub="Maintenance split" sparkData={SPARKLINE_UP} />
            </div>
            <div className="bg-[#0f1624] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4">Fault Events by ATA Chapter (Last 90 Days)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { ata: '29', count: 18 }, { ata: '72', count: 12 }, { ata: '32', count: 9 },
                  { ata: '34', count: 14 }, { ata: '49', count: 7 }, { ata: '27', count: 11 }, { ata: '24', count: 6 },
                ]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="ata" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f1624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ══ AIRCRAFT SWAPS TAB ══ */}
        {activeTab === 'swaps' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-wider text-white uppercase">Aircraft Swap Recommendations</h2>
              <span className="text-[11px] text-slate-500 font-bold">{SWAP_RECOMMENDATIONS.length} recommendations</span>
            </div>
            <div className="space-y-4">
              {SWAP_RECOMMENDATIONS.map((swap, i) => (
                <div key={i} className="bg-[#0f1624] border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">{swap.from}</span>
                    <ArrowLeftRight className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">{swap.to}</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">{swap.route}</span>
                  </div>
                  <p className="text-sm text-slate-300">{swap.reason}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <DollarSign className="w-3 h-3" /> Est. saving: {swap.saving}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Confidence</span>
                      <span className={cn('text-sm font-black', swap.confidence >= 85 ? 'text-emerald-400' : 'text-amber-400')}>{swap.confidence}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-xs font-extrabold hover:bg-violet-500 transition-colors">
                      Accept Recommendation
                    </button>
                    <button className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-extrabold hover:bg-white/10 transition-colors">
                      Dismiss
                    </button>
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