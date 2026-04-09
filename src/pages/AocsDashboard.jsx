import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, Plane, Clock, BarChart3, Brain, Zap, Package,
  CloudLightning, DollarSign, Shield, ArrowRight, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';

const ADVANCED_MODULES = [
  { title: 'AI Dispatch Copilot', desc: 'Real-time LLM decision support', path: '/AIDispatchCopilot', icon: Brain, colors: 'border-violet-500/40 bg-violet-500/10 text-violet-400' },
  { title: 'AOG Probability', desc: '24/72h failure forecast', path: '/AOGForecast', icon: Zap, colors: 'border-red-500/40 bg-red-500/10 text-red-400' },
  { title: 'Diversion Workflow', desc: 'One-click emergency reroute', path: '/DiversionWorkflow', icon: AlertTriangle, colors: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
  { title: 'SIGMET Monitor', desc: 'Live weather hazard tracking', path: '/SIGMETMap', icon: CloudLightning, colors: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { title: 'FAR 117 Calc', desc: 'Crew duty & fatigue risk', path: '/FAR117', icon: Shield, colors: 'border-green-500/40 bg-green-500/10 text-green-400' },
  { title: 'OTP Analytics', desc: 'On-time performance metrics', path: '/OTPDashboard', icon: BarChart3, colors: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
  { title: 'Cost Analysis', desc: 'Per-flight economics', path: '/CostAnalytics', icon: DollarSign, colors: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { title: 'Predictive Parts', desc: 'AI maintenance planning', path: '/PredictiveParts', icon: Package, colors: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
];

const TOOLTIP_CONFIG = {
  contentStyle: { background: '#0f1419', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: 10 },
  cursor: { fill: 'rgba(255,255,255,0.1)' },
};

function MetricCard({ icon: Icon, label, value, unit, trend, color, loading }) {
  return (
    <div className={cn('bg-gradient-to-br from-card to-card/50 border rounded-2xl p-4 flex flex-col gap-2', color)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{label}</p>
        {loading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Icon className="w-4 h-4" />}
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-4xl font-black">{value}</p>
        {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
      </div>
      {trend && <p className={cn('text-xs font-semibold', trend > 0 ? 'text-red-400' : 'text-green-400')}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
      </p>}
    </div>
  );
}

function ModuleCard({ title, desc, path, icon: Icon, colors }) {
  return (
    <Link to={path} className={cn('bg-card border rounded-2xl p-4 hover:shadow-lg hover:scale-105 transition-all active:scale-95 group', colors.split(' ')[0])}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform', colors.split(' ')[1])}>
        <Icon className={cn('w-5 h-5', colors.split(' ')[2])} />
      </div>
      <p className="text-sm font-bold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
      <div className="flex items-center gap-1 mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Open <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

export default function AocsDashboard() {
  const today = new Date().toISOString().split('T')[0];

  // Real-time data queries
  const { data: flights = [], isLoading: flightsLoading } = useQuery({
    queryKey: ['aocs-flights-live', today],
    queryFn: () => base44.entities.Flight.filter({ flight_date: today }, '-scheduled_departure', 1000),
    refetchInterval: 20000,
    staleTime: 10000,
  });

  const { data: aircraft = [], isLoading: aircraftLoading } = useQuery({
    queryKey: ['aocs-aircraft-live'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 1000),
    refetchInterval: 45000,
    staleTime: 20000,
  });

  const { data: melItems = [], isLoading: melLoading } = useQuery({
    queryKey: ['aocs-mel-live'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 1000),
    refetchInterval: 45000,
    staleTime: 20000,
  });

  const { data: faults = [], isLoading: faultsLoading } = useQuery({
    queryKey: ['aocs-faults-live'],
    queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }, '-detected_at', 2000),
    refetchInterval: 15000,
    staleTime: 5000,
  });

  // Compute operational metrics
  const metrics = useMemo(() => {
    const total = flights.length;
    const onTime = flights.filter(f => (f.delay_minutes || 0) < 15).length;
    const delayed = flights.filter(f => (f.delay_minutes || 0) >= 15 && f.status !== 'cancelled').length;
    const cancelled = flights.filter(f => f.status === 'cancelled').length;
    const otp = total > 0 ? Math.round((onTime / total) * 100) : 0;
    const avgDelay = delayed > 0 ? Math.round(flights.filter(f => f.delay_minutes).reduce((sum, f) => sum + (f.delay_minutes || 0), 0) / delayed) : 0;

    const activeAc = aircraft.filter(a => a.status === 'active').length;
    const oosAc = aircraft.filter(a => a.status === 'oos').length;
    const mxAc = aircraft.filter(a => a.status === 'maintenance').length;
    const etopsReady = aircraft.filter(a => a.etops_approval && a.etops_approval >= 120).length;
    const cat3Ready = aircraft.filter(a => a.cat_approval && a.cat_approval.includes('III')).length;

    const openMel = melItems.filter(m => ['open', 'expiring_soon'].includes(m.status)).length;
    const expiredMel = melItems.filter(m => m.status === 'expired').length;
    const activeFaults = faults.length;

    // Delay drivers analysis
    const delayMap = {};
    flights.filter(f => (f.delay_minutes || 0) >= 15).forEach(f => {
      const reason = (f.delay_reason || 'Other').toLowerCase();
      const cat = reason.includes('weather') ? 'Weather'
        : reason.includes('maint') || reason.includes('mx') ? 'Maintenance'
        : reason.includes('crew') ? 'Crew'
        : reason.includes('atc') ? 'ATC' : 'Other';
      delayMap[cat] = (delayMap[cat] || 0) + (f.delay_minutes || 15);
    });
    const delayData = Object.entries(delayMap).map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes);

    return { total, onTime, delayed, cancelled, otp, avgDelay, activeAc, oosAc, mxAc, etopsReady, cat3Ready, openMel, expiredMel, activeFaults, delayData };
  }, [flights, aircraft, melItems, faults]);

  const loading = flightsLoading || aircraftLoading || melLoading || faultsLoading;

  return (
    <div className="min-h-screen bg-background pb-32 p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest">AERODYNE FLEET LLC</p>
          <h1 className="text-4xl font-black text-foreground mt-1">AOCS Operations Hub</h1>
          <p className="text-sm text-muted-foreground mt-2">Enterprise-grade real-time fleet control system</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-2">
            <span className={cn('w-2.5 h-2.5 rounded-full animate-pulse', loading ? 'bg-amber-500' : 'bg-green-500')} />
            <span className={cn('text-xs font-bold uppercase', loading ? 'text-amber-400' : 'text-green-400')}>
              {loading ? 'Synchronizing' : 'Live Data'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={Activity}
          label="OTP Today"
          value={`${metrics.otp}%`}
          color={metrics.otp >= 85 ? 'border-green-500/30 bg-green-500/5' : metrics.otp >= 70 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}
          loading={loading}
        />
        <MetricCard
          icon={Plane}
          label="Active Fleet"
          value={metrics.activeAc}
          unit={`of ${aircraft.length}`}
          color={metrics.oosAc > 5 ? 'border-orange-500/30 bg-orange-500/5' : 'border-blue-500/30 bg-blue-500/5'}
          loading={loading}
        />
        <MetricCard
          icon={AlertTriangle}
          label="System Faults"
          value={metrics.activeFaults}
          color={metrics.activeFaults > 15 ? 'border-red-500/30 bg-red-500/5' : metrics.activeFaults > 5 ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'}
          loading={loading}
        />
        <MetricCard
          icon={Clock}
          label="Avg Delay"
          value={metrics.avgDelay}
          unit="min"
          color={metrics.avgDelay > 30 ? 'border-red-500/30 bg-red-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}
          loading={loading}
        />
      </div>

      {/* Operations Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Flight Operations</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total', value: metrics.total, color: 'text-white' },
              { label: 'On Time', value: metrics.onTime, color: 'text-green-400' },
              { label: 'Delayed', value: metrics.delayed, color: metrics.delayed > 0 ? 'text-amber-400' : 'text-gray-500' },
              { label: 'Cancelled', value: metrics.cancelled, color: metrics.cancelled > 0 ? 'text-red-400' : 'text-gray-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={cn('text-lg font-black', color)}>{loading ? '—' : value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Fleet Health</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active', value: metrics.activeAc, color: 'text-green-400' },
              { label: 'OOS/AOG', value: metrics.oosAc, color: metrics.oosAc > 0 ? 'text-red-400' : 'text-gray-500' },
              { label: 'ETOPS', value: metrics.etopsReady, color: 'text-blue-400' },
              { label: 'CAT III', value: metrics.cat3Ready, color: 'text-cyan-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={cn('text-lg font-black', color)}>{loading ? '—' : value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Maintenance</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Open MEL', value: metrics.openMel, color: metrics.openMel > 15 ? 'text-amber-400' : 'text-white' },
              { label: 'Expired MEL', value: metrics.expiredMel, color: metrics.expiredMel > 0 ? 'text-red-400' : 'text-gray-500' },
              { label: 'In MX', value: metrics.mxAc, color: 'text-orange-400' },
              { label: 'Faults', value: metrics.activeFaults, color: metrics.activeFaults > 10 ? 'text-red-400' : metrics.activeFaults > 5 ? 'text-amber-400' : 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={cn('text-lg font-black', color)}>{loading ? '—' : value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delay Analysis Chart */}
      <div className="bg-card border border-border/50 rounded-2xl p-5">
        <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Delay Root Causes</h3>
        {metrics.delayData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.delayData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={100} />
              <Tooltip {...TOOLTIP_CONFIG} />
              <Bar dataKey="minutes" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground">No delay data</div>
        )}
      </div>

      {/* Advanced Modules */}
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Advanced Modules</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ADVANCED_MODULES.map(({ title, desc, path, icon: Icon, colors }) => (
            <ModuleCard key={path} title={title} desc={desc} path={path} icon={Icon} colors={colors} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground font-mono pt-8 border-t border-border">
        AOCS v4.0 Enterprise · Next sync in {Math.floor(Math.random() * 10) + 5}s
      </div>
    </div>
  );
}