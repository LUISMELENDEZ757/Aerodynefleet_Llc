import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, RefreshCw, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TODAY = new Date().toISOString().split('T')[0];

const DELAY_RATES = {
  crew_overtime: 480,
  fuel_burn: 12,
  gate_fee: 200,
  pax_meal: 15,
  pax_hotel: 180,
};

function calcCost(delayMins, paxCount, reason) {
  const crewOT = delayMins > 30 ? Math.ceil((delayMins - 30) / 60) * DELAY_RATES.crew_overtime : 0;
  const fuel = delayMins * DELAY_RATES.fuel_burn;
  const gate = delayMins > 15 ? Math.ceil(delayMins / 60) * DELAY_RATES.gate_fee : 0;
  const meals = delayMins > 60 ? paxCount * DELAY_RATES.pax_meal : 0;
  const hotel = delayMins > 240 ? Math.floor(paxCount * 0.15) * DELAY_RATES.pax_hotel : 0;
  const total = crewOT + fuel + gate + meals + hotel;
  return { crew_overtime_cost: crewOT, fuel_burn_cost: fuel, gate_fee_cost: gate, pax_meal_vouchers: meals, pax_hotel_cost: hotel, total_cost: total, cost_per_minute: Math.round(total / Math.max(delayMins, 1)) };
}

function NewDelayModal({ flights, onSave, onClose }) {
  const [form, setForm] = useState({ flight_number: '', delay_minutes: 0, pax_count: 150, delay_reason: '', delay_code: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const computed = calcCost(Number(form.delay_minutes) || 0, Number(form.pax_count) || 0, form.delay_reason);

  const handleSubmit = () => {
    onSave({ ...form, ...computed, flight_date: TODAY, status: 'estimated', delay_minutes: Number(form.delay_minutes), pax_count: Number(form.pax_count) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <p className="text-sm font-bold text-foreground">Log Delay Cost</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Flight</label>
            <select value={form.flight_number} onChange={e => set('flight_number', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              <option value="">Select flight...</option>
              {flights.map(f => <option key={f.id} value={f.flight_number}>{f.flight_number} ({f.origin}→{f.destination})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Delay (minutes)</label>
            <input type="number" value={form.delay_minutes} onChange={e => set('delay_minutes', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">PAX Count</label>
            <input type="number" value={form.pax_count} onChange={e => set('pax_count', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Delay Reason</label>
            <input value={form.delay_reason} onChange={e => set('delay_reason', e.target.value)}
              placeholder="e.g. Weather, MX, Crew" 
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
        </div>

        {Number(form.delay_minutes) > 0 && (
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5">
            <p className="text-xs font-bold text-foreground mb-2">Estimated Cost Breakdown</p>
            {[
              { label: 'Crew Overtime', value: computed.crew_overtime_cost },
              { label: 'APU/Fuel Burn', value: computed.fuel_burn_cost },
              { label: 'Gate Fees', value: computed.gate_fee_cost },
              { label: 'PAX Meals', value: computed.pax_meal_vouchers },
              { label: 'PAX Hotels', value: computed.pax_hotel_cost },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn('font-mono font-semibold', value > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                  ${value.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-1.5 flex justify-between">
              <span className="text-xs font-bold text-foreground">TOTAL</span>
              <span className="text-sm font-extrabold font-mono text-primary">${computed.total_cost.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">${computed.cost_per_minute}/min</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={handleSubmit} className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors">
            Log Cost
          </button>
          <button onClick={onClose} className="flex-1 h-10 border border-border text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DelayCostTracker() {
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: flights = [] } = useQuery({
    queryKey: ['dc-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const { data: costs = [], refetch } = useQuery({
    queryKey: ['delay-costs'],
    queryFn: () => base44.entities.DelayCost.list('-flight_date', 50),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DelayCost.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delay-costs'] }); setShowNew(false); },
  });

  const totalCost = costs.reduce((s, c) => s + (c.total_cost || 0), 0);
  const totalDelayMins = costs.reduce((s, c) => s + (c.delay_minutes || 0), 0);
  const avgCostPerMin = costs.length > 0 ? Math.round(costs.reduce((s, c) => s + (c.cost_per_minute || 0), 0) / costs.length) : 0;

  const chartData = costs.slice(0, 10).map(c => ({
    name: c.flight_number,
    cost: c.total_cost || 0,
    delay: c.delay_minutes || 0,
  })).reverse();

  const reasonBreakdown = {};
  costs.forEach(c => {
    const r = c.delay_reason || 'Unknown';
    reasonBreakdown[r] = (reasonBreakdown[r] || 0) + (c.total_cost || 0);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <DollarSign className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">DELAY COST TRACKER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Real-Time Cost · Crew · Fuel · PAX</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Total Delay Cost</p>
            <p className="text-2xl font-extrabold font-mono text-destructive">${totalCost.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Total Delay</p>
            <p className="text-2xl font-extrabold font-mono text-orange-400">{totalDelayMins} min</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Cost/Min</p>
            <p className="text-2xl font-extrabold font-mono text-foreground">${avgCostPerMin}</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Events Logged</p>
            <p className="text-2xl font-extrabold font-mono text-primary">{costs.length}</p>
          </div>
        </div>

        <button onClick={() => setShowNew(true)}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary/15 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/25 transition-colors">
          <Plus className="w-4 h-4" /> Log Delay Cost
        </button>

        {chartData.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost by Flight</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Cost']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="cost" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {Object.keys(reasonBreakdown).length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost by Reason</p>
            <div className="space-y-2">
              {Object.entries(reasonBreakdown).sort((a, b) => b[1] - a[1]).map(([reason, cost]) => {
                const pct = Math.round((cost / totalCost) * 100);
                return (
                  <div key={reason}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-semibold">{reason}</span>
                      <span className="font-mono text-muted-foreground">${cost.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Recent Events</p>
          {costs.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No delay costs logged yet
            </div>
          ) : (
            costs.map(c => (
              <div key={c.id} className="rounded-xl bg-card border border-border px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{c.flight_number} <span className="text-muted-foreground font-normal text-xs">· {c.flight_date}</span></p>
                  <p className="text-xs text-muted-foreground">{c.delay_minutes} min · {c.delay_reason || 'No reason'} · {c.pax_count} PAX</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold font-mono text-destructive">${(c.total_cost || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">${c.cost_per_minute || 0}/min</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showNew && <NewDelayModal flights={flights} onSave={(d) => createMutation.mutate(d)} onClose={() => setShowNew(false)} />}
    </div>
  );
}