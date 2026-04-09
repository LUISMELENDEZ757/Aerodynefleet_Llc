import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, TrendingUp, TrendingDown, Clock, Plane, AlertTriangle, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 },
};

const DELAY_COLORS = { Weather: '#3b82f6', Maintenance: '#f59e0b', Crew: '#8b5cf6', ATC: '#06b6d4', Other: '#6b7280' };
const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280'];

export default function OTPDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState('7d');

  const { data: flights = [] } = useQuery({
    queryKey: ['otp-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 500),
  });

  // Compute OTP stats from real data
  const total = flights.length;
  const onTime = flights.filter(f => (f.delay_minutes || 0) < 15).length;
  const delayed = flights.filter(f => (f.delay_minutes || 0) >= 15 && f.status !== 'cancelled').length;
  const cancelled = flights.filter(f => f.status === 'cancelled').length;
  const otp = total > 0 ? Math.round((onTime / total) * 100) : 0;
  const avgDelay = flights.length > 0
    ? Math.round(flights.filter(f => (f.delay_minutes || 0) >= 15).reduce((s, f) => s + (f.delay_minutes || 0), 0) / Math.max(delayed, 1))
    : 0;

  // Delay reasons breakdown
  const reasonMap = {};
  flights.filter(f => (f.delay_minutes || 0) >= 15).forEach(f => {
    const r = f.delay_reason || 'Other';
    const cat = r.toLowerCase().includes('weather') ? 'Weather'
      : r.toLowerCase().includes('maint') || r.toLowerCase().includes('mx') ? 'Maintenance'
      : r.toLowerCase().includes('crew') ? 'Crew'
      : r.toLowerCase().includes('atc') || r.toLowerCase().includes('air traffic') ? 'ATC'
      : 'Other';
    reasonMap[cat] = (reasonMap[cat] || 0) + 1;
  });
  const reasonData = Object.entries(reasonMap).map(([name, value]) => ({ name, value }));

  // Daily OTP trend (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayFlights = flights.filter(f => f.flight_date === dateStr);
    const dayOnTime = dayFlights.filter(f => (f.delay_minutes || 0) < 15).length;
    const otp = dayFlights.length > 0 ? Math.round((dayOnTime / dayFlights.length) * 100) : 0;
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      otp,
      flights: dayFlights.length,
    };
  });

  // Station performance
  const stationMap = {};
  flights.forEach(f => {
    const s = f.origin || 'UNK';
    if (!stationMap[s]) stationMap[s] = { total: 0, onTime: 0, delay: 0 };
    stationMap[s].total++;
    if ((f.delay_minutes || 0) < 15) stationMap[s].onTime++;
    else stationMap[s].delay += (f.delay_minutes || 0);
  });
  const stationData = Object.entries(stationMap)
    .map(([station, d]) => ({ station, otp: Math.round((d.onTime / d.total) * 100), total: d.total, avgDelay: Math.round(d.delay / Math.max(d.total - d.onTime, 1)) }))
    .sort((a, b) => a.otp - b.otp)
    .slice(0, 8);

  const pieData = [
    { name: 'On Time', value: onTime },
    { name: 'Delayed', value: delayed },
    { name: 'Cancelled', value: cancelled },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">OTP PERFORMANCE</h1>
          <p className="text-xs font-mono text-primary tracking-widest">On-Time Performance · Root Cause Analysis</p>
        </div>
        <div className="ml-auto flex gap-2">
          {['7d', '30d', '90d'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', range === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'OTP Rate', value: `${otp}%`, color: otp >= 85 ? 'text-green-400' : otp >= 70 ? 'text-amber-400' : 'text-red-400', target: '85%', icon: Target },
            { label: 'Total Flights', value: total, color: 'text-white', icon: Plane },
            { label: 'On Time', value: onTime, color: 'text-green-400', icon: CheckCircle2 },
            { label: 'Delayed', value: delayed, color: delayed > 0 ? 'text-amber-400' : 'text-gray-500', icon: Clock },
            { label: 'Avg Delay', value: `${avgDelay}m`, color: avgDelay > 30 ? 'text-red-400' : 'text-amber-400', icon: AlertTriangle },
          ].map(({ label, value, color, target, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
              <p className={cn('text-3xl font-black', color)}>{value}</p>
              {target && <p className="text-[10px] text-muted-foreground mt-1">Target: {target}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* OTP Trend */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">OTP Trend (7-Day)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'OTP']} />
                <Line type="monotone" dataKey="otp" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} name="OTP %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie breakdown */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Flight Status Breakdown</p>
            {pieData.length > 0 ? (
              <>
                <PieChart width={180} height={160} className="mx-auto">
                  <Pie data={pieData} cx={85} cy={75} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
                <div className="space-y-1 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground flex-1">{d.name}</span>
                      <span className="font-bold text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-muted-foreground text-sm text-center py-8">No flight data</p>}
          </div>
        </div>

        {/* Delay Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Delay Root Causes</p>
            {reasonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reasonData} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Delays">
                    {reasonData.map((d, i) => <Cell key={i} fill={DELAY_COLORS[d.name] || '#6b7280'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-8">No delay data available</p>}
          </div>

          {/* Station OTP */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Station Performance</p>
            {stationData.length > 0 ? (
              <div className="space-y-2">
                {stationData.map(s => (
                  <div key={s.station} className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-foreground w-12">{s.station}</span>
                    <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', s.otp >= 85 ? 'bg-green-500' : s.otp >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                        style={{ width: `${s.otp}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-bold w-12 text-right', s.otp >= 85 ? 'text-green-400' : s.otp >= 70 ? 'text-amber-400' : 'text-red-400')}>{s.otp}%</span>
                    <span className="text-[10px] text-muted-foreground w-10">{s.total} flt</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm text-center py-8">No station data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
}