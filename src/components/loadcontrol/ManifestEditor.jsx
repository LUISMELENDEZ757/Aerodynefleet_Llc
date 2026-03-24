import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];
const STD_PAX_WEIGHT = 190; // lbs including carry-on

function computeWeights(m) {
  const pax = (m.pax_total || 0) * STD_PAX_WEIGHT;
  const payload = pax + (m.baggage_weight_lbs || 0) + (m.cargo_weight_lbs || 0) + (m.mail_weight_lbs || 0);
  const zfw = (m.dow || 90000) + payload;
  return { total_payload_lbs: payload, zfw };
}

export default function ManifestEditor({ flights, manifests, isLoading }) {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.PassengerManifest.update(data.id, data)
      : base44.entities.PassengerManifest.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manifests'] }); setSelected(null); setForm(null); },
  });

  const selectFlight = (flight) => {
    const existing = manifests.find(m => m.flight_number === flight.flight_number);
    const base = existing || {
      flight_number: flight.flight_number,
      flight_date: TODAY,
      aircraft_tail: flight.aircraft_tail || '',
      aircraft_type: flight.aircraft_type || '',
      origin: flight.origin || '',
      destination: flight.destination || '',
      pax_first: 0, pax_business: 0, pax_economy: 0, pax_total: 0,
      pax_checked_in: 0, infants: 0,
      baggage_weight_lbs: 0, cargo_weight_lbs: 0, mail_weight_lbs: 0,
      dow: 90000, load_status: 'open',
    };
    setSelected(flight.flight_number);
    setForm({ ...base });
  };

  const set = (k, v) => {
    setForm(prev => {
      const updated = { ...prev, [k]: Number(v) || 0 };
      if (['pax_first','pax_business','pax_economy'].includes(k)) {
        updated.pax_total = (updated.pax_first || 0) + (updated.pax_business || 0) + (updated.pax_economy || 0);
      }
      const { total_payload_lbs, zfw } = computeWeights(updated);
      updated.total_payload_lbs = total_payload_lbs;
      updated.zfw = zfw;
      return updated;
    });
  };

  const handleSave = (status) => {
    saveMutation.mutate({ ...form, load_status: status });
  };

  if (isLoading) return <div className="text-muted-foreground text-sm p-4">Loading flights...</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Select Flight to Edit Manifest</p>
      <div className="space-y-2">
        {flights.length === 0 && (
          <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No flights scheduled for today
          </div>
        )}
        {flights.map(flight => {
          const manifest = manifests.find(m => m.flight_number === flight.flight_number);
          const isSelected = selected === flight.flight_number;
          return (
            <div key={flight.id} className="rounded-xl bg-card border border-border overflow-hidden">
              <button onClick={() => isSelected ? (setSelected(null), setForm(null)) : selectFlight(flight)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors text-left">
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{flight.flight_number}</p>
                  <p className="text-xs text-muted-foreground">{flight.origin} → {flight.destination} · {flight.aircraft_type || flight.aircraft_tail || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {manifest ? (
                    <>
                      <span className="text-xs font-mono text-foreground">{manifest.pax_total} PAX</span>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                        manifest.load_status === 'finalized' ? 'bg-green-500/15 text-green-400' :
                        manifest.load_status === 'closed' ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary')}>
                        {manifest.load_status}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No manifest</span>
                  )}
                </div>
              </button>

              {isSelected && form && (
                <div className="border-t border-border/50 p-4 space-y-4 bg-secondary/10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PAX Counts</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'pax_first', label: 'First' },
                      { key: 'pax_business', label: 'Business' },
                      { key: 'pax_economy', label: 'Economy' },
                      { key: 'pax_checked_in', label: 'Checked In' },
                      { key: 'infants', label: 'Infants' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground">{label}</label>
                        <input type="number" value={form[key] || 0} onChange={e => set(key, e.target.value)}
                          className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cargo & Weights (lbs)</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'baggage_weight_lbs', label: 'Baggage' },
                      { key: 'cargo_weight_lbs', label: 'Cargo' },
                      { key: 'mail_weight_lbs', label: 'Mail' },
                      { key: 'dow', label: 'DOW (Dry Op Wt)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground">{label}</label>
                        <input type="number" value={form[key] || 0} onChange={e => set(key, e.target.value)}
                          className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-background/40 rounded-xl p-3">
                    {[
                      { label: 'Total PAX', value: form.pax_total, color: 'text-primary' },
                      { label: 'Total Payload', value: `${((form.total_payload_lbs || 0)/1000).toFixed(1)}K lbs`, color: 'text-foreground' },
                      { label: 'ZFW', value: `${((form.zfw || 0)/1000).toFixed(1)}K lbs`, color: form.zfw > 138000 ? 'text-destructive' : 'text-green-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={cn('text-base font-extrabold font-mono', color)}>{value}</p>
                      </div>
                    ))}
                    {form.zfw > 138000 && (
                      <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <span className="text-xs text-destructive font-semibold">Exceeds ZFW limit</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleSave('open')} className="flex-1 h-9 border border-border text-xs font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
                      Save Draft
                    </button>
                    <button onClick={() => handleSave('finalized')}
                      className="flex-1 h-9 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Finalize
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}