import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ChevronDown, CheckCircle, Plus, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFleet } from '@/lib/FleetContext';

const FLEET_COLORS = [
  '#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#84cc16','#6366f1',
];

export function FleetBadge({ compact = false }) {
  const { activeFleet } = useFleet();
  const color = activeFleet?.color || '#38bdf8';
  if (!activeFleet) return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
      <Globe className="w-3.5 h-3.5 text-sky-400" />
      {!compact && <span className="text-xs font-bold text-sky-400">ALL FLEETS</span>}
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {!compact && <span className="text-xs font-bold" style={{ color }}>{activeFleet.icao_code || activeFleet.name}</span>}
    </div>
  );
}

export default function FleetSwitcher({ expanded = true, className = '' }) {
  const { fleets, activeFleetId, activeFleet, setActiveFleetId } = useFleet();
  const [open, setOpen] = useState(false);

  const color = activeFleet?.color || '#38bdf8';

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 rounded-xl border transition-all w-full',
          expanded ? 'px-3 py-2' : 'px-2 py-2 justify-center',
          activeFleet
            ? 'border-white/20 hover:border-white/30'
            : 'border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20'
        )}
        style={activeFleet ? { borderColor: `${color}40`, background: `${color}15` } : {}}
      >
        {activeFleet ? (
          <>
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            {expanded && (
              <>
                <span className="text-xs font-extrabold truncate flex-1 text-left" style={{ color }}>
                  {activeFleet.icao_code} — {activeFleet.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
              </>
            )}
          </>
        ) : (
          <>
            <Globe className="w-4 h-4 text-sky-400 flex-shrink-0" />
            {expanded && (
              <>
                <span className="text-xs font-extrabold text-sky-400 flex-1 text-left">All Fleets</span>
                <ChevronDown className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              </>
            )}
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-64 bg-[#141922] border border-white/15 rounded-2xl overflow-hidden z-50 shadow-2xl">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Select Active Fleet
              </p>
            </div>

            {/* All Fleets option */}
            <button
              onClick={() => { setActiveFleetId(null); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left',
                !activeFleetId && 'bg-sky-500/10'
              )}
            >
              <Globe className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-sky-400">All Fleets</p>
                <p className="text-[10px] text-gray-500">View all airlines combined</p>
              </div>
              {!activeFleetId && <CheckCircle className="w-4 h-4 text-sky-400" />}
            </button>

            <div className="h-px bg-white/5" />

            {fleets.length === 0 ? (
              <div className="px-4 py-4 text-center">
                <p className="text-gray-500 text-xs">No fleets configured yet</p>
                <Link
                  to="/FleetRegistry"
                  onClick={() => setOpen(false)}
                  className="text-xs text-sky-400 font-bold mt-1 block hover:underline"
                >
                  + Add your first fleet →
                </Link>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {fleets.map((fleet, i) => {
                  const col = fleet.color || FLEET_COLORS[i % FLEET_COLORS.length];
                  const isActive = activeFleetId === fleet.id;
                  return (
                    <button
                      key={fleet.id}
                      onClick={() => { setActiveFleetId(fleet.id); setOpen(false); }}
                      className={cn('w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left', isActive && 'bg-white/5')}
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: col }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{fleet.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {fleet.icao_code} · {fleet.fleet_type} · {fleet.hub_station || '—'}
                        </p>
                      </div>
                      {isActive && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: col }} />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-white/10 px-4 py-2">
              <Link
                to="/FleetRegistry"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Manage Fleets
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}