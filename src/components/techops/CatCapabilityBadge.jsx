/**
 * CatCapabilityBadge
 * Derives live CAT approach capability from open MEL items.
 *
 * For each open MEL, it runs the CatSystemEngine against the item's
 * ATA chapter + description. The worst result across all open MELs
 * becomes the fleet-displayed badge.
 *
 * Props:
 *   aircraft     — Aircraft record (provides aircraft_type + cat_approval)
 *   melItems     — Array of open MELItem records for this tail
 *   compact      — bool — render as inline badge instead of full card
 */

import { useMemo, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { computeCatState, CAT_STATE_CONFIG } from './CatSystemEngine';

const CAT_RANK = { CAT_III: 3, CAT_II: 2, CAT_I: 1, NO_CAT: 0, UNKNOWN: -1 };

// Human-readable badge labels per state
const BADGE_LABELS = {
  CAT_III: 'CAT III: CAPABLE',
  CAT_II:  'CAT II ONLY',
  CAT_I:   'CAT I ONLY',
  NO_CAT:  'NO CAT CAPABILITY',
  UNKNOWN: 'CAT: REVIEW REQUIRED',
};

const BADGE_STYLES = {
  CAT_III: 'bg-green-500/20 border-green-500/60 text-green-300',
  CAT_II:  'bg-amber-500/20 border-amber-500/60 text-amber-300',
  CAT_I:   'bg-orange-500/20 border-orange-500/60 text-orange-300',
  NO_CAT:  'bg-red-500/20 border-red-500/60 text-red-300',
  UNKNOWN: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
};

const DOT_STYLES = {
  CAT_III: 'bg-green-400',
  CAT_II:  'bg-amber-400',
  CAT_I:   'bg-orange-400',
  NO_CAT:  'bg-red-400 animate-pulse',
  UNKNOWN: 'bg-yellow-400',
};

const RESTRICTION_LABELS = {
  CAT_II:  'CAT III restricted by MEL',
  CAT_I:   'CAT II/III restricted by MEL',
  NO_CAT:  'CAT I/II/III restricted by MEL',
  UNKNOWN: 'CAT status requires review',
};

/**
 * Derive aircraft design-max CAT from the aircraft record or fallback string
 */
function getDesignMaxFromRecord(aircraft) {
  if (!aircraft) return 'CAT_III';
  // Use explicit cat_approval field if set
  if (aircraft.cat_approval) {
    const map = {
      'CAT I':   'CAT_I',
      'CAT II':  'CAT_II',
      'CAT IIIa':'CAT_III',
      'CAT IIIb':'CAT_III',
      'CAT IIIc':'CAT_III',
    };
    return map[aircraft.cat_approval] || 'CAT_III';
  }
  return null; // Let CatSystemEngine derive from aircraft_type
}

export default function CatCapabilityBadge({ aircraft, melItems = [], compact = false }) {
  const [expanded, setExpanded] = useState(false);

  // Run engine against every open MEL and find worst state
  const { worstState, affectingMels } = useMemo(() => {
    const openMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');
    const hits = [];

    for (const mel of openMels) {
      const result = computeCatState(
        aircraft?.aircraft_type || '',
        mel.ata_chapter || '',
        mel.description || ''
      );
      if (result.state && result.state !== null) {
        hits.push({ mel, result });
      }
    }

    if (hits.length === 0) {
      return { worstState: 'CAT_III', affectingMels: [] };
    }

    // Find worst (lowest rank)
    const sorted = hits.sort((a, b) => (CAT_RANK[a.result.state] ?? 99) - (CAT_RANK[b.result.state] ?? 99));
    return { worstState: sorted[0].result.state, affectingMels: sorted };
  }, [melItems, aircraft]);

  const cfg = CAT_STATE_CONFIG[worstState] || CAT_STATE_CONFIG.UNKNOWN;
  const badgeLabel = BADGE_LABELS[worstState] || 'CAT: UNKNOWN';
  const badgeStyle = BADGE_STYLES[worstState] || BADGE_STYLES.UNKNOWN;
  const dotStyle   = DOT_STYLES[worstState]   || DOT_STYLES.UNKNOWN;
  const isRestricted = worstState !== 'CAT_III';

  // ── Compact inline badge ────────────────────────────────────────────────────
  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide', badgeStyle)}>
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotStyle)} />
        {badgeLabel}
      </span>
    );
  }

  // ── Full card ────────────────────────────────────────────────────────────────
  return (
    <div className={cn('rounded-2xl border overflow-hidden', isRestricted ? badgeStyle : 'bg-green-950/20 border-green-500/30')}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotStyle)} />
        <Shield className={cn('w-4 h-4 flex-shrink-0', isRestricted ? 'text-inherit' : 'text-green-400')} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-black uppercase tracking-widest', isRestricted ? '' : 'text-green-300')}>
            {badgeLabel}
          </p>
          {isRestricted && affectingMels.length > 0 && (
            <p className="text-[10px] opacity-70 mt-0.5">{RESTRICTION_LABELS[worstState]}</p>
          )}
          {!isRestricted && (
            <p className="text-[10px] text-green-400/60 mt-0.5">
              No CAT-restricting MELs active — {aircraft?.cat_approval || 'full capability'}
            </p>
          )}
        </div>
        {isRestricted && affectingMels.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-[10px] font-bold opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            {affectingMels.length} MEL{affectingMels.length > 1 ? 's' : ''}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Expanded: list of restricting MELs */}
      {expanded && isRestricted && affectingMels.length > 0 && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {affectingMels.map(({ mel, result }) => {
            const melState = result.state;
            const melCfg = CAT_STATE_CONFIG[melState] || {};
            const catLabel = BADGE_LABELS[melState] || melState;
            const daysLabel = mel.mel_category
              ? { A: 'ASAP', B: '3 days', C: '10 days', D: '120 days' }[mel.mel_category] || mel.mel_category
              : null;

            return (
              <div key={mel.id} className="flex items-start gap-3 px-4 py-3">
                <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', melCfg.color || 'text-amber-400')} />
                <div className="flex-1 min-w-0">
                  {/* Reason line */}
                  <p className="text-xs font-semibold text-white/90 leading-snug">
                    Restricted by MEL:{' '}
                    <span className="font-black text-white">
                      {mel.ata_chapter || mel.item_number || '—'} {mel.description}
                    </span>
                    {mel.mel_category && daysLabel && (
                      <span className="ml-1 text-gray-400">(Cat {mel.mel_category}, {daysLabel})</span>
                    )}
                  </p>
                  {/* Affected systems chips */}
                  {result.affectedSystems?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.affectedSystems.map(s => (
                        <span key={s.system}
                          className={cn('text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wide', BADGE_STYLES[melState] || BADGE_STYLES.UNKNOWN)}>
                          {s.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Expiry */}
                  {mel.expiry_date && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Expires: {new Date(mel.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {/* CAT impact badge */}
                <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0', BADGE_STYLES[melState] || BADGE_STYLES.UNKNOWN)}>
                  {catLabel.replace(' ONLY', '')}
                </span>
              </div>
            );
          })}

          {/* Link to MEL dashboard */}
          <div className="px-4 py-2.5 flex items-center justify-end">
            <Link
              to="/MEL"
              className="flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors"
            >
              View MEL Dashboard <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}