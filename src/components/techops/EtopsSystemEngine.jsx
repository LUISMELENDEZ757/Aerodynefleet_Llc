/**
 * ETOPS System State Machine
 * Computes the current ETOPS dispatch capability from:
 *   1. Design layer  — aircraft type → max certified ETOPS rating
 *   2. Operator layer — operator ETOPS approval flag
 *   3. MEL/CDL layer  — active deferrals with etops_impact field
 *   4. Reliability/EMP layer — suspension flags
 *
 * Outputs one of five statuses:
 *   'CAPABLE'          — Full ETOPS at design rating, no restrictions
 *   'RESTRICTED'       — ETOPS available but reduced minutes (MEL/CDL)
 *   'NOT_AVAILABLE'    — Aircraft-specific block (MEL, EMP, time-limits)
 *   'SUSPENDED'        — Fleet-level or engine-combination suspension
 *   'NOT_ELIGIBLE'     — No ETOPS design capability or operator approval
 */

// ── Design layer: max ETOPS minutes by aircraft type ─────────────────────────
export const TYPE_MAX_ETOPS = {
  'B737-700':   120,
  'B737-800':   180,
  'B737-900':   180,
  'B737 MAX 8': 180,
  'B737 MAX 9': 180,
  'B757':       180,
  'B767':       180,
  'B777':       370,
  'B787':       330,
  'A320':       180,
  'A321':       180,
  'A350':       370,
  'E190':        0,   // Not ETOPS type
  'E175':        0,
  'CRJ700':      0,
  'CRJ900':      0,
};

// ── MEL ATA chapters that are ETOPS-critical ──────────────────────────────────
// Loss of these systems typically blocks or reduces ETOPS
export const ETOPS_CRITICAL_ATA = ['49', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '26', '24', '21', '36'];

/**
 * Evaluate MEL/CDL impact on ETOPS.
 * Uses the etops_impact field on MELItem when present, otherwise
 * falls back to ATA chapter heuristic for etops_critical items.
 *
 * @param {Array} melItems  — open MELItem records
 * @returns {{ blocksEtops: bool, reducesMinutes: number|null, reasons: string[] }}
 */
export function evaluateEtopsMelImpact(melItems = []) {
  let blocksEtops = false;
  let minAllowed = null;
  const reasons = [];

  for (const mel of melItems) {
    // Explicit etops_impact field takes priority
    if (mel.etops_impact === 'NO_ETOPS') {
      blocksEtops = true;
      reasons.push(`MEL ${mel.ata_chapter || mel.item_number || '—'}: ${mel.description} — ETOPS PROHIBITED`);
      continue;
    }

    if (mel.etops_impact === 'ETOPS_WITH_LIMITS') {
      const limit = mel.etops_limit_rating || 120;
      if (minAllowed === null || limit < minAllowed) minAllowed = limit;
      reasons.push(`MEL ${mel.ata_chapter || mel.item_number || '—'}: ${mel.description} — ETOPS limited to ${limit} min`);
      if (mel.etops_notes) reasons.push(`  Note: ${mel.etops_notes}`);
      continue;
    }

    // Fallback: etops_critical flag without explicit impact → treat as block
    if (mel.etops_critical && mel.etops_impact !== 'OK') {
      blocksEtops = true;
      reasons.push(`MEL ${mel.ata_chapter || mel.item_number || '—'}: ${mel.description} — ETOPS critical item`);
      continue;
    }

    // ATA chapter heuristic for items without explicit etops fields
    const ataPrefix = (mel.ata_chapter || '').split('-')[0];
    if (ETOPS_CRITICAL_ATA.includes(ataPrefix) && !mel.etops_impact) {
      // Only flag if description hints at propulsion/power/critical systems
      const isCritical = /\b(engine|apu|fuel\s*pump|hydraulic|generator|fire\s*(detect|suppress|loop|ext)|ecs|pack|bleed|oil\s*(pressure|pump|temp|qty)|cargo\s*fire|battery|alternator)\b/i.test(mel.description || '');
      if (isCritical) {
        // Degrade to 120 min if category A/B, leave 180 alone for C/D
        if (mel.category === 'A' || mel.category === 'B') {
          if (minAllowed === null || 120 < minAllowed) minAllowed = 120;
          reasons.push(`MEL ${mel.ata_chapter || '—'}: ${mel.description} — ETOPS degraded to 120 min (Cat ${mel.category})`);
        }
      }
    }
  }

  return {
    blocksEtops,
    reducesMinutes: !blocksEtops && minAllowed !== null,
    allowedMinutes: minAllowed,
    reasons,
  };
}

