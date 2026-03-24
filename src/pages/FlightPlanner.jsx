import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Navigation2, RefreshCw, Plus, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const FILING_COLORS = {
  not_filed: { label: 'Not Filed', color: 'text-muted-foreground', bg: 'bg-muted' },
  filed:     { label: 'Filed', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  accepted:  { label: 'Accepted', color: 'text-green-400', bg: 'bg-green-500/15' },
  amended:   { label: 'Amended', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  cancelled: { label: 'Cancelled', color: 'text-destructive', bg: 'bg-destructive/15' },
};

const CLEARANCE_COLORS = {
  not_received: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted' },
  received:     { label: 'Received', color: 'text-green-400', bg: 'bg-green-500/15' },
  void:         { label: 'VOID', color: 'text-destructive', bg: 'bg-destructive/15' },
  amended:      { label: 'Amended', color: 'text-orange-400', bg: 'bg-orange-500/15' },
};

function PlanCard({ plan, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const fs = FILING_COLORS[plan.filing_status] || FILING_COLORS.not_filed;
  const cs = CLEARANCE_COLORS[plan.clearance_status] || CLEARANCE_COLORS.not_received;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-3">
          <Navigation2 className="w-4 h-4 text-primary" />
          <div className="text-left">
            <p className="text-sm font-mono font-bold text-foreground">{plan.flight_number}</p>
            <p className="text-xs text-muted-foreground">{plan.origin} → {plan.destination} · {plan.aircraft_type || plan.aircraft_tail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', fs.bg, fs.color)}>{fs.label}</span>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cs.bg, cs.color)}>{cs.label}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-3 bg-secondary/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'ETD', value: plan.etd || '—' },
              { label: 'ETE', value: plan.ete || '—' },
              { label: 'Cruise Alt', value: plan.cruise_altitude || '—' },
              { label: 'Speed', value: plan.cruise_speed || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-mono font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {plan.filed_route && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Filed Route</p>
              <p className="text-xs font-mono text-foreground bg-background/40 rounded-lg px-3 py-2 break-all">{plan.filed_route}</p>
            </div>
          )}

          {plan.clearance_route && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Clearance Route</p>
              <p className="text-xs font-mono text-foreground bg-background/40 rounded-lg px-3 py-2 break-all">{plan.clearance_route}</p>
            </div>
          )}

          {plan.clearance_status === 'received' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Cleared Alt', value: plan.clearance_altitude || '—' },
                { label: 'Squawk', value: plan.clearance_squawk || '—' },
                { label: 'Dep Freq', value: plan.clearance_departure_freq || '—' },
                { label: 'Alternate', value: plan.alternate || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-mono font-bold text-green-400">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {plan.filing_status !== 'accepted' && (
              <button onClick={() => onUpdate(plan.id, { filing_status: 'filed' })}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">
                Mark Filed
              </button>
            )}
            {plan.filing_status === 'filed' && (
              <button onClick={() => onUpdate(plan.id, { filing_status: 'accepted' })}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">
                Mark Accepted
              </button>
            )}
            {plan.clearance_status === 'not_received' && (
              <button onClick={() => onUpdate(plan.id, { clearance_status: 'received' })}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
                Clearance Received
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewPlanForm({ flights, onSave, onCancel }) {
  const [form, setForm] = useState({
    flight_number: '', origin: '', destination: '', alternate: '',
    filed_route: '', cruise_altitude: 'FL370', cruise_speed: 'M.78',
    etd: '', ete: '', filed_by: ''
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFlightSelect = (fn) => {
    const f = flights.find(fl => fl.flight_number === fn);
    if (f) {
      setForm(p => ({ ...p, flight_number: fn, origin: f.origin || '', destination: f.destination || '', aircraft_tail: f.aircraft_tail || '', aircraft_type: f.aircraft_type || '' }));
    } else {
      set('flight_number', fn);
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <p className="text-sm font-bold text-foreground">New Flight Plan</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Flight #</label>
          <select value={form.flight_number} onChange={e => handleFlightSelect(e.target.value)}
            className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
            <option value="">Select...</option>
            {flights.map(f => <option key={f.id} value={f.flight_number}>{f.flight_number}</option>)}
          </select>
        </div>
        {[
          { key: 'origin', label: 'Origin' },
          { key: 'destination', label: 'Destination' },
          { key: 'alternate', label: 'Alternate' },
          { key: 'cruise_altitude', label: 'Cruise Alt' },
          { key: 'cruise_speed', label: 'Speed' },
          { key: 'etd', label: 'ETD (Z)' },
          { key: 'ete', label: 'ETE (HH:MM)' },
          { key: 'filed_by', label: 'Filed By' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground">{label}</label>
            <input value={form[key] || ''} onChange={e => set(key, e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Filed Route</label>
        <textarea value={form.filed_route} onChange={e => set('filed_route', e.target.value)} rows={2}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1 resize-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ ...form, flight_date: TODAY, filing_status: 'filed' })}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
          File Plan
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-border text-xs font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function FlightPlanner() {
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: flights = [] } = useQuery({
    queryKey: ['fp-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const { data: plans = [], refetch } = useQuery({
    queryKey: ['flight-plans', TODAY],
    queryFn: () => base44.entities.FlightPlan.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FlightPlan.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flight-plans'] }); setShowNew(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FlightPlan.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flight-plans'] }),
  });

  const stats = {
    total: plans.length,
    accepted: plans.filter(p => p.filing_status === 'accepted').length,
    cleared: plans.filter(p => p.clearance_status === 'received').length,
    pending: plans.filter(p => p.clearance_status === 'not_received').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Navigation2 className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">FLIGHT PLANNER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">IFR Plans · ATC Clearances · Route Tracking</p>
            </div>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Total Plans</p>
            <p className="text-2xl font-extrabold font-mono text-primary">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Accepted</p>
            <p className="text-2xl font-extrabold font-mono text-green-400">{stats.accepted}</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Cleared</p>
            <p className="text-2xl font-extrabold font-mono text-green-400">{stats.cleared}</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Clearance Pending</p>
            <p className={cn('text-2xl font-extrabold font-mono', stats.pending > 0 ? 'text-orange-400' : 'text-muted-foreground')}>{stats.pending}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Today's Flight Plans</p>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Plan
          </button>
        </div>

        {showNew && (
          <NewPlanForm flights={flights} onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowNew(false)} />
        )}

        <div className="space-y-2">
          {plans.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No flight plans filed yet for today. Click "New Plan" to get started.
            </div>
          ) : (
            plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onUpdate={(id, data) => updateMutation.mutate({ id, data })} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}