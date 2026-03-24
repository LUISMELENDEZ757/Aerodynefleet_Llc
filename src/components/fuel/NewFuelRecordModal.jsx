import { useState } from 'react';
import { X, Fuel } from 'lucide-react';

export default function NewFuelRecordModal({ flights, onClose, onCreate }) {
  const [form, setForm] = useState({
    flight_number: flights[0]?.flight_number || '',
    aircraft_tail: flights[0]?.aircraft_tail || '',
    flight_date: new Date().toISOString().split('T')[0],
    station: flights[0]?.origin || '',
    planned_fuel: '',
    actual_uplift: '',
    fuel_on_departure: '',
    fuel_on_arrival: '',
    trip_fuel_planned: '',
    trip_fuel_actual: '',
    fuel_price_per_gallon: '',
    tankering_decision: 'none',
    supplier: '',
    notes: '',
  });

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    // Auto-calc variance
    if (updated.trip_fuel_actual && updated.trip_fuel_planned) {
      const a = Number(updated.trip_fuel_actual);
      const p = Number(updated.trip_fuel_planned);
      updated.variance_lbs = a - p;
      updated.variance_percent = p > 0 ? ((a - p) / p * 100).toFixed(2) : 0;
    }
    // Auto-fill aircraft when flight changes
    if (k === 'flight_number') {
      const flt = flights.find(f => f.flight_number === v);
      if (flt) { updated.aircraft_tail = flt.aircraft_tail || ''; updated.station = flt.origin || ''; }
    }
    setForm(updated);
  };

  const handleSubmit = () => {
    if (!form.flight_number || !form.station) return;
    onCreate({
      ...form,
      planned_fuel: Number(form.planned_fuel) || 0,
      actual_uplift: Number(form.actual_uplift) || 0,
      fuel_on_departure: Number(form.fuel_on_departure) || 0,
      fuel_on_arrival: Number(form.fuel_on_arrival) || 0,
      trip_fuel_planned: Number(form.trip_fuel_planned) || 0,
      trip_fuel_actual: Number(form.trip_fuel_actual) || 0,
      fuel_price_per_gallon: Number(form.fuel_price_per_gallon) || 0,
      release_status: 'confirmed',
    });
  };

  const fields = [
    { label: 'Planned Fuel (lbs)', key: 'planned_fuel' },
    { label: 'Actual Uplift (lbs)', key: 'actual_uplift' },
    { label: 'Fuel on Departure (lbs)', key: 'fuel_on_departure' },
    { label: 'Fuel on Arrival (lbs)', key: 'fuel_on_arrival' },
    { label: 'Trip Fuel Planned (lbs)', key: 'trip_fuel_planned' },
    { label: 'Trip Fuel Actual (lbs)', key: 'trip_fuel_actual' },
    { label: 'Price ($/gal)', key: 'fuel_price_per_gallon' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-primary" />
            <p className="text-sm font-extrabold text-foreground">Log Fuel Record</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Flight selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Flight *</label>
              {flights.length > 0 ? (
                <select
                  value={form.flight_number}
                  onChange={e => set('flight_number', e.target.value)}
                  className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {flights.map(f => <option key={f.id} value={f.flight_number}>{f.flight_number}</option>)}
                </select>
              ) : (
                <input type="text" value={form.flight_number} onChange={e => set('flight_number', e.target.value)}
                  placeholder="FLT 1234"
                  className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Station (ICAO)</label>
              <input type="text" value={form.station} onChange={e => set('station', e.target.value.toUpperCase())}
                placeholder="KEWR" maxLength={4}
                className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Numeric fields */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input
                  type="number"
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder="0"
                  className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tankering</label>
              <select value={form.tankering_decision} onChange={e => set('tankering_decision', e.target.value)}
                className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="none">None</option>
                <option value="tankered">Full Tankering</option>
                <option value="partial_taker">Partial</option>
              </select>
            </div>
          </div>

          {/* Variance display */}
          {form.variance_lbs != null && (
            <div className="bg-secondary/50 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground">Calculated Variance</p>
              <p className={`text-lg font-mono font-bold ${Number(form.variance_lbs) > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {Number(form.variance_lbs) > 0 ? '+' : ''}{Number(form.variance_lbs).toLocaleString()} lbs ({form.variance_percent}%)
              </p>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Optional notes"
              className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!form.flight_number}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors">
            Save Record
          </button>
        </div>
      </div>
    </div>
  );
}