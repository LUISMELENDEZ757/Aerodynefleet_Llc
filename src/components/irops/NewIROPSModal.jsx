import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_TYPES = ['weather', 'mx', 'crew', 'atc', 'security', 'gate', 'other'];
const SEVERITIES = ['minor', 'moderate', 'major', 'critical'];

export default function NewIROPSModal({ flights, onClose, onCreate }) {
  const [form, setForm] = useState({
    event_type: 'weather',
    severity: 'moderate',
    title: '',
    description: '',
    affected_station: '',
    affected_flights: [],
    pax_impacted: '',
    cost_impact: '',
    status: 'active',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleFlight = (fn) => {
    setForm(prev => ({
      ...prev,
      affected_flights: prev.affected_flights.includes(fn)
        ? prev.affected_flights.filter(f => f !== fn)
        : [...prev.affected_flights, fn],
    }));
  };

  const handleSubmit = () => {
    if (!form.title) return;
    onCreate({
      ...form,
      pax_impacted: form.pax_impacted ? Number(form.pax_impacted) : 0,
      cost_impact: form.cost_impact ? Number(form.cost_impact) : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <p className="text-sm font-extrabold text-foreground">New IROPS Event</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Event Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Ground stop KEWR — thunderstorms"
              className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Type + Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Event Type</label>
              <select
                value={form.event_type}
                onChange={e => set('event_type', e.target.value)}
                className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={e => set('severity', e.target.value)}
                className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SEVERITIES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Station */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Affected Station (ICAO)</label>
            <input
              type="text"
              value={form.affected_station}
              onChange={e => set('affected_station', e.target.value.toUpperCase())}
              placeholder="e.g. KEWR"
              maxLength={4}
              className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the event and current situation…"
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* PAX + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">PAX Impacted</label>
              <input
                type="number"
                value={form.pax_impacted}
                onChange={e => set('pax_impacted', e.target.value)}
                placeholder="0"
                className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Est. Cost ($)</label>
              <input
                type="number"
                value={form.cost_impact}
                onChange={e => set('cost_impact', e.target.value)}
                placeholder="0"
                className="w-full h-10 bg-secondary border border-border rounded-xl px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Affected flights */}
          {flights.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Affected Flights (tap to select)</label>
              <div className="flex flex-wrap gap-1.5">
                {flights.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleFlight(f.flight_number)}
                    className={cn('text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all',
                      form.affected_flights.includes(f.flight_number)
                        ? 'bg-destructive/20 border-destructive/50 text-destructive'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    )}
                  >{f.flight_number}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title}
            className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-40 hover:bg-destructive/90 transition-colors"
          >
            Create IROPS Event
          </button>
        </div>
      </div>
    </div>
  );
}