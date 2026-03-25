import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Truck, RefreshCw, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_COLORS = {
  not_requested: 'text-muted-foreground bg-muted',
  requested: 'text-orange-400 bg-orange-500/15',
  en_route: 'text-blue-400 bg-blue-500/15',
  complete: 'text-green-400 bg-green-500/15',
  not_started: 'text-muted-foreground bg-muted',
  in_progress: 'text-blue-400 bg-blue-500/15',
  not_assigned: 'text-muted-foreground bg-muted',
  assigned: 'text-orange-400 bg-orange-500/15',
  connected: 'text-green-400 bg-green-500/15',
  disconnected: 'text-muted-foreground bg-muted',
  fueling: 'text-blue-400 bg-blue-500/15',
  loading: 'text-blue-400 bg-blue-500/15',
  pre_boarding: 'text-orange-400 bg-orange-500/15',
  boarding: 'text-primary bg-primary/15',
  final_boarding: 'text-orange-400 bg-orange-500/15',
  closed: 'text-green-400 bg-green-500/15',
};

function StatusBadge({ status }) {
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[status] || 'text-muted-foreground bg-muted')}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}

function GroundOpsCard({ op, flights, onUpdate }) {
  const flight = flights.find(f => f.flight_number === op.flight_number);
  const completionRate = [
    op.tug_status === 'complete',
    op.fuel_truck_status === 'complete',
    op.catering_status === 'complete',
    op.cleaning_status === 'complete',
    op.bags_loaded,
    op.cargo_loaded,
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono font-bold text-foreground">{op.flight_number}</p>
          <p className="text-xs text-muted-foreground">Gate {op.gate || '—'} · {op.station || '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(completionRate / 6) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{completionRate}/6</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'Tug', field: 'tug_status', options: ['not_requested', 'requested', 'en_route', 'complete'] },
          { label: 'Jetbridge', field: 'jetbridge_status', options: ['not_assigned', 'assigned', 'connected', 'disconnected'] },
          { label: 'Fuel Truck', field: 'fuel_truck_status', options: ['not_requested', 'requested', 'fueling', 'complete'] },
          { label: 'Catering', field: 'catering_status', options: ['not_requested', 'requested', 'loading', 'complete'] },
          { label: 'Cleaning', field: 'cleaning_status', options: ['not_started', 'in_progress', 'complete'] },
          { label: 'Boarding', field: 'boarding_status', options: ['not_started', 'pre_boarding', 'boarding', 'final_boarding', 'closed'] },
        ].map(({ label, field, options }) => (
          <div key={field} className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <select
              value={op[field] || options[0]}
              onChange={e => onUpdate(op.id, { [field]: e.target.value })}
              className="w-full h-7 bg-background border border-border rounded text-xs px-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={op.bags_loaded || false} onChange={e => onUpdate(op.id, { bags_loaded: e.target.checked })} className="w-3.5 h-3.5 rounded" />
          <span className={op.bags_loaded ? 'text-green-400' : 'text-muted-foreground'}>Bags Loaded</span>
        </label>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={op.cargo_loaded || false} onChange={e => onUpdate(op.id, { cargo_loaded: e.target.checked })} className="w-3.5 h-3.5 rounded" />
          <span className={op.cargo_loaded ? 'text-green-400' : 'text-muted-foreground'}>Cargo Loaded</span>
        </label>
      </div>

      {op.ground_crew_lead && (
        <p className="text-xs text-muted-foreground">Lead: <span className="text-foreground">{op.ground_crew_lead}</span></p>
      )}
    </div>
  );
}

function NewOpsModal({ flights, onClose, onCreate }) {
  const [form, setForm] = useState({ flight_number: '', gate: '', station: '', ground_crew_lead: '' });
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-3">
        <h3 className="font-bold text-foreground">New Ground Ops Entry</h3>
        <select value={form.flight_number} onChange={e => setForm(p => ({ ...p, flight_number: e.target.value }))}
          className="w-full h-9 bg-background border border-border rounded px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">Select Flight</option>
          {flights.map(f => <option key={f.id} value={f.flight_number}>{f.flight_number} — {f.origin} → {f.destination}</option>)}
        </select>
        {[['gate', 'Gate'], ['station', 'Station ICAO'], ['ground_crew_lead', 'Ground Crew Lead']].map(([key, label]) => (
          <input key={key} placeholder={label} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            className="w-full h-9 bg-background border border-border rounded px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        ))}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-secondary text-muted-foreground text-sm font-semibold hover:bg-secondary/80">Cancel</button>
          <button onClick={() => onCreate({ ...form, flight_date: TODAY })} disabled={!form.flight_number}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  );
}

export default function GroundOpsPage() {
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: ops = [], refetch } = useQuery({
    queryKey: ['ground-ops', TODAY],
    queryFn: () => base44.entities.GroundOps.filter({ flight_date: TODAY }),
    refetchInterval: 30000,
  });
  const { data: flights = [] } = useQuery({
    queryKey: ['go-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GroundOps.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ground-ops'] }),
  });
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroundOps.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ground-ops'] }); setShowNew(false); },
  });

  const complete = ops.filter(o => o.boarding_status === 'closed').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Truck className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">GROUND OPS</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Turnaround · Pushback · Boarding</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={refetch} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{ops.length}</p>
            <p className="text-xs text-muted-foreground">Active Ops</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-green-400">{complete}</p>
            <p className="text-xs text-muted-foreground">Departed</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-orange-400">{ops.length - complete}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
        </div>

        {ops.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No ground ops entries for today. Create one to start tracking.
          </div>
        ) : (
          <div className="space-y-3">
            {ops.map(op => (
              <GroundOpsCard key={op.id} op={op} flights={flights}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewOpsModal flights={flights} onClose={() => setShowNew(false)} onCreate={d => createMutation.mutate(d)} />}
    </div>
  );
}