/**
 * EtopsCapabilityBadge
 * Displays live ETOPS dispatch capability derived from the aircraft record
 * and open MEL items — parallel to CatCapabilityBadge.
 *
 * Props:
 *   aircraft  — Aircraft entity record
 *   melItems  — Array of open MELItem records for this tail
 *   compact   — bool — inline pill instead of full card
 */

import { useMemo, useState } from 'react';
import { Globe, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { computeEtopsStatus, ETOPS_STATE_CONFIG, TYPE_MAX_ETOPS } from './EtopsSystemEngine';

export default function EtopsCapabilityBadge({ aircraft, melItems = [], compact = false }) {
  const [expanded, setExpanded] = useState(false);

  const result = useMemo(() => {
    const openMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');
    return computeEtopsStatus({ aircraft, melItems: openMels });
  }, [aircraft, melItems]);

  const cfg = ETOPS_STATE_CONFIG[result.badgeState] || ETOPS_STATE_CONFIG.NOT_ELIGIBLE;
  const designMax = TYPE_MAX_ETOPS[aircraft?.aircraft_type] || 0;
  const hasReasons = result.reasons.length > 0;

  // ── Compact pill ──────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide', cfg.bg, cfg.color)}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
        {result.minutes > 0 ? `ETOPS-${result.minutes}` : cfg.label}
      </span>
    );
  }

  // ── Full card ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn('rounded-2xl border overflow-hidden', cfg.bg)}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
        <Globe className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-black uppercase tracking-widest', cfg.color)}>
            {cfg.label}
            {result.minutes > 0 && (
              <span className="ml-2 font-mono">— {result.minutes} min</span>
            )}
          </p>
          <p className="text-[10px] opacity-60 mt-0.5">
            {result.badgeState === 'CAPABLE'
              ? `Approved ETOPS-${aircraft?.etops_approval} · Design max ETOPS-${designMax}`
              : result.badgeState === 'RESTRICTED'
              ? `Restricted from ETOPS-${aircraft?.etops_approval} by ${result.reasons.length} MEL item${result.reasons.length > 1 ? 's' : ''}`
              : result.badgeState === 'NOT_ELIGIBLE'
              ? 'No ETOPS design capability or operator approval for this tail'
              : result.reasons[0] || cfg.label
            }
          </p>
        </div>
        {hasReasons && result.badgeState !== 'NOT_ELIGIBLE' && (
          <button
            onClick={() => setExpanded(e => !e)}
            className={cn('flex items-center gap-1 text-[10px] font-bold opacity-70 hover:opacity-100 transition-opacity flex-shrink-0', cfg.color)}
          >
            {result.reasons.length} reason{result.reasons.length > 1 ? 's' : ''}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Expanded reasons */}
      {expanded && hasReasons && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {result.reasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', cfg.color)} />
              <p className="text-xs text-white/80 leading-snug">{reason}</p>
            </div>
          ))}
          <div className="px-4 py-2.5 flex items-center justify-end">
            <Link
              to="/ETOPSMonitor"
              className={cn('flex items-center gap-1 text-[10px] font-bold hover:opacity-100 opacity-70 transition-opacity', cfg.color)}
            >
              ETOPS Monitor <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}