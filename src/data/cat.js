// AeroMOS Fleet Board — CAT (autoland / ILS) capability store (mock).

const LEVELS = ["CAT I", "CAT II", "CAT IIIa", "CAT IIIb", "CAT IIIc"];
const idx = (lvl) => (LEVELS.indexOf(lvl) === -1 ? 1 : LEVELS.indexOf(lvl));

// Baseline max-certified CAT by variant family.
const BASELINE_BY_VARIANT = (variant = "") => {
  if (/777|787|350/.test(variant)) return "CAT IIIc";
  if (/max 8|max 9|a320|a321|767/.test(variant)) return "CAT IIIb";
  if (/800|900|757/.test(variant)) return "CAT IIIa";
  return "CAT II";
};

const LEVEL_META = {
  "CAT I":    { label: "CAT I",    rvr: "≥ 550m" },
  "CAT II":   { label: "CAT II",   rvr: "≥ 350m" },
  "CAT IIIa": { label: "CAT IIIa", rvr: "≥ 200m" },
  "CAT IIIb": { label: "CAT IIIb", rvr: "≥ 50m"  },
  "CAT IIIc": { label: "CAT IIIc", rvr: "0 / 0"  },
};

const BADGE_COLOR = {
  "CAT I":    "#F03252",
  "CAT II":   "#F5A623",
  "CAT IIIa": "#3D8EF0",
  "CAT IIIb": "#00D48A",
  "CAT IIIc": "#00D4F5",
};

// An aircraft is downgraded one step while grounded / OOS / in maintenance, and
// further if it carries an open MEL on an autoland-related system. The mock
// data does not model the specific MEL, so we downgrade a single step here.
export function effectiveCat(a) {
  const baseline = BASELINE_BY_VARIANT(a.variant);
  const needsDowngrade = a.boardStatus !== "released" || a.grounded;
  const melPenalty = a.openMel > 0 ? 1 : 0;
  const steps = (needsDowngrade ? 1 : 0) + melPenalty;
  const level = LEVELS[Math.max(0, idx(baseline) - steps)];
  return { level, baseline, downgraded: level !== baseline };
}

export function catBadgeColor(eff) {
  return BADGE_COLOR[eff.level] || "#8296B8";
}

export function levelMeta(level) {
  return LEVEL_META[level] || { label: level, rvr: "—" };
}

const listeners = new Set();
export function subscribeCat(cb) { listeners.add(cb); return () => listeners.delete(cb); }
export function notifyCat() { listeners.forEach((f) => f()); }