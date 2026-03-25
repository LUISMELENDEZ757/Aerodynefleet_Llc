import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { DollarSign, RefreshCw, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#3b82f6', '#f59e0b', '#10b981'];

export default function CostReporting() {
  const [period, setPeriod] = useState('30');

  const { data: delayCosts = [], refetch } = useQuery({
    queryKey: ['cost-delay'],
    queryFn: () => base44.entities.DelayCost.list('-flight_date', 100),
    refetchInterval: 60000,
  });

  const { data: fuelRecords = [] } = useQuery({
    queryKey: ['cost-fuel'],
    queryFn: () => base44.entities.FuelRecord.list('-flight_date', 100),
  });

  // Aggregate delay costs
  const totalDelayCost = delayCosts.reduce((s, r) => s + (r.total_cost || 0), 0);
  const totalDelayMin = delayCosts.reduce((s, r) => s + (r.delay_minutes || 0), 0);
  const avgCostPerMin = totalDelayMin > 0 ? totalDelayCost / totalDelayMin : 0;
  const tankeringSavings = fuelRecords.reduce((s, r) => s + (r.tankering_savings || 0), 0);

  // Delay cost breakdown by reason
  const byReason = {};
  delayCosts.forEach(r => {
    const reason = r.delay_reason || 'Unknown';
    byReason[reason] = (byReason[reason] || 0) + (r.total_cost || 0);
  });
  const reasonData = Object.entries(byReason)
    .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Per-flight cost bar chart
  const flightData = delayCosts.slice(0, 10).map(r => ({
    flight: r.flight_number || '—',
    cost: Math.round(r.total_cost || 0),
    delay: r.delay_minutes || 0,
  })).reverse();

  // Cost breakdown pie
  const pieData = delayCosts.length > 0 ? [
    { name: 'Crew OT', value: Math.round(delayCosts.reduce((s, r) => s + (r.crew_overtime_cost || 0), 0)) },
    { name: 'Fuel', value: Math.round(delayCosts.reduce((s, r) => s + (r.fuel_burn_cost || 0), 0)) },
    { name: 'Gate Fee', value: Math.round(delayCosts.reduce((s, r) => s + (r.gate_fee_cost || 0), 0)) },
    { name: 'PAX Meals', value: Math.round(delayCosts.reduce((s, r) => s + (r.pax_meal_vouchers || 0), 0)) },
    { name: 'PAX Hotel', value: Math.round(delayCosts.reduce((s, r) => s + (r.pax_hotel_cost || 0), 0)) },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <DollarSign className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">COST REPORTING</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Delays · Fuel Savings · P&L Overview</p>
            </div>
          </div>
          <button onClick={refetch} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-card border border-destructive/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Total Delay Cost</p>
            <p className="text-xl font-extrabold text-destructive">${(totalDelayCost / 1000).toFixed(1)}K</p>
          </div>
          <div className="rounded-xl bg-card border border-orange-500/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Avg $/Minute</p>
            <p className="text-xl font-extrabold text-orange-400">${avgCostPerMin.toFixed(0)}</p>
          </div>
          <div className="rounded-xl bg-card border border-green-500/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Tankering Savings</p>
            <p className="text-xl font-extrabold text-green-400">${(tankeringSavings / 1000).toFixed(1)}K</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Events Tracked</p>
            <p className="text-xl font-extrabold text-foreground">{delayCosts.length}</p>
          </div>
        </div>

        {/* Per-flight cost chart */}
        {flightData.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Delay Cost per Flight ($)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={flightData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="flight" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="cost" fill="hsl(var(--destructive))" name="Cost ($)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Two column: Pie + By Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pieData.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost Breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {reasonData.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost by Delay Reason</p>
              <div className="space-y-2">
                {reasonData.map((r, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate">{r.name}</span>
                      <span className="font-mono font-bold text-foreground">${r.value.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(r.value / reasonData[0].value) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {delayCosts.length === 0 && (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No cost data yet. Log delay costs via the Delay Cost Tracker.
          </div>
        )}
      </div>
    </div>
  );
}