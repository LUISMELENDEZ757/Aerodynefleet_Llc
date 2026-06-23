/**
 * CAT System State Machine
 * Computes the current CAT capability state from:
 *   1. Design layer — aircraft type → max certified CAT level
 *   2. Technical layer — ATA chapter + discrepancy text → affected systems
 *
 * States (ordered descending):
 *   'CAT_III'   — All CAT III systems available
 *   'CAT_II'    — CAT III lost, CAT II still met
 *   'CAT_I'     — CAT II/III lost, CAT I still met
 *   'NO_CAT'    — One or more CAT I-required systems unavailable
 *   null        — No CAT-relevant system involved
 */

// ── Design layer: max CAT by aircraft type ────────────────────────────────────
const TYPE_MAX_CAT = {
  'B737-700':   'CAT_II',
  'B737-800':   'CAT_III',
  'B737-900':   'CAT_III',
  'B737 MAX 8': 'CAT_III',
  'B737 MAX 9': 'CAT_III',
  'B757':       'CAT_III',
  'B767':       'CAT_III',
  'B777':       'CAT_III',
  'B787':       'CAT_III',
  'A320':       'CAT_III',
  'A321':       'CAT_III',
  'A350':       'CAT_III',
  'E190':       'CAT_II',
  'E175':       'CAT_II',
  'CRJ700':     'CAT_II',
  'CRJ900':     'CAT_II',
};

