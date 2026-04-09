import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Activity, AlertTriangle, Plane, TrendingUp, Clock, CheckCircle,
  BarChart3, Brain, Zap, Package, CloudLightning, DollarSign,
  Shield, ArrowRight, RefreshCw, Loader2, Link as LinkIcon
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// ── Constants ──────────────────────────────────────────────────
const ADVANCED_FEATURES = [
  { title: 'AI Dispatch Co-Pilot', desc: 'Real-time LLM assistant', path: '/AIDispatchCopilot', icon: Brain, color: 'border-violet-500/40 bg-violet-500/10 text-violet-400' },
  { title: 'AOG Forecast', desc: 'Predict AOG risk', path: '/AOGForecast', icon: Zap, color: 'border-red-500/40 bg-red-500/10 text-red-400' },
  { title: 'One-Click Diversion', desc: 'Full diversion package', path: '/DiversionWorkflow', icon: AlertTriangle, color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
  { title: 'SIGMET Monitor', desc: 'Live weather hazards', path: '/SIGMETMap', icon: CloudLightning, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { title: 'FAR 117 Calculator', desc: 'Crew duty & fatigue', path: '/FAR117', icon: Shield, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
  { title: 'OTP Analytics', desc: 'On-time performance', path: '/OTPDashboard', icon: BarChart3, color: 'border-primary/40 bg-primary/10 text-primary' },
  { title: 'Cost Per Flight', desc: 'Operational economics', path: '/CostAnalytics', icon: DollarSign, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { title: 'Predictive Parts', desc: 'AI-driven procurement', path: '/PredictiveParts', icon: Package, color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
];

const TOOLTIP_STYLE = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 },
};

// ── KPI Card ───────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sublabel, color, loading = false }) {
  return (
    <div className={cn('bg-card border rounded-2xl p-4 flex flex-col gap-2', color)}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{label}</p>
        {loading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Icon className="w-4 h-4" />}
      </div>
      <p className="text-3xl font-black leading-none tracking-tight">{loading ? '—' : value}</p>
      <p className="text-[10px] text-muted-foreground">{sublabel}</p>
    </div>
  );
}

// ── Feature Card ───────────────────────────────────────────────
function FeatureCard({ title, desc, path, icon: Icon, color }) {
  const [bgColor, textColor, borderColor] = color.split(' ');
  return (
    <Link to={path} className={cn('bg-card border rounded-2xl p-4 hover:scale-[1.02] transition-all active:scale-[0.98] group', borderColor)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-5 h-5', textColor)} />
        </div>
        <ArrowRight className={cn('w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity', textColor)} />
      </div>
      <p className="text-sm font-extrabold text-foreground mb-0.5">{title}</p>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
    </Link>
  );
}

// ── Stats Panel ────────────────────────────────────────────────
function StatsPanel({ label, stats, loading }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ title, value, color }) => (
          <div key={title} className="bg-secondary/50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-muted-foreground">{title}</p>
            <p className={cn('text-lg font-black', color)}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function AocsDashboard() {
  const today = new Date().toISOString().split('T')[0];

  // Data fetching with optimized queries
  const { data: flights = [], isLoading: flightsLoading } = useQuery({
    queryKey: ['aocs-flights', today],
    queryFn: () => base44.entities.Flight.filter({ flight_date: today }, '-scheduled_departure', 500),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const { data: aircraft = [], isLoading: aircraftLoading } = useQuery({
    queryKey: ['aocs-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: melItems = [], isLoading: melLoading } = useQuery({
    queryKey: ['aocs-mel'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 500),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: faults = [], isLoading: faultsLoading } = useQuery({
    queryKey: ['aocs-faults'],
    queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }, '-detected_at', 1000),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Compute metrics with memoization
  const metrics = useMemo(() => {
    const totalFlights = flights.length;
    const onTimeFlights = flights.filter(f => (f.delay_minutes || 0) < 15).length;
    const delayedFlights = flights.filter(f => (f.delay_minutes || 0) >= 15 && f.status !== 'cancelled').length;
    const cancelledFlights = flights.filter(f => f.status === 'cancelled').length;
    const otp = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0;

    const activeAircraft = aircraft.filter(a => a.status === 'active').length;
    const oosAircraft = aircraft.filter(a => a.status === 'oos').length;
    const maintenanceAircraft = aircraft.filter(a => a.status === 'maintenance').length;
    const etopsReady = aircraft.filter(a => a.etops_approval && a.etops_approval >= 120).length;
    const catReady = aircraft.filter(a => a.cat_approval && ['CAT IIIa', 'CAT IIIb', 'CAT IIIc'].includes(a.cat_approval)).length;

    const openMel = melItems.filter(m => m.status === 'open' || m.status === 'expiring_soon').length;
    const expiredMel = melItems.filter(m => m.status === 'expired').length;
    const activeFaults = faults.length;

    // Delay drivers
    const delayMap = {};
    flights.filter(f => (f.delay_minutes || 0) >= 15).forEach(f => {
      const reason = (f.delay_reason || 'Other').toLowerCase();
      const category = reason.includes('weather') ? 'Weather'
        : reason.includes('maint') || reason.includes('mx') ? 'Maintenance'
        : reason.includes('crew') ? 'Crew'
        : reason.includes('atc') ? 'ATC' : 'Other';
      delayMap[category] = (delayMap[category] || 0) + (f.delay_minutes || 15);
    });
    const delayData = Object.entries(delayMap).map(([name, minutes]) => ({ name, minutes }))
      .sort((a, b) => b.minutes - a.minutes);

    // Status distribution
    const statusCounts = {
      scheduled: flights.filter(f => f.status === 'scheduled').length,
      departed: flights.filter(f => f.status === 'departed' || f.status === 'airborne').length,
      arrived: flights.filter(f => f.status === 'arrived' || f.status === 'landed').length,
      cancelled: cancelledFlights,
    };
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return {
      totalFlights, onTimeFlights, delayedFlights, cancelledFlights, otp,
      activeAircraft, oosAircraft, maintenanceAircraft, etopsReady, catReady,
      openMel, expiredMel, activeFaults,
      delayData, statusData,
    };
  }, [flights, aircraft, melItems, faults]);

  const loading = flightsLoading || aircraftLoading || melLoading || faultsLoading;

  return (
    <div className="min-h-screen bg-background pb-24 p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.2em]">Aerodyne Fleet LLC</p>
          <h1 className="text-3xl font-black text-foreground">AOCS Operations Hub</h1>
          <p className="text-xs text-muted-foreground mt-1">Enterprise operations control system · Real-time fleet oversight</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full animate-pulse', loading ? 'bg-amber-400' : 'bg-green-400')} />
          <span className={cn('text-xs font-bold uppercase tracking-widest', loading ? 'text-amber-400' : 'text-green-400')}>
            {loading ? 'Syncing' : 'Live'}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Activity} label="OTP%" value={`${metrics.otp}%`} sublabel={`${metrics.totalFlights} flights`} 
          color={metrics.otp >= 85 ? 'border-green-500/20' : metrics.otp >= 70 ? 'border-amber-500/20' : 'border-red-500/20'} loading={loading} />
        <KpiCard icon={Plane} label="Active Aircraft" value={metrics.activeAircraft} sublabel={`${metrics.oosAircraft} OOS`} 
          color={metrics.oosAircraft > 3 ? 'border-orange-500/20' : 'border-green-500/20'} loading={loading} />
        <KpiCard icon={AlertTriangle} label="Active Faults" value={metrics.activeFaults} sublabel={`${metrics.openMel} MEL`} 
          color={metrics.activeFaults > 10 ? 'border-red-500/20' : metrics.activeFaults > 5 ? 'border-amber-500/20' : 'border-green-500/20'} loading={loading} />
        <KpiCard icon={Clock} label="Delayed Today" value={metrics.delayedFlights} sublabel={`${metrics.cancelledFlights} cancelled`} 
          color={metrics.delayedFlights > 10 ? 'border-red-500/20' : metrics.delayedFlights > 5 ? 'border-amber-500/20' : 'border-green-500/20'} loading={loading} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsPanel label="Flight Operations" stats={[
          { title: 'Total', value: metrics.totalFlights, color: 'text-white' },
          { title: 'On Time', value: metrics.onTimeFlights, color: 'text-green-400' },
          { title: 'Delayed', value: metrics.delayedFlights, color: metrics.delayedFlights > 0 ? 'text-amber-400' : 'text-gray-500' },
          { title: 'Cancelled', value: metrics.cancelledFlights, color: metrics.cancelledFlights > 0 ? 'text-red-400' : 'text-gray-500' },
        ]} loading={loading} />

        <StatsPanel label="Fleet Health" stats={[
          { title: 'Active', value: metrics.activeAircraft, color: 'text-green-400' },
          { title: 'OOS/AOG', value: metrics.oosAircraft, color: metrics.oosAircraft > 0 ? 'text-red-400' : 'text-gray-500' },
          { title: 'ETOPS Ready', value: metrics.etopsReady, color: 'text-blue-400' },
          { title: 'CAT III Ready', value: metrics.catReady, color: 'text-cyan-400' },
        ]} loading={loading} />

        <StatsPanel label="Maintenance Status" stats={[
          { title: 'Open MEL', value: metrics.openMel, color: metrics.openMel > 10 ? 'text-amber-400' : 'text-white' },
          { title: 'Expired MEL', value: metrics.expiredMel, color: metrics.expiredMel > 0 ? 'text-red-400' : 'text-gray-500' },
          { title: 'Active Faults', value: metrics.activeFaults, color: metrics.activeFaults > 10 ? 'text-red-400' : metrics.activeFaults > 5 ? 'text-amber-400' : 'text-white' },
          { title: 'In Maintenance', value: metrics.maintenanceAircraft, color: 'text-orange-400' },
        ]} loading={loading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Delay Drivers */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Delay Drivers (Minutes)</p>
          {metrics.delayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.delayData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={100} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="minutes" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No delays recorded</div>
          )}
        </div>

        {/* Flight Status Distribution */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Flight Status Distribution</p>
          {metrics.statusData.length > 0 && metrics.statusData.some(s => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={metrics.statusData.filter(s => s.value > 0)} cx="50%" cy="50%" outerRadius={60} dataKey="value" label>
                  {[
                    { dataKey: 'scheduled', fill: '#3b82f6' },
                    { dataKey: 'departed', fill: '#8b5cf6' },
                    { dataKey: 'arrived', fill: '#10b981' },
                    { dataKey: 'cancelled', fill: '#ef4444' },
                  ].map((cfg, i) => <Cell key={`cell-${i}`} fill={cfg.fill} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No flight data</div>
          )}
        </div>
      </div>

      {/* Advanced Features Section */}
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Advanced Capabilities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ADVANCED_FEATURES.map(({ title, desc, path, icon: Icon, color }) => (
            <FeatureCard key={path} title={title} desc={desc} path={path} icon={Icon} color={color} />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-muted-foreground font-mono">
        AOCS v3.0 · Last updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · Enterprise Operations Control System
      </div>
    </div>
  );
}