import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Plane, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  active:      { label: 'Active',      dot: 'bg-green-400',  text: 'text-green-400'  },
  maintenance: { label: 'In MX',       dot: 'bg-amber-400',  text: 'text-amber-400'  },
  oos:         { label: 'OOS',         dot: 'bg-red-400 animate-pulse', text: 'text-red-400' },
  retired:     { label: 'Retired',     dot: 'bg-gray-500',   text: 'text-gray-500'   },
};

export default function StationAircraftDropdown({ aircraft = [], value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Group aircraft by station
  const filtered = aircraft.filter(a => {
    const q = search.toLowerCase();
    return !search || a.tail_number?.toLowerCase().includes(q) || a.aircraft_type?.toLowerCase().includes(q) || a.base_station?.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce((acc, a) => {
    const station = a.base_station || 'Unassigned';
    if (!acc[station]) acc[station] = [];
    acc[station].push(a);
    return acc;
  }, {});
  const stations = Object.keys(grouped).sort();

  const selected = aircraft.find(a => a.tail_number === value);

  const handleSelect = (tail) => {
    onChange(tail);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={ref} className="relative min-w-[220px]">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2 bg-[#1a1f2e] border rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors',
          open ? 'border-emerald-500' : 'border-white/10 hover:border-white/30'
        )}
      >
        {selected ? (
          <>
            <Plane className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="font-bold font-mono">{selected.tail_number}</span>
            <span className="text-gray-400 text-xs truncate">{selected.aircraft_type}</span>
            {selected.base_station && (
              <span className="ml-auto text-[10px] text-gray-500 font-mono flex-shrink-0">{selected.base_station}</span>
            )}
            <button onClick={handleClear} className="ml-1 text-gray-500 hover:text-white flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-gray-400 flex-1 text-left">All Stations / Aircraft</span>
            <ChevronDown className={cn('w-4 h-4 text-gray-500 flex-shrink-0 transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1.5 left-0 w-80 bg-[#141922] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tail, type, station…"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* All Aircraft option */}
          <div className="px-2 pt-1">
            <button
              onClick={() => handleSelect('')}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors',
                !value ? 'bg-emerald-600/20 text-emerald-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Plane className="w-3.5 h-3.5" />
              All Aircraft
              <span className="ml-auto text-[10px] text-gray-600">{aircraft.length} total</span>
            </button>
          </div>

          {/* Station groups */}
          <div className="overflow-y-auto max-h-80 pb-2">
            {stations.map(station => (
              <div key={station}>
                {/* Station header */}
                <div className="flex items-center gap-2 px-4 py-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">{station}</p>
                  <span className="text-[9px] text-gray-600 ml-auto">{grouped[station].length} ac</span>
                </div>

                {/* Aircraft rows */}
                {grouped[station].map(a => {
                  const sc = STATUS_CFG[a.status] || STATUS_CFG.active;
                  const isSelected = a.tail_number === value;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleSelect(a.tail_number)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors',
                        isSelected ? 'bg-emerald-600/20' : 'hover:bg-white/5'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', sc.dot)} />
                      <span className={cn('text-xs font-extrabold font-mono', isSelected ? 'text-emerald-300' : 'text-white')}>
                        {a.tail_number}
                      </span>
                      <span className="text-[10px] text-gray-500 flex-1 truncate">{a.aircraft_type}</span>
                      <span className={cn('text-[9px] font-bold flex-shrink-0', sc.text)}>{sc.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {stations.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-6">No aircraft match your search</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}