import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <rect x="3" y="8" width="5" height="9" />
    <path d="M3 8 L5.5 3 L8 8" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <rect x="14" y="8" width="4" height="9" />
    <line x1="2" y1="17" x2="18" y2="17" />
  </svg>
);

const RampIcon = ({ className }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="1" y1="15" x2="19" y2="15" />
    <path d="M4 12 Q10 7 16 12" />
    <line x1="10" y1="8" x2="10" y2="12" />
    <line x1="4" y1="15" x2="5" y2="18" />
    <line x1="15" y1="15" x2="16" y2="18" />
  </svg>
);

const LOCATION_CONFIG = {
  gate:    { label: 'Gate',   Icon: GateIcon,   color: 'text-cyan-300',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/40'   },
  hangar:  { label: 'Hangar', Icon: HangarIcon, color: 'text-amber-300',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40'  },
  ramp:    { label: 'Ramp',   Icon: RampIcon,   color: 'text-green-300',  bg: 'bg-green-500/15',  border: 'border-green-500/40'  },
  unknown: { label: '—',      Icon: null,       color: 'text-gray-500',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20'   },
};

const TYPES = ['gate', 'hangar', 'ramp', 'unknown'];

export default function LocationTypeToggle({
  aircraftId,
  locationType = 'unknown',
  locationLabel = '',
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(locationLabel);
  const [draftType, setDraftType] = useState(locationType);
  const inputRef = useRef(null);

  const cfg = LOCATION_CONFIG[draftType] || LOCATION_CONFIG.unknown;
  const { Icon } = cfg;

  const mutation = useMutation({
    mutationFn: ({ type, label }) =>
      base44.entities.Aircraft.update(aircraftId, {
        location_type: type,
        location_label: label,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fleet-aircraft'] });
      setEditing(false);
    },
  });

  const handleSave = () => {
    mutation.mutate({ type: draftType, label: draftLabel.trim() });
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraftType(locationType);
          setDraftLabel(locationLabel);
          setEditing(true);
        }}
        className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all',
          LOCATION_CONFIG[locationType].bg,
          LOCATION_CONFIG[locationType].border,
          LOCATION_CONFIG[locationType].color,
          'hover:brightness-125'
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{locationLabel && locationLabel !== '—' ? locationLabel : LOCATION_CONFIG[locationType].label}</span>
        <span className="text-[10px] opacity-50 ml-1">Edit</span>
      </button>
    );
  }

  return (
    <div className="space-y-3 px-5 py-3.5 rounded-xl border border-white/15 bg-[#141922]">
      <p className="text-sm font-bold text-white">Set Aircraft Location</p>

      {/* Type selector */}
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest min-w-fit">Type</p>
        <div className="flex gap-1">
          {TYPES.map(t => {
            const tcfg = LOCATION_CONFIG[t];
            const tIcon = tcfg.Icon;
            return (
              <button key={t} onClick={() => setDraftType(t)}
                className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all',
                  draftType === t
                    ? `${tcfg.bg} ${tcfg.border} ${tcfg.color}`
                    : 'border-white/10 text-gray-500 hover:text-white hover:bg-white/5'
                )}>
                {tIcon && <tIcon className="w-3.5 h-3.5" />}
                {tcfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Label input */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Label (optional)</p>
        <input
          ref={inputRef}
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          placeholder={`e.g. ${draftType === 'gate' ? 'Gate B14' : draftType === 'hangar' ? 'Hangar 3' : 'Ramp C7'}`}
          className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={() => setEditing(false)}
          className="flex-1 py-2 rounded-lg border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">
          Cancel
        </button>
        <button onClick={handleSave} disabled={mutation.isPending}
          className={cn('flex-1 py-2 rounded-lg text-sm font-bold border', cfg.bg, cfg.border, cfg.color, 'hover:brightness-125 disabled:opacity-50')}>
          Save
        </button>
      </div>
    </div>
  );
}