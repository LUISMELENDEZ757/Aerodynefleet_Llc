import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, RefreshCw, Plane, AlertTriangle, Users, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#f97316'];

function MetricCard({ icon: IconComponent, label, value, trend, color }) {
  return (
    <div className={cn('rounded-xl border p-4 space-y-2', color)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold opacity-75 uppercase tracking-widest">{label}</p>
        {IconComponent && <IconComponent className="w-4 h-4 opacity-60" />}
      </div>
      <p className="text-3xl font-extrabold font-mono">{value}</p>
      {trend && <p className="text-xs opacity-70">{trend}</p>}
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: flights = [], refetch: refetchFlights, isLoading } = useQuery({
    queryKey: ['analytics-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 500),
    refetchInterval: 30000,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['analytics-crew'],
    queryFn: () => base44.entities.CrewAssignment.list('-created_date', 300),
    refetchInterval: 30000,
  });

  const { data: oos = [] } = useQuery({
    queryKey: ['analytics-oos'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 300),
    refetchInterval: 30000,
  });

  // Calculate metrics
  const completed = flights.filter(f => ['arrived', 'landed'].includes(f.status)).length;
  const onTime = flights.filter(f => (f.delay_minutes || 0) < 15).length;
  const delayed = flights.filter(f => (f.delay_minutes || 0) >= 15).length;
  const cancelled = flights.filter(f => f.status === 'cancelled').length;
  const otp = completed > 0 ? ((onTime / completed) * 100).toFixed(1) : 0;

  const crewLegal = crew.filter(c => !c.legal_status || c.legal_status === 'legal').length;
  const crewNearLimit = crew.filter(c => c.legal_status === 'near_limit').length;
  const crewIllegal = crew.filter(c => c.legal_status === 'illegal').length;

  const fleetActive = flights.length;
  const fleetMx = oos.filter(o => o.status !== 'released').length;
  const fleetReady = fleetActive - fleetMx;

  // Delay breakdown
  const delayData = {};
  flights.filter(f => f.delay_minutes > 0).forEach(f => {
    const reason = f.delay_reason || 'Unspecified';
    delayData[reason] = (delayData[reason] || 0) + 1;
  });
  const delayChartData = Object.entries(delayData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Status breakdown
  const statusData = [
    { name: 'On-Time', value: onTime, color: COLORS[0] },
    { name: 'Delayed', value: delayed, color: COLORS[1] },
    { name: 'Cancelled', value: cancelled, color: COLORS[2] },
  ].filter(d => d.value > 0);

  // Crew breakdown
  const crewData = [
    { name: 'Legal', value: crewLegal, color: COLORS[0] },
    { name: 'Near Limit', value: crewNearLimit, color: COLORS[1] },
    { name: 'Illegal', value: crewIllegal, color: COLORS[2] },
  ].filter(d => d.value > 0);

  // Fleet breakdown
  const fleetData = [
    { name: 'Ready', value: fleetReady, color: COLORS[0] },
    { name: 'In MX', value: fleetMx, color: COLORS[2] },
  ].filter(d => d.value > 0);

  const TAB_LIST = [
    { id: 'overview', label: 'Overview' },
    { id: 'delays', label: 'Delays' },
    { id: 'crew', label: 'Crew' },
    { id: 'fleet', label: 'Fleet' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <BarChart3 className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">ANALYTICS</h1>
            <p className="text-xs font-mono text-muted-foreground">Operational Metrics & Trends</p>
          </div>
        </div>
        <button onClick={() => refetchFlights()} className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-5">
        <MetricCard icon={Plane} label="OTP Rate" value={`${otp}%`} color="bg-card border-border" />
        <MetricCard icon={AlertTriangle} label="Delayed" value={delayed} color="bg-card border-border" />
        <MetricCard icon={Users} label="Crew Legal" value={`${crew.length > 0 ? ((crewLegal / crew.length) * 100).toFixed(0) : 0}%`} color="bg-card border-border" />
        <MetricCard icon={Wrench} label="Fleet Active" value={fleetReady} color="bg-card border-border" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-6 border-b border-border">
        {TAB_LIST.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-bold border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Flight Status */}
            {statusData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-sm font-extrabold mb-4">Flight Status Distribution</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                      {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Flights</p>
                <p className="text-2xl font-extrabold font-mono text-foreground">{flights.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">On-Time</p>
                <p className="text-2xl font-extrabold font-mono text-green-400">{onTime}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
                <p className="text-2xl font-extrabold font-mono text-red-400">{cancelled}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delays' && (
          <div className="space-y-6">
            {delayChartData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-sm font-extrabold mb-4">Top Delay Reasons</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={delayChartData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-sm font-extrabold mb-4">Delay Duration Breakdown</h2>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: '0-15m', count: flights.filter(f => (f.delay_minutes || 0) > 0 && (f.delay_minutes || 0) <= 15).length },
                  { label: '15-30m', count: flights.filter(f => (f.delay_minutes || 0) > 15 && (f.delay_minutes || 0) <= 30).length },
                  { label: '30-60m', count: flights.filter(f => (f.delay_minutes || 0) > 30 && (f.delay_minutes || 0) <= 60).length },
                  { label: '60-120m', count: flights.filter(f => (f.delay_minutes || 0) > 60 && (f.delay_minutes || 0) <= 120).length },
                  { label: '>120m', count: flights.filter(f => (f.delay_minutes || 0) > 120).length },
                ].map(d => (
                  <div key={d.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{d.label}</p>
                    <p className="text-xl font-extrabold font-mono">{d.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crew' && (
          <div className="space-y-6">
            {crewData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-sm font-extrabold mb-4">Crew Legality Status</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={crewData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                      {crewData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Legal</p>
                <p className="text-2xl font-extrabold font-mono text-green-400">{crewLegal}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Near Limit</p>
                <p className="text-2xl font-extrabold font-mono text-amber-400">{crewNearLimit}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Illegal</p>
                <p className="text-2xl font-extrabold font-mono text-red-400">{crewIllegal}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-6">
            {fleetData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-sm font-extrabold mb-4">Fleet Status</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={fleetData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                      {fleetData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Ready</p>
                <p className="text-2xl font-extrabold font-mono text-green-400">{fleetReady}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">In Maintenance</p>
                <p className="text-2xl font-extrabold font-mono text-orange-400">{fleetMx}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}