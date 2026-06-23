/**
 * MelSeverityEngine.js
 * Computes MEL severity scores and identifies the primary restriction
 * across a set of active aircraft deferrals.
 *
 * Ported from TypeScript schema — all types are plain JS objects.
 */

// ── Point maps ────────────────────────────────────────────────────────────────

const DISPATCH_IMPACT_POINTS = {
  none:    0,
  limited: 25,
  blocked: 40,
};

const IMPACT_LEVEL_POINTS = {
  none:     0,
  minor:   10,
  major:   20,
  critical: 30,
};

const MEL_CATEGORY_POINTS = {
  A: 10,
  B:  8,
  C:  6,
  D:  3,
};

// ── Extra system impact points ────────────────────────────────────────────────

function extraSystemImpactPoints(mel) {
  let pts = 0;

  if (mel.fire_protection_impact) pts += 20;
  if (mel.fuel_system_impact)     pts += 15;
  if (mel.electrical_impact)      pts += 15;
  if (mel.hydraulic_impact)       pts += 15;
  if (mel.performance_limiting)   pts += 10;

  if (mel.affects_etops && mel.etops_block)            pts += 30;
  else if (mel.affects_etops && mel.etops_reduce_to)   pts += 20;

  if (mel.affects_cat_iii)      pts += 20;
  else if (mel.affects_cat_ii)  pts += 15;
  else if (mel.affects_cat_i)   pts += 10;

  if (mel.affects_rvsm) pts += 15;

  return pts;
}

// ── Core severity calculator ──────────────────────────────────────────────────

/**
 * computeMelSeverity(mel: MelItem) → number
 *
 * mel fields used:
 *   dispatch_impact_level : "none" | "limited" | "blocked"
 *   capability_loss_level  : "none" | "minor" | "major" | "critical"
 *   safety_impact_level    : "none" | "minor" | "major" | "critical"
 *   mel_category           : "A" | "B" | "C" | "D"
 *   fire_protection_impact : boolean
 *   fuel_system_impact     : boolean
 *   electrical_impact      : boolean
 *   hydraulic_impact       : boolean
 *   performance_limiting   : boolean
 *   affects_etops          : boolean
 *   etops_block            : boolean
 *   etops_reduce_to        : number | null
 *   affects_cat_i/ii/iii   : boolean
 *   affects_rvsm           : boolean
 */
export function computeMelSeverity(mel) {
  const dispatch    = DISPATCH_IMPACT_POINTS[mel.dispatch_impact_level]  ?? 0;
  const capability  = IMPACT_LEVEL_POINTS[mel.capability_loss_level]     ?? 0;
  const safety      = IMPACT_LEVEL_POINTS[mel.safety_impact_level]       ?? 0;
  const category    = MEL_CATEGORY_POINTS[mel.mel_category]              ?? 0;
  const extra       = extraSystemImpactPoints(mel);

  return dispatch + capability + safety + category + extra;
}

// ── Primary restriction selector ──────────────────────────────────────────────

/**
 * selectPrimaryMel(deferrals: AircraftMelDeferral[]) → AircraftMelDeferral | null
 *
 * Returns the highest-scoring active deferral and mutates each deferral object with:
 *   severity_score        : computed score
 *   is_primary_restriction: true only on the highest scorer
 *
 * deferral shape: { id, mel_item: MelItem, is_cleared: boolean, ... }
 */
export function selectPrimaryMel(deferrals = []) {
  const active = deferrals.filter(d => !d.is_cleared);
  if (active.length === 0) return null;

  // Score all active deferrals
  for (const d of active) {
    d.severity_score = computeMelSeverity(d.mel_item);
  }

  // Find highest
  const primary = active.reduce((best, d) =>
    d.severity_score > best.severity_score ? d : best,
    active[0]
  );

  // Mark primary flag
  for (const d of active) {
    d.is_primary_restriction = d.id === primary.id;
  }

  return primary;
}

// ── Convenience: rank all active deferrals highest → lowest ───────────────────

/**
 * rankMelDeferrals(deferrals: AircraftMelDeferral[]) → AircraftMelDeferral[]
 * Returns a new sorted array (does not mutate order of original).
 * Scores and flags are mutated onto each deferral object.
 */
export function rankMelDeferrals(deferrals = []) {
  const active = deferrals.filter(d => !d.is_cleared);
  for (const d of active) {
    d.severity_score = computeMelSeverity(d.mel_item);
  }
  return [...active].sort((a, b) => b.severity_score - a.severity_score);
}