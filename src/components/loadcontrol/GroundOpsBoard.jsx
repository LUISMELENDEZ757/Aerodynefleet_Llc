import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

const TASK_FIELDS = [
  { key: 'tug_status', label: 'Tug', options: ['not_requested','requested','en_route','complete'] },
  { key: 'jetbridge_status', label: 'Jetbridge', options: ['not_assigned','assigned','connected','disconnected'] },
  { key: 'boarding_status', label: 'Boarding', options: ['not_started','pre_boarding','boarding','final_boarding','closed'] },
  { key: 'fuel_truck_status', label: 'Fuel Truck', options: ['not_requested','requested','fueling','complete'] },
  { key: 'catering_status', label: 'Catering', options: ['not_requested','requested','loading','complete'] },
  { key: 'cleaning_status', label: 'Cleaning', options: ['not_started','in_progress','complete'] },
];

function isComplete(val) {
  return val === 'complete' || val === 'disconnected' || val === 'closed';
}

function statusColor(val) {
  if (val === 'complete' || val === 'disconnected' || val === 'closed') return 'text-green-400 bg-green-500/15';
  if (val === 'not_requested' || val === 'not_started' || val === 'not_assigned') return 'text-muted-foreground bg-muted';
  return 'text-primary bg-primary/15';
}

export default function GroundOpsBoard({ flights }) {
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: groundOps = [] } = useQuery({
    queryKey: ['ground-ops', TODAY],
    queryFn: () => base44.entities.GroundOps.filter({ flight_date: TODAY }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.GroundOps.update(data.id, data)
      : base44.entities.GroundOps.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ground-ops'] }),
  });

  const selectFlight = (flight) => {
    const existing = groundOps.find(g => g.flight_number === flight.flight_number);
    setSelected({
      ...(existing || {
        flight_number: flight.flight_number,
        flight_date: TODAY,
        aircraft_tail: flight.aircraft_tail || '',
        gate: flight.gate || '',
        station: flight.origin || '',
        tug_status: 'not_requested',
        jetbridge_status: 'not_assigned',
        boarding_status: 'not_started',
        fuel_truck_status: 'not_requested',
        catering_status: 'not_requested',
        cleaning_status: 'not_started',
        bags_loaded: false,
        cargo_loaded: false,
      })
    });
  };

  const updateField = (k, v) => {
    setSelected(prev => {
      const updated = { ...prev, [k]: v };
      saveMutation.mutate(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Select Flight</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {flights.map(f => (
          <button key={f.id} onClick={() => selectFlight(f)}
            className={cn('flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
              selected?.flight_number === f.flight_number ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground')}>
            {f.flight_number}<br /><span className="font-normal">{f.origin}→{f.destination}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{selected.flight_number} — Ground Operations</p>
            {selected.gate && <span className="text-xs font-mono text-muted-foreground">Gate {selected.gate}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TASK_FIELDS.map(({ key, label, options }) => {
              const val = selected[key] || options[0];
              const done = isComplete(val);
              return (
                <div key={key} className={cn('rounded-xl border p-3', done ? 'bg-green-500/10 border-green-500/20' : 'bg-card border-border')}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    {done && <CheckCircle className="w-4 h-4 text-green-400" />}
                  </div>
                  <select value={val} onChange={e => updateField(key, e.target.value)}
                    className="w-full h-8 bg-secondary border border-border rounded-lg px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                  </select>
                  <span className={cn('mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full', statusColor(val))}>
                    {val.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'bags_loaded', label: 'Bags Loaded' },
              { key: 'cargo_loaded', label: 'Cargo Loaded' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => updateField(key, !selected[key])}
                className={cn('rounded-xl border p-3 text-left transition-all',
                  selected[key] ? 'bg-green-500/10 border-green-500/20' : 'bg-card border-border hover:border-primary/30')}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    selected[key] ? 'border-green-500 bg-green-500' : 'border-border')}>
                    {selected[key] && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn('text-sm font-semibold', selected[key] ? 'text-green-400' : 'text-foreground')}>{label}</span>
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Ground Crew Lead</label>
            <input value={selected.ground_crew_lead || ''} onChange={e => updateField('ground_crew_lead', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
        </div>
      )}

      {!selected && flights.length === 0 && (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No flights scheduled for today
        </div>
      )}
    </div>
  );
}