/**
 * Main ETOPS status computation.
 *
 * @param {object} params
 *   aircraft         — Aircraft entity record
 *   melItems         — open MELItem records for this tail
 *   empOnSchedule    — bool (default true — EMP tasks on schedule)
 *   timeLimitsOk     — bool (default true — cargo fire/batteries within limits)
 *   suspended        — bool (fleet-level or engine-combination suspension)
 * @returns {{ status, minutes, reasons, badgeState }}
 */
export function computeEtopsStatus({
  aircraft = {},
  melItems = [],
  empOnSchedule = true,
  timeLimitsOk = true,
  suspended = false,
} = {}) {
  const designMinutes = TYPE_MAX_ETOPS[aircraft.aircraft_type] || 0;
  const operatorApproved = (aircraft.etops_approval || 0) > 0;

  // 1. Not eligible
  if (!operatorApproved || designMinutes === 0) {
    return {
      status: 'NOT_ELIGIBLE',
      minutes: 0,
      reasons: [
        !designMinutes ? `${aircraft.aircraft_type || 'This type'} is not ETOPS-capable` : null,
        !operatorApproved ? 'No tail-level ETOPS approval on file' : null,
      ].filter(Boolean),
      badgeState: 'NOT_ELIGIBLE',
    };
  }

  // 2. Fleet/combination suspension
  if (suspended) {
    return {
      status: 'SUSPENDED',
      minutes: 0,
      reasons: ['ETOPS suspended — fleet-level or engine-combination hold'],
      badgeState: 'SUSPENDED',
    };
  }

  const reasons = [];
  let blocked = false;
  let minutes = Math.min(designMinutes, aircraft.etops_approval);

  // 3. EMP tasks
  if (!empOnSchedule) {
    blocked = true;
    reasons.push('ETOPS maintenance program tasks overdue');
  }

  // 4. Time-limited systems
  if (!timeLimitsOk) {
    blocked = true;
    reasons.push('Time-limited systems (cargo fire / batteries) not within ETOPS limits');
  }

  // 5. MEL/CDL impact
  const melImpact = evaluateEtopsMelImpact(melItems);
  if (melImpact.blocksEtops) {
    blocked = true;
    reasons.push(...melImpact.reasons);
  } else if (melImpact.reducesMinutes && melImpact.allowedMinutes < minutes) {
    minutes = melImpact.allowedMinutes;
    reasons.push(...melImpact.reasons);
  }

  if (blocked) {
    return { status: 'NOT_AVAILABLE', minutes: 0, reasons, badgeState: 'NOT_AVAILABLE' };
  }

  if (reasons.length > 0) {
    return { status: 'RESTRICTED', minutes, reasons, badgeState: 'RESTRICTED' };
  }

  return { status: 'CAPABLE', minutes, reasons: [], badgeState: 'CAPABLE' };
}

// ── UI config per badge state ─────────────────────────────────────────────────
export const ETOPS_STATE_CONFIG = {
  CAPABLE: {
    label: 'ETOPS CAPABLE',
    color: 'text-cyan-300',
    bg: 'bg-cyan-950/30 border-cyan-500/40',
    dot: 'bg-cyan-400',
  },
  RESTRICTED: {
    label: 'ETOPS WITH RESTRICTIONS',
    color: 'text-amber-300',
    bg: 'bg-amber-950/40 border-amber-500/50',
    dot: 'bg-amber-400',
  },
  NOT_AVAILABLE: {
    label: 'ETOPS NOT AVAILABLE',
    color: 'text-orange-300',
    bg: 'bg-orange-950/40 border-orange-500/50',
    dot: 'bg-orange-400',
  },
  SUSPENDED: {
    label: 'ETOPS SUSPENDED',
    color: 'text-red-300',
    bg: 'bg-red-950/50 border-red-500/60',
    dot: 'bg-red-400 animate-pulse',
  },
  NOT_ELIGIBLE: {
    label: 'NOT ETOPS ELIGIBLE',
    color: 'text-gray-400',
    bg: 'bg-gray-900/40 border-gray-600/40',
    dot: 'bg-gray-500',
  },
};