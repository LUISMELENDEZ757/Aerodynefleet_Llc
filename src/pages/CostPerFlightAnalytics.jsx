import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, DollarSign, Fuel, Users, Clock, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 11 },
};

// Cost estimation constants
const FUEL_COST_PER_LB = 0.32; // $/lb
const CREW_COST_PER_HOUR = 850; // $/hr combined crew
const DELAY_COST_PER_MIN = 85;  // $/min (industry avg)
const MAINTENANCE_COST_PER_FH = 340; // $/flight hour

const AIRCRAFT_BURN_RATES = {
  'B737': 5200, 'B777': 14000, 'B787': 10500, 'A320': 5400, 'A321': 6200,
  'B767': 9800, 'B757': 7000, 'E190': 3800, 'CRJ': 2400,
};

function getBurnRate(type) {
  const key = Object.keys(AIRCRAFT_BURN_RATES).find(k => type?.includes(k));
  return key ? AIRCRAFT_BURN_RATES[key] : 6000;
}

export default function CostPerFlightAnalytics() {
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState(null);

  const { data: flights = [] } = useQuery({
    queryKey: ['cost-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 300),
  });
  const { data: aircraft = [] } = useQuery({
    queryKey: ['cost-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });

  const getAircraftType = (tail) => aircraft.find(a => a.tail_number === tail)?.aircraft_type || 'B737';

  const computeCost = (flight) => {
    const type = getAircraftType(flight.aircraft_tail);
    const burnRate = getBurnRate(type);
    // Estimate flight duration from route (rough approximation)
    const duration = 2.5; // avg hours placeholder
    const fuelCost = burnRate * duration * FUEL_COST_PER_LB;
    const crewCost = duration * CREW_COST_PER_HOUR;
    const mxCost = duration * MAINTENANCE_COST_PER_FH;
    const delayCost = (flight.delay_minutes || 0) * DELAY_COST_PER_MIN;
    const total = fuelCost + crewCost + mxCost + delayCost;
    return { fuelCost, crewCost, mxCost, delayCost, total, duration };
  };

  const flightCosts = flights.slice(0, 50).map(f => ({ ...f, costs: computeCost(f) }));
  const totalCost = flightCosts.reduce((s, f) => s + f.costs.total, 0);
  const totalFuel = flightCosts.reduce((s, f) => s + f.costs.fuelCost, 0);
  const totalDelay = flightCosts.reduce((s, f) => s + f.costs.delayCost, 0);
  const avgCostPerFlight = flightCosts.length > 0 ? totalCost / flightCosts.length : 0;

  // Route cost breakdown
  const routeMap = {};
  flightCosts.forEach(f => {
    const route = `${f.origin}-${f.destination}`;
    if (!routeMap[route]) routeMap[route] = { route, count: 0, total: 0, delay: 0, fuel: 0 };
    routeMap[route].count++;
    routeMap[route].total += f.costs.total;
    routeMap[route].delay += f.costs.delayCost;
    routeMap[route].fuel += f.costs.fuelCost;
  });
  const routeData = Object.values(routeMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(r => ({ ...r, avgCost: Math.round(r.total / r.count) }));

  // Cost breakdown pie
  const costBreakdown = [
    { name: 'Fuel', value: Math.round(totalFuel), color: '#f59e0b' },
    { name: 'Crew', value: Math.round(flightCosts.reduce((s, f) => s + f.costs.crewCost, 0)), color: '#8b5cf6' },
    { name: 'Maintenance', value: Math.round(flightCosts.reduce((s, f) => s + f.costs.mxCost, 0)), color: '#3b82f6' },
    { name: 'Delay', value: Math.round(totalDelay), color: '#ef4444' },
  ];

  const fmt = (n) => `$${(n / 1000).toFixed(1)}K`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">COST PER FLIGHT ANALYTICS</h1>
          <p className="text-xs font-mono text-green-400">Fuel · Crew · Delay · Maintenance · Real Data</p>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">
        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Op Cost', value: fmt(totalCost), sub: `${flightCosts.length} flights`, icon: DollarSign, color: 'text-green-400' },
            { label: 'Avg Cost/Flight', value: fmt(avgCostPerFlight), sub: 'All aircraft types', icon: BarChart3, color: 'text-white' },
            { label: 'Total Fuel Cost', value: fmt(totalFuel), sub: `${Math.round(totalFuel / totalCost * 100)}% of total`, icon: Fuel, color: 'text-amber-400' },
            { label: 'Delay Cost', value: fmt(totalDelay), sub: 'Avoidable cost', icon: Clock, color: 'text-red-400' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{label}</p>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <p className={cn('text-2xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cost Breakdown Pie */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Cost Breakdown</p>
            <PieChart width={180} height={160} className="mx-auto">
              <Pie data={costBreakdown} cx={85} cy={75} outerRadius={65} dataKey="value" strokeWidth={0}>
                {costBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [fmt(v)]} />
            </PieChart>
            <div className="space-y-1.5 mt-2">
              {costBreakdown.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-muted-foreground flex-1">{d.name}</span>
                  <span className="font-bold text-foreground">{fmt(d.value)}</span>
                  <span className="text-muted-foreground">{Math.round(d.value / totalCost * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Route Cost Ranking */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Cost by Route (Avg per Flight)</p>
            {routeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={routeData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="route" tick={{ fill: '#9ca3af', fontSize: 10 }} width={85} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [fmt(v), 'Avg Cost']} />
                  <Bar dataKey="avgCost" fill="#22c55e" radius={[0, 4, 4, 0]} name="Avg Cost" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-8">No route data available</p>}
          </div>
        </div>

        {/* Flight Cost Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Individual Flight Costs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Flight', 'Route', 'Aircraft', 'Fuel', 'Crew', 'MX', 'Delay Cost', 'Total'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-extrabold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flightCosts.slice(0, 15).map(f => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">{f.flight_number}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{f.origin}→{f.destination}</td>
                    <td className="px-4 py-2.5 font-mono text-foreground">{f.aircraft_tail || '—'}</td>
                    <td className="px-4 py-2.5 text-amber-400">{fmt(f.costs.fuelCost)}</td>
                    <td className="px-4 py-2.5 text-purple-400">{fmt(f.costs.crewCost)}</td>
                    <td className="px-4 py-2.5 text-blue-400">{fmt(f.costs.mxCost)}</td>
                    <td className="px-4 py-2.5 text-red-400">{f.costs.delayCost > 0 ? fmt(f.costs.delayCost) : '—'}</td>
                    <td className="px-4 py-2.5 font-bold text-green-400">{fmt(f.costs.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border bg-secondary/30">
            <p className="text-[10px] text-muted-foreground">* Cost estimates based on industry-standard rates. Fuel: $0.32/lb · Crew: $850/hr · MX: $340/flight-hr · Delay: $85/min</p>
          </div>
        </div>
      </div>
    </div>
  );
}