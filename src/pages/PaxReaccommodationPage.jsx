import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_CFG = {
  pending:        { label: 'Pending',        color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  rebooked:       { label: 'Rebooked',       color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  hotel_assigned: { label: 'Hotel',          color: 'text-purple-400',  bg: 'bg-purple-500/15' },
  completed:      { label: 'Completed',      color: 'text-green-400',   bg: 'bg-green-500/15' },
  refunded:       { label: 'Refunded',       color: 'text-muted-foreground', bg: 'bg-muted' },
};

const COMP_CFG = {
  none:          'None',
  meal_voucher:  'Meal Voucher',
  hotel:         'Hotel',
  travel_credit: 'Travel Credit',
  cash:          'Cash',
  full_refund:   'Full Refund',
};

function NewReaccomModal({ flights, events, onSave, onClose }) {
  const [form, setForm] = useState({
    original_flight: '', flight_date: TODAY, pax_name: '', pax_count: 1,
    origin: '', destination: '', rebooked_flight: '', rebooked_date: '', rebooked_carrier: '',
    compensation_type: 'meal_voucher', compensation_amount: 0, status: 'pending', agent_name: '', notes: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFlightSelect = (fn) => {
    const f = flights.find(fl => fl.flight_number === fn);
    if (f) setForm(p => ({ ...p, original_flight: fn, origin: f.origin || '', destination: f.destination || '' }));
    else set('original_flight', fn);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <p className="text-sm font-bold text-foreground">New PAX Reaccommodation</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Original Flight</label>
            <select value={form.original_flight} onChange={e => handleFlightSelect(e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              <option value="">Select flight...</option>
              {flights.map(f => <option key={f.id} value={f.flight_number}>{f.flight_number} ({f.origin}→{f.destination})</option>)}
            </select>
          </div>
          {[
            { key: 'pax_name', label: 'PAX Name / PNR' },
            { key: 'pax_count', label: 'PAX Count', type: 'number' },
            { key: 'rebooked_flight', label: 'Rebooked Flight' },
            { key: 'rebooked_date', label: 'Rebooked Date', type: 'date' },
            { key: 'rebooked_carrier', label: 'Carrier' },
            { key: 'agent_name', label: 'Agent Name' },
            { key: 'compensation_amount', label: 'Comp Amount ($)', type: 'number' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type={type || 'text'} value={form[key] || ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground">Compensation</label>
            <select value={form.compensation_type} onChange={e => set('compensation_type', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              {Object.entries(COMP_CFG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1 resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} disabled={!form.original_flight}
            className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">
            Save
          </button>
          <button onClick={onClose} className="flex-1 h-10 border border-border text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaxReaccommodationPage() {
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: flights = [] } = useQuery({
    queryKey: ['pr-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['irops-events'],
    queryFn: () => base44.entities.IROPSEvent.filter({ status: 'active' }),
  });

  const { data: records = [], refetch } = useQuery({
    queryKey: ['pax-reaccom'],
    queryFn: () => base44.entities.PaxReaccommodation.list('-created_date', 100),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaxReaccommodation.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pax-reaccom'] }); setShowNew(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PaxReaccommodation.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pax-reaccom'] }),
  });

  const totalPax = records.reduce((s, r) => s + (r.pax_count || 0), 0);
  const totalComp = records.reduce((s, r) => s + (r.compensation_amount || 0), 0);
  const pending = records.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Users className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">PAX REACCOMMODATION</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">IROPS Rebooking · Comp · Status</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={refetch} className="text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total PAX', value: totalPax, color: 'text-primary' },
            { label: 'Pending', value: pending, color: pending > 0 ? 'text-orange-400' : 'text-muted-foreground' },
            { label: 'Completed', value: records.filter(r => r.status === 'completed').length, color: 'text-green-400' },
            { label: 'Comp Cost', value: `$${totalComp.toLocaleString()}`, color: 'text-destructive' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-card border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={cn('text-xl font-extrabold font-mono', color)}>{value}</p>
            </div>
          ))}
        </div>

        {events.length > 0 && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
            <p className="text-xs font-bold text-destructive mb-1">Active IROPS Events</p>
            {events.map(e => (
              <p key={e.id} className="text-xs text-foreground">• {e.title} — {e.pax_impacted || 0} PAX affected</p>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {records.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No reaccommodations logged. Click "New" to start.
            </div>
          ) : (
            records.map(r => {
              const st = STATUS_CFG[r.status] || STATUS_CFG.pending;
              return (
                <div key={r.id} className="rounded-xl bg-card border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', st.bg, st.color)}>{st.label}</span>
                        <span className="text-xs font-mono text-muted-foreground">{r.original_flight}</span>
                        <span className="text-xs text-muted-foreground">{r.flight_date}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{r.pax_name || `${r.pax_count} PAX`}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.origin}→{r.destination}
                        {r.rebooked_flight ? ` → Rebooked: ${r.rebooked_flight} (${r.rebooked_carrier || 'same'})` : ' — Not yet rebooked'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">{COMP_CFG[r.compensation_type] || 'None'}</p>
                      {r.compensation_amount > 0 && <p className="text-xs font-mono text-destructive">${r.compensation_amount.toLocaleString()}</p>}
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => updateMutation.mutate({ id: r.id, status: 'rebooked' })}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">
                        Mark Rebooked
                      </button>
                      <button onClick={() => updateMutation.mutate({ id: r.id, status: 'hotel_assigned' })}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors">
                        Hotel Assigned
                      </button>
                      <button onClick={() => updateMutation.mutate({ id: r.id, status: 'completed' })}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Complete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showNew && <NewReaccomModal flights={flights} events={events} onSave={(d) => createMutation.mutate(d)} onClose={() => setShowNew(false)} />}
    </div>
  );
}