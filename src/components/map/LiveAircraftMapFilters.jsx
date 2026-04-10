import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LiveAircraftMapFilters({ aircraft, filters, setFilters, onClose }) {
  // Extract unique values from aircraft
  const airlines = [...new Set(aircraft.map(a => a.airline).filter(Boolean))].sort();
  const origins = [...new Set(aircraft.map(a => a.origin).filter(Boolean))].sort();
  const destinations = [...new Set(aircraft.map(a => a.destination).filter(Boolean))].sort();
  const types = [...new Set(aircraft.map(a => a.aircraft_type).filter(Boolean))].sort();
  const statuses = [...new Set(aircraft.map(a => a.status).filter(Boolean))].sort();

  const updateFilter = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: updated });
  };

  const toggleAll = (key, options) => {
    const current = filters[key] || [];
    setFilters({ ...filters, [key]: current.length === options.length ? [] : options });
  };

  const clearAll = () => {
    setFilters({ airline: [], origin: [], destination: [], type: [], status: [], callsign: '' });
  };

  const activeCount = Object.values(filters).reduce((s, v) => s + (Array.isArray(v) ? v.length : (v ? 1 : 0)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <p className="font-extrabold text-foreground">Filter Aircraft</p>
            {activeCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">{activeCount} active</span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Grid */}
        <div className="overflow-y-auto scrollbar-hide flex-1 p-5 space-y-4">
          {/* Flight Number Search */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Flight Number</label>
            <input
              type="text"
              placeholder="e.g., UAL4474"
              value={filters.callsign || ''}
              onChange={e => setFilters({ ...filters, callsign: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Airline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Airline / Carrier</label>
              {(filters.airline?.length || 0) > 0 && (
                <button onClick={() => toggleAll('airline', airlines)} className="text-[10px] text-primary hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {airlines.map(a => (
                <button
                  key={a}
                  onClick={() => updateFilter('airline', a)}
                  className={cn(
                    'text-xs font-bold px-3 py-1.5 rounded-full border transition-all',
                    (filters.airline || []).includes(a)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Aircraft Type */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Aircraft Type</label>
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => updateFilter('type', t)}
                  className={cn(
                    'text-xs font-bold px-3 py-1.5 rounded-full border transition-all',
                    (filters.type || []).includes(t)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Origin Airport */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Origin Airport</label>
            <div className="flex flex-wrap gap-2">
              {origins.map(o => (
                <button
                  key={o}
                  onClick={() => updateFilter('origin', o)}
                  className={cn(
                    'text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-all',
                    (filters.origin || []).includes(o)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Airport */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Destination Airport</label>
            <div className="flex flex-wrap gap-2">
              {destinations.map(d => (
                <button
                  key={d}
                  onClick={() => updateFilter('destination', d)}
                  className={cn(
                    'text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-all',
                    (filters.destination || []).includes(d)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Flight Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => updateFilter('status', s)}
                  className={cn(
                    'text-xs font-bold px-3 py-1.5 rounded-full border transition-all capitalize',
                    (filters.status || []).includes(s)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border bg-secondary/50 flex-shrink-0">
          <button
            onClick={clearAll}
            className="flex-1 py-2 rounded-lg border border-border text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}