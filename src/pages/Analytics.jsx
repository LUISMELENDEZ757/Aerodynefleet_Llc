import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Plane, Users, Clock, RefreshCw,
  AlertTriangle, CheckCircle, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

const TODAY = new Date().toISOString().split('T')[0];
const COLORS = ['hsl(var(--primary))', '#60a5fa', '#f97316', '#ef4444', '#a78bfa', '#34d399'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-xl font-extrabold font-mono', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className={cn('text-[11px]', color)}>{sub}</p>}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'otp',   label: 'On-Time Perf' },
  { key: 'delay', label: 'Delay Analysis' },
  { key: 'crew',  label: 'Crew Utilization' },
  { key: 'fleet', label: 'Fleet Status' },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('otp');

  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ['analytics-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 200),
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['analytics-crew'],
    queryFn: () => base44.entities.CrewAssignment.list('-flight_date', 200),
  });

  const { data: oos = [] } = useQuery({
    queryKey: ['analytics-oos'],
    queryFn: () => base44.entities.OOSEntry.list(),
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['analytics-releases'],
    queryFn: () => base44.entities.DispatchRelease.list('-flight_date', 200),
  });

  // OTP calculations
  const completed = flights.filter(f => ['arrived', 'airborne', 'departed'].includes(f.status));
  const onTime = completed.filter(f => !f.delay_minutes || f.delay_minutes < 15);
  const delayed = flights.filter(f => f.status === 'delayed' || f.delay_minutes >= 15);
  const cancelled = flights.filter(f => f.status === 'cancelled');
  const otpRate = completed.length ? ((onTime.length / completed.length) * 100).toFixed(1) : '—';

  // Delay reason breakdown
  const delayCodes = {};
  delayed.forEach(f => {
    const reason = f.delay_reason || 'Unspecified';
    delayCodes[reason] = (delayCodes[reason] || 0) + 1;
  });
  const delayData = Object.entries(delayCodes).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  // Delay duration breakdown
  const delayBuckets = [
    { label: '0–15m', count: flights.filter(f => (f.delay_minutes || 0) > 0 && (f.delay_minutes || 0) <= 15).length },
    { label: '15–30m', count: flights.filter(f => (f.delay_minutes || 0) > 15 && (f.delay_minutes || 0) <= 30).length },
    { label: '30–60m', count: flights.filter(f => (f.delay_minutes || 0) > 30 && (f.delay_minutes || 0) <= 60).length },
    { label: '60–120m', count: flights.filter(f => (f.delay_minutes || 0) > 60 && (f.delay_minutes || 0) <= 120).length },
    { label: '>120m', count: flights.filter(f => (f.delay_minutes || 0) > 120).length },
  ];

  // Crew utilization
  const crewByRole = {};
  crew.forEach(c => { crewByRole[c.role] = (crewByRole[c.role] || 0) + 1; });
  const crewData = Object.entries(crewByRole).map(([name, value]) => ({ name, value }));

  const illegal = crew.filter(c => c.legal_status === 'illegal').length;
  const nearLimit = crew.filter(c => c.legal_status === 'near_limit').length;
  const legalCrewPct = crew.length ? (((crew.length - illegal - nearLimit) / crew.length) * 100).toFixed(0) : '100';

  // OOS fleet status
  const inWork = oos.filter(o => o.status === 'in_work').length;
  const waitingParts = oos.filter(o => o.status === 'waiting_on_parts').length;
  const released = oos.filter(o => o.status === 'released').length;
  const fleetStatusData = [
    { name: 'In Work', value: inWork },
    { name: 'Waiting Parts', value: waitingParts },
    { name: 'Released', value: released },
    { name: 'Deferred', value: oos.filter(o => o.status === 'deferred').length },
  ].filter(d => d.value > 0);

  // Dispatch release rate
  const releasedCount = releases.filter(r => r.release_status === 'released').length;
  const releaseRate = releases.length ? ((releasedCount / releases.length) * 100).toFixed(0) : '—';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <BarChart3 className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">ANALYTICS</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">OTP · Delays · Crew · Fleet Intelligence</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={refetch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Plane}          label="OTP Rate"         value={`${otpRate}%`}       color={parseFloat(otpRate) >= 80 ? 'text-green-400' : 'text-orange-400'} sub="On-time departure" />
          <StatCard icon={AlertTriangle}  label="Delays"           value={delayed.length}      color={delayed.length > 0 ? 'text-orange-400' : 'text-muted-foreground'} />
          <StatCard icon={Users}          label="Crew Legal"        value={`${legalCrewPct}%`}  color={legalCrewPct >= 95 ? 'text-green-400' : 'text-orange-400'} />
          <StatCard icon={CheckCircle}    label="Release Rate"     value={`${releaseRate}%`}   color="text-primary" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}>{t.label}</button>
          ))}
        </div>

        {/* OTP Tab */}
        {activeTab === 'otp' && (
          <div className="space-y-4">
            {/* OTP donut */}
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Flight Status Breakdown</p>
              {flights.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No flight data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[
                      { name: 'On Time', value: onTime.length },
                      { name: 'Delayed', value: delayed.length },
                      { name: 'Cancelled', value: cancelled.length },
                      { name: 'Scheduled', value: flights.filter(f => f.status === 'scheduled').length },
                    ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" nameKey="name"
                    >
                      {[...Array(4)].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* OTP summary grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Flights', value: flights.length, color: 'text-foreground' },
                { label: 'On-Time (<15m)', value: onTime.length, color: 'text-green-400' },
                { label: 'Cancelled', value: cancelled.length, color: 'text-destructive' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delay Analysis Tab */}
        {activeTab === 'delay' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Delay Reasons</p>
              {delayData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No delay data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={delayData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={90} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Flights" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Delay Duration Distribution</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={delayBuckets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Flights" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Crew Utilization Tab */}
        {activeTab === 'crew' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Legal', value: crew.filter(c => !c.legal_status || c.legal_status === 'legal').length, color: 'text-green-400' },
                { label: 'Near Limit', value: nearLimit, color: 'text-orange-400' },
                { label: 'Illegal', value: illegal, color: 'text-destructive' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assignments by Role</p>
              {crewData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No crew data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={crewData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                      {crewData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Fleet Tab */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">MX / OOS Status</p>
              {fleetStatusData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No MX data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={fleetStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                      {fleetStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* OOS table */}
            {oos.length > 0 && (
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-2 bg-secondary/60 border-b border-border">
                  <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Active OOS Entries</p>
                </div>
                <div className="divide-y divide-border/30 max-h-64 overflow-y-auto">
                  {oos.filter(o => o.status !== 'released').map(o => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-xs font-mono font-bold text-foreground">{o.tail_number}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{o.work_description}</p>
                      </div>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                        o.status === 'in_work' ? 'bg-orange-500/15 text-orange-400' :
                        o.status === 'waiting_on_parts' ? 'bg-destructive/15 text-destructive' :
                        'bg-muted text-muted-foreground'
                      )}>{o.status?.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}