// ── Technical layer: system keyword patterns mapped to CAT impact ─────────────
// Each entry: { pattern, catImpact: 'CAT_III' | 'CAT_II' | 'CAT_I' | 'NO_CAT', system, label }
const CAT_SYSTEM_RULES = [
  // CAT I required systems — loss → NO_CAT
  { pattern: /\b(autopilot|auto\s*pilot|ap\s+inop|ap\s+fail)\b/i,        catImpact: 'NO_CAT',  system: 'AUTOPILOT',      label: 'Autopilot' },
  { pattern: /\b(ils\s*(rcvr|receiver|inop|fail|#?1)|single\s*ils)\b/i,  catImpact: 'NO_CAT',  system: 'ILS',            label: 'ILS Receiver' },
  { pattern: /\b(radio\s*alt(imeter)?|ra\s*(#?1|inop|fail)|ralt)\b/i,    catImpact: 'NO_CAT',  system: 'RADIO_ALT',      label: 'Radio Altimeter' },
  { pattern: /\b(flight\s*director|fd\s*(inop|fail|#?1))\b/i,            catImpact: 'NO_CAT',  system: 'FLIGHT_DIR',     label: 'Flight Director' },

  // CAT II required systems — loss → CAT_I (CAT II/III blocked)
  { pattern: /\b(dual\s*ils|ils\s*#?2|second\s*ils|ils\s*(rcvr|receiver)\s*2)\b/i,  catImpact: 'CAT_I', system: 'ILS_DUAL',      label: 'Dual ILS' },
  { pattern: /\b(dual\s*(ra|radio\s*alt)|ra\s*#?2|second\s*ra)\b/i,                 catImpact: 'CAT_I', system: 'RA_DUAL',       label: 'Dual Radio Altimeter' },
  { pattern: /\b(afds|a\/p\s*engage|approach\s*mode|coupled\s*approach|cat\s*ii\s*(ap|mode|cpl))\b/i, catImpact: 'CAT_I', system: 'AFDS_CAT2', label: 'AFDS CAT II' },
  { pattern: /\b(fcc|flight\s*control\s*comp)\b/i,                                   catImpact: 'CAT_I', system: 'FCC',           label: 'Flight Control Computer' },
  { pattern: /\b(mcp|mode\s*control\s*panel)\b/i,                                    catImpact: 'CAT_I', system: 'MCP',           label: 'Mode Control Panel' },
  { pattern: /\b(adiru|iru\s*(inop|fail|#?[12])|inertial\s*ref)\b/i,                 catImpact: 'CAT_I', system: 'ADIRU',         label: 'ADIRU/IRS' },

  // CAT III required systems — loss → CAT_II (CAT III blocked only)
  { pattern: /\b(autoland|auto\s*land|auto\s*land\s*(inop|fail))\b/i,               catImpact: 'CAT_II', system: 'AUTOLAND',     label: 'Autoland' },
  { pattern: /\b(fail\s*op(erational)?|fail\s*passive|rollout\s*(mode|guidance))\b/i, catImpact: 'CAT_II', system: 'FAIL_OP',   label: 'Fail-Operational AFDS' },
  { pattern: /\b(redundant\s*a\/p|dual\s*autopilot|triple\s*(ap|channel))\b/i,       catImpact: 'CAT_II', system: 'AP_REDUNDANT', label: 'Redundant Autopilot Channels' },
  { pattern: /\b(localizer|loc\s*(inop|fail|#?[12]))\b/i,                            catImpact: 'CAT_II', system: 'LOCALIZER',    label: 'Localizer' },
  { pattern: /\b(glide\s*slope|g\/s\s*(inop|fail|#?[12])|glideslope)\b/i,            catImpact: 'CAT_II', system: 'GLIDESLOPE',   label: 'Glide Slope' },
];

// ATA chapters that are CAT-relevant
const CAT_ATA_CHAPTERS = ['22', '34', '31', '23', '27'];

const CAT_RANK = { 'CAT_III': 3, 'CAT_II': 2, 'CAT_I': 1, 'NO_CAT': 0 };

/**
 * Compute CAT state from inputs.
 * @param {string} aircraftType  — e.g. 'B737-800'
 * @param {string} ataChapter    — e.g. '22'
 * @param {string} description   — discrepancy write-up text
 * @returns {{ state: string|null, designMax: string|null, affectedSystems: Array, lowestImpact: string|null }}
 */
export function computeCatState(aircraftType = '', ataChapter = '', description = '') {
  const designMax = TYPE_MAX_CAT[aircraftType] || null;

  // Check ATA relevance
  const ataRelevant = CAT_ATA_CHAPTERS.some(a => ataChapter?.startsWith(a));

  // Match rules against description
  const text = description || '';
  const matched = CAT_SYSTEM_RULES.filter(r => r.pattern.test(text));

  if (matched.length === 0 && !ataRelevant) {
    // Also do a broad check for any CAT keyword to catch generic mentions
    const broadMatch = /\b(cat\s*(i{1,3}|[123])|autoland|ils|localizer|glide\s*slope|radio\s*alt|autopilot|flight\s*director|fcc|adiru|mcp|afds)\b/i.test(text);
    if (!broadMatch) return { state: null, designMax, affectedSystems: [], lowestImpact: null };
  }

  if (matched.length === 0) {
    // ATA is relevant but no specific system keyword — flag as potentially CAT-affected
    return { state: 'UNKNOWN', designMax, affectedSystems: [], lowestImpact: null };
  }

  // Find the lowest (worst) impact among matched systems
  const lowestImpact = matched.reduce((worst, rule) => {
    return CAT_RANK[rule.catImpact] < CAT_RANK[worst] ? rule.catImpact : worst;
  }, 'CAT_III');

  // Effective state = min(designMax, lowestImpact)
  // If design doesn't support CAT III, cap accordingly
  const designRank = designMax ? CAT_RANK[designMax] : 3;
  const impactRank = CAT_RANK[lowestImpact];
  const effectiveRank = Math.min(designRank, impactRank);

  const rankToState = { 3: 'CAT_III', 2: 'CAT_II', 1: 'CAT_I', 0: 'NO_CAT' };
  const state = rankToState[effectiveRank];

  return {
    state,
    designMax,
    affectedSystems: matched.map(r => ({ system: r.system, label: r.label, impact: r.catImpact })),
    lowestImpact,
  };
}

export const CAT_STATE_CONFIG = {
  CAT_III: {
    label: 'CAT III Capable',
    color: 'text-green-400',
    bg: 'bg-green-950/40 border-green-500/50',
    dot: 'bg-green-400',
    severity: 'ok',
  },
  CAT_II: {
    label: 'CAT II Only — CAT III Lost',
    color: 'text-amber-400',
    bg: 'bg-amber-950/50 border-amber-500/60',
    dot: 'bg-amber-400',
    severity: 'warn',
  },
  CAT_I: {
    label: 'CAT I Only — CAT II/III Lost',
    color: 'text-orange-400',
    bg: 'bg-orange-950/50 border-orange-500/60',
    dot: 'bg-orange-400',
    severity: 'degraded',
  },
  NO_CAT: {
    label: 'No CAT Capability — CAT I Systems Affected',
    color: 'text-red-400',
    bg: 'bg-red-950/60 border-red-500/70',
    dot: 'bg-red-500',
    severity: 'critical',
  },
  UNKNOWN: {
    label: 'CAT System — Review Required',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/40 border-yellow-500/50',
    dot: 'bg-yellow-400',
    severity: 'unknown',
  },
};

export const CAT_REMEDIATION = {
  NO_CAT: 'One or more CAT I-required systems (autopilot, ILS, radio altimeter, or flight director) are affected. The aircraft cannot conduct ILS approaches until the system is fully restored. MEL deferral must reference the applicable CAT I item. Maintenance Control notification required immediately.',
  CAT_I: 'CAT II and CAT III capability is lost. The aircraft may conduct CAT I ILS approaches only. Full restoration of the affected CAT II system (dual ILS, dual RA, AFDS CAT II mode) or MEL deferral under the applicable item is required before CAT II/III operations resume.',
  CAT_II: 'CAT III autoland capability is lost. CAT II approaches are still permitted. Full restoration of the autoland / fail-operational AFDS system, including a functional check per AMM, or deferral under the applicable MEL item is required before CAT III operations resume.',
  UNKNOWN: 'The ATA chapter indicates a CAT-relevant system may be affected. Review the discrepancy against the MEL and confirm the current CAT status with Maintenance Control before dispatch.',
};