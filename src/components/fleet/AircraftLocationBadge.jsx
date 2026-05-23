import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

// SVG icons drawn inline — no lucide dependency for custom aviation shapes
const HangarIcon = ({ className }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 10 L10 3 L18 10" />
    <line x1="2" y1="10" x2="2" y2="17" />
    <line x1="18" y1="10" x2="18" y2="17" />
    <line x1="2" y1="17" x2="18" y2="17" />
    <rect x="6" y="11" width="8" height="6" />
  </svg>
);

const GateIcon = ({ className }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Tower */}
    <rect x="3" y="8" width="5" height="9" />
    <path d="M3 8 L5.5 3 L8 8" />
    {/* Bridge arm */}
    <line x1="8" y1="11" x2="14" y2="11" />
    {/* Terminal building */}
    <rect x="14" y="8" width="4" height="9" />
    <line x1="2" y1="17" x2="18" y2="17" />
  </svg>
);

const RampIcon = ({ className }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Ground line */}
    <line x1="1" y1="15" x2="19" y2="15" />
    {/* Aircraft silhouette */}
    <path d="M4 12 Q10 7 16 12" />
    <line x1="10" y1="8" x2="10" y2="12" />
    {/* Cones */}
    <line x1="4" y1="15" x2="5" y2="18" />
    <line x1="15" y1="15" x2="16" y2="18" />
  </svg>
);

const LOCATION_CONFIG = {
  gate:    { label: 'Gate',   Icon: GateIcon,   color: 'text-cyan-300',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/40'   },
  hangar:  { label: 'Hangar', Icon: HangarIcon, color: 'text-amber-300',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40'  },
  ramp:    { label: 'Ramp',   Icon: RampIcon,   color: 'text-green-300',  bg: 'bg-green-500/15',  border: 'border-green-500/40'  },
  unknown: { label: '—',      Icon: null,        color: 'text-gray-500',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20'   },
};

const CYCLE_ORDER = ['gate', 'hangar', 'ramp', 'unknown'];

/**
 * AircraftLocationBadge
 *
 * Props:
 *   aircraftId    – entity record id
 *   locationType  – 'gate' | 'hangar' | 'ramp' | 'unknown'
 *   locationLabel – optional freetext e.g. "Gate B14"
 *   editable      – if true, clicking cycles through types + opens label input
 *   size          – 'sm' (default) | 'md'
 */
export default function AircraftLocationBadge({
  aircraftId,
  locationType = 'unknown',
  locationLabel = '',
  editable = false,
  size = 'sm',
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(locationLabel);
  const inputRef = useRef(null);

  const cfg = LOCATION_CONFIG[locationType] || LOCATION_CONFIG.unknown;
  const { Icon } = cfg;

  const mutation = useMutation({
    mutationFn: ({ type, label }) =>
      base44.entities.Aircraft.update(aircraftId, {
        location_type: type,
        location_label: label,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fleet-aircraft'] });
    },
  });

  // Cycle to next location type on badge click
  const handleCycle = (e) => {
    if (!editable) return;
    e.stopPropagation();
    const idx = CYCLE_ORDER.indexOf(locationType);
    const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
    mutation.mutate({ type: next, label: draftLabel });
  };

  // Open label input on long-press or right-click
  const handleContextMenu = (e) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    setDraftLabel(locationLabel);
    setEditing(true);
  };

  // Close + save on blur / enter
  const handleLabelSave = () => {
    mutation.mutate({ type: locationType, label: draftLabel.trim() });
    setEditing(false);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const isSm = size === 'sm';

  if (locationType === 'unknown' && !editable) return null;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Badge */}
      <button
        type="button"
        disabled={!editable || mutation.isPending}
        onClick={handleCycle}
        onContextMenu={handleContextMenu}
        title={editable ? 'Click to change location · Right-click to set label' : undefined}
        className={cn(
          'flex items-center gap-1 rounded border font-bold transition-all',
          isSm ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[11px]',
          cfg.bg, cfg.border, cfg.color,
          editable && 'hover:brightness-125 cursor-pointer active:scale-95',
          !editable && 'cursor-default',
          mutation.isPending && 'opacity-50'
        )}
      >
        {Icon && (
          <Icon className={cn('flex-shrink-0', isSm ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        )}
        <span>
          {locationLabel && locationLabel !== '—'
            ? locationLabel
            : cfg.label}
        </span>
        {editable && locationType !== 'unknown' && (
          <span className="opacity-40 text-[8px] ml-0.5">↻</span>
        )}
      </button>

      {/* Label editor popover */}
      {editing && (
        <div
          className="absolute bottom-full left-0 mb-1.5 z-50 bg-[#1a2235] border border-white/15 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-48"
          onClick={(e) => e.stopPropagation()}
        >
          <p className={cn('text-[10px] font-bold uppercase tracking-widest', cfg.color)}>
            Set {cfg.label} Label
          </p>
          <input
            ref={inputRef}
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSave();
              if (e.key === 'Escape') setEditing(false);
            }}
            placeholder={`e.g. ${locationType === 'gate' ? 'Gate B14' : locationType === 'hangar' ? 'Hangar 3' : 'Ramp C7'}`}
            className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-gray-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleLabelSave}
              className={cn('flex-1 py-1 rounded-lg text-[10px] font-bold border', cfg.bg, cfg.border, cfg.color, 'hover:brightness-125')}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}