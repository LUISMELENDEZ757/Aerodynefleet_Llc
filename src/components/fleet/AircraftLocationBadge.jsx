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
 * Display-only badge showing aircraft location type and label.
 *
 * Props:
 *   locationType  – 'gate' | 'hangar' | 'ramp' | 'unknown'
 *   locationLabel – optional freetext e.g. "Gate B14"
 *   size          – 'sm' (default) | 'md'
 */
export default function AircraftLocationBadge({
  locationType = 'unknown',
  locationLabel = '',
  size = 'sm',
}) {
  const cfg = LOCATION_CONFIG[locationType] || LOCATION_CONFIG.unknown;
  const { Icon } = cfg;

  if (locationType === 'unknown') return null;

  const isSm = size === 'sm';

  return (
    <div className="flex items-center gap-1 rounded border font-bold"
      style={{
        backgroundColor: cfg.bg.replace('bg-', ''),
        borderColor: cfg.border.replace('border-', ''),
        color: cfg.color.replace('text-', ''),
        padding: isSm ? '2px 6px' : '4px 8px',
        fontSize: isSm ? '9px' : '11px'
      }}
    >
      {Icon && (
        <Icon className={cn('flex-shrink-0', isSm ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      )}
      <span>
        {locationLabel && locationLabel !== '—' ? locationLabel : cfg.label}
      </span>
    </div>
  );
}