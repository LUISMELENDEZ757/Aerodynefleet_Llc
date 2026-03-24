import { useState } from 'react';
import { cn } from '@/lib/utils';

const APPROACHES = ['ILS', 'RNAV', 'VOR', 'NDB', 'Visual', 'GLS'];

export default function AddEntryModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    flight_date:     new Date().toISOString().split('T')[0],
    flight_number:   '',
    origin:          '',
    destination:     '',
    aircraft_type:   'B737-800',
    aircraft_tail:   '',
    flight_time:     '',
    night_time:      '',
    instrument_time: '',
    approach_type:   '',
    landings:        1,
    notes:           '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">New Logbook Entry</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Date',              key: 'flight_date',     type: 'date' },
              { label: 'Flight #',          key: 'flight_number',   type: 'text',   placeholder: 'AAL4474' },
              { label: 'Origin',            key: 'origin',          type: 'text',   placeholder: 'KEWR' },
              { label: 'Destination',       key: 'destination',     type: 'text',   placeholder: 'KORD' },
              { label: 'Aircraft Type',     key: 'aircraft_type',   type: 'text',   placeholder: 'B737-800' },
              { label: 'Tail #',            key: 'aircraft_tail',   type: 'text',   placeholder: 'N455GJ' },
              { label: 'Flight Time (hrs)', key: 'flight_time',     type: 'number', placeholder: '2.5' },
              { label: 'Night Time (hrs)',  key: 'night_time',      type: 'number', placeholder: '0.0' },
              { label: 'Instrument (hrs)',  key: 'instrument_time', type: 'number', placeholder: '0.0' },
              { label: 'Landings',          key: 'landings',        type: 'number', placeholder: '1' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Approach Type</label>
            <div className="flex gap-2 flex-wrap">
              {APPROACHES.map(a => (
                <button
                  key={a}
                  onClick={() => set('approach_type', form.approach_type === a ? '' : a)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                    form.approach_type === a
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >{a}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onSave(form)}
              className="flex-1 h-10 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors"
            >
              Save Entry
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-10 bg-secondary text-foreground font-semibold text-sm rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}