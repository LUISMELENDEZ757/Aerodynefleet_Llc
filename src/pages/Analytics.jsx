import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Plane, Users, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#f97316'];

function StatCard({ icon: IconComp, label, value, sub, color }) {
  return (
    <div className={cn('rounded-xl border p-4 space-y-1', color)}>
      <div className="flex items-center gap-2">
        {IconComp && <IconComp className="w-4 h-4" />}
        <p className="text-2xl font-extrabold font-mono">{value}</p>
      </div>
      <p className="text-xs opacity-70">{label}</p>
      {sub && <p className="text-[10px] opacity-80">{sub}</p>}
    </div>
  );
}

const TABS = [
  { key: 'otp', label: 'On-Time' },
  { key: 'delay', label: 'Delays' },
  { key: 'crew', label: 'Crew' },
  { key: 'fleet', label: 'Fleet' },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('otp');

  const { data: flights = [], refetch, isLoading } = useQuery({
    queryKey: ['analytics-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 200),
    refetchInterval: 30000,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['analytics-crew'],
    queryFn: () => base44.entities.CrewAssignment.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: oos = [] } = useQuery({
    queryKey: ['analytics-oos'],
    queryFn: () => base44.entities.OOSEntry.list(),
    refetchInterval: 30000,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['analytics-releases'],
    queryFn: () => base44.entities.DispatchRelease.list('-flight_date', 200),
    refetchInterval: 30000,
  });

  const completed = flights.filter(f => ['arrived', 'airborne', 'departed'].includes(f.status));
  const onTime = completed.filter(f => !f.delay_minutes || f.delay_minutes < 15);
  const delayed = flights.filter(f => f.status === 'delayed' || (f.delay_minutes || 0) >= 15);
  const cancelled = flights.filter(f => f.status === 'cancelled');
  const otpRate = completed.length ? ((onTime.length / completed.length) * 100).toFixed(1) : 0;

  const delayCodes = {};
  delayed.forEach(f => {
    const reason = f.delay_reason || 'Unspecified';
    delayCodes[reason] = (delayCodes[reason] || 0) + 1;
  });
  const delayData = Object.entries(delayCodes).map(([name, value]) => ({ name, value })).slice(0, 6);

  const crewByRole = {};
  crew.forEach(c => { crewByRole[c.role] = (crewByRole[c.role] || 0) + 1; });
  const crewData = Object.entries(crewByRole).map(([name, value]) => ({ name, value }));

  const illegal = crew.filter(c => c.legal_status === 'illegal').length;
  const nearLimit = crew.filter(c => c.legal_status === 'near_limit').length;
  const legalPct = crew.length ? (((crew.length - illegal - nearLimit) / crew.length) * 100).toFixed(0) : 100;

  const inWork = oos.filter(o => o.status === 'in_work').length;
  const waitingParts = oos.filter(o => o.status === 'waiting_on_parts').length;
  const released = oos.filter(o => o.status === 'released').length;
  const fleetStatusData = [
    { name: 'In Work', value: inWork },
    { name: 'Waiting Parts', value: waitingParts },
    { name: 'Released', value: released },
  ].filter(d => d.value > 0);

  const releasedCount = releases.filter(r => r.release_status === 'released').length;
  const releaseRate = releases.length ? ((releasedCount / releases.length) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0e18]">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <BarChart3 className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-base font-extrabold">ANALYTICS</p>
            <p className="text-[10px] text-lime-400 tracking-widest uppercase">OTP · Delays · Crew · Fleet</p>
          </div>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-xs font-bold bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-5">
        <StatCard icon={Plane} label="OTP Rate" value={`${otpRate}%`} sub={`${completed.length} flights`} color={parseFloat(otpRate) >= 80 ? "bg-green-600/15 border-green-600/30 text-green-400" : "bg-amber-600/15 border-amber-600/30 text-amber-400"} />
        <StatCard icon={AlertTriangle} label="Delays" value={delayed.length} color={delayed.length > 0 ? "bg-amber-600/15 border-amber-600/30 text-amber-400" : "bg-green-600/15 border-green-600/30 text-green-400"} />
        <StatCard icon={Users} label="Crew Legal" value={`${legalPct}%`} color={legalPct >= 95 ? "bg-green-600/15 border-green-600/30 text-green-400" : "bg-amber-600/15 border-amber-600/30 text-amber-400"} />
        <StatCard icon={CheckCircle} label="Release Rate" value={`${releaseRate}%`} color="bg-blue-600/15 border-blue-600/30 text-blue-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold',
              activeTab === t.key ? 'bg-lime-500 text-white' : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 mt-5 space-y-5">
        {activeTab === 'otp' && (
          <>
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold mb-4">Flight Status Breakdown</p>
              {flights.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[
                      { name: 'On Time', value: onTime.length },
                      { name: 'Delayed', value: delayed.length },
                      { name: 'Cancelled', value: cancelled.length },
                      { name: 'Scheduled', value: flights.filter(f => f.status === 'scheduled').length },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                      {[...Array(4)].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs opacity-70 mb-1">Total Flights</p>
                <p className="text-2xl font-extrabold font-mono">{flights.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs opacity-70 mb-1">On-Time</p>
                <p className="text-2xl font-extrabold font-mono text-green-400">{onTime.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs opacity-70 mb-1">Cancelled</p>
                <p className="text-2xl font-extrabold font-mono text-red-400">{cancelled.length}</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'delay' && (
          <>
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold mb-4">Delay Reasons</p>
              {delayData.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">No delays</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={delayData} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} width={90} />
                    <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold mb-4">Delay Duration</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[
                  { label: '0-15m', count: flights.filter(f => (f.delay_minutes || 0) > 0 && (f.delay_minutes || 0) <= 15).length },
                  { label: '15-30m', count: flights.filter(f => (f.delay_minutes || 0) > 15 && (f.delay_minutes || 0) <= 30).length },
                  { label: '30-60m', count: flights.filter(f => (f.delay_minutes || 0) > 30 && (f.delay_minutes || 0) <= 60).length },
                  { label: '60-120m', count: flights.filter(f => (f.delay_minutes || 0) > 60 && (f.delay_minutes || 0) <= 120).length },
                  { label: '>120m', count: flights.filter(f => (f.delay_minutes || 0) > 120).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === 'crew' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs opacity-70 mb-1">Legal</p>
                <p className="text-2xl font-extrabold font-mono text-green-400">{crew.filter(c => !c.legal_status || c.legal_status === 'legal').length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs opacity-70 mb-1">Near Limit</p>
                <p className="text-2xl font-extrabold font-mono text-amber-400">{nearLimit}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs opacity-70 mb-1">Illegal</p>
                <p className="text-2xl font-extrabold font-mono text-red-400">{illegal}</p>
              </div>
            </div>
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold mb-4">Crew by Role</p>
              {crewData.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">No crew data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={crewData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                      {crewData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {activeTab === 'fleet' && (
          <>
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold mb-4">MX / OOS Status</p>
              {fleetStatusData.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">No MX data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={fleetStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                      {fleetStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {oos.length > 0 && (
              <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-4 py-2 bg-secondary/60 border-b border-border">
                  <p className="text-xs font-bold uppercase">Active OOS</p>
                </div>
                <div className="divide-y divide-border/30 max-h-64 overflow-y-auto">
                  {oos.filter(o => o.status !== 'released').map(o => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-xs font-mono font-bold">{o.tail_number}</p>
                        <p className="text-xs opacity-70 truncate max-w-[180px]">{o.work_description}</p>
                      </div>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                        o.status === 'in_work' ? 'bg-orange-500/20 text-orange-400' :
                        o.status === 'waiting_on_parts' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                      )}>{o.status?.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}