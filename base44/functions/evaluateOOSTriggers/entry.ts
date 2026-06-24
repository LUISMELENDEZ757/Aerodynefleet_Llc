/**
 * evaluateOOSTriggers — Hard OOS Trigger Engine
 *
 * Evaluates all known hard triggers against a single aircraft and its
 * open logbook entries, MEL items, and fault messages.
 *
 * Called by the automation or directly from the frontend.
 *
 * POST payload:
 *   { aircraft_tail: string }   — evaluate one tail
 *   { run_all: true }           — evaluate entire fleet
 *
 * Returns:
 *   { results: [{ tail, triggered, triggers, previous_status, new_status }] }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Safety-critical ATA chapters that are never MEL-deferrable ──────────────
const NO_GO_ATA = new Set([
  '27', // Flight Controls
  '32', // Landing Gear
  '71', // Power Plant General
  '72', // Engine
  '73', // Engine Fuel & Control
  '74', // Ignition
  '75', // Air (Bleed)
  '76', // Engine Controls
  '77', // Engine Indicating
  '78', // Exhaust
  '79', // Oil
  '80', // Starting
  '26', // Fire Protection
  '28', // Fuel
  '21', // Pressurization
  '29', // Hydraulics (flight-critical)
]);

// Keywords that indicate NO-GO discrepancy regardless of ATA
const NO_GO_KEYWORDS = [
  'no go', 'no-go', 'nogo',
  'fuel leak', 'fuel spill',
  'structural damage', 'structural crack', 'stress crack',
  'pressurization fail', 'press fail', 'cabin pressure',
  'fire warn', 'fire detect', 'fire loop',
  'engine fire', 'eng fire',
  'gear pin installed', 'gear pin not removed',
  'brake fail', 'anti-skid fail', 'antiskid fail',
  'control surface', 'elevator jam', 'rudder jam', 'aileron jam',
  'hydraulic leak', 'hyd leak', 'hyd fluid',
  'flight control', 'flt ctrl',
  'aoa fail', 'stall warn fail',
  'heavy maintenance', 'in storage', 'storage mode',
];

// ── MEL interval limits (days) by category ──────────────────────────────────
const MEL_LIMITS = { A: 1, B: 3, C: 10, D: 120 };

function evaluateTriggers({ aircraft, logbookEntries, melItems, faultMessages }) {
  const triggers = [];
  const tail = aircraft.tail_number;
  const now = new Date();

  // ── A. Non-deferrable discrepancies ────────────────────────────────────────
  const openEntries = logbookEntries.filter(e =>
    e.aircraft_tail === tail &&
    e.entry_type === 'discrepancy' &&
    !e.is_cleared &&
    e.discrepancy_status !== 'CLOSED'
  );

  for (const entry of openEntries) {
    const ata = (entry.ata_chapter || '').replace(/\D/g, '').padStart(2, '0').slice(0, 2);
    const desc = (entry.description || '').toLowerCase();

    // Safety-critical ATA — not deferred under MEL
    if (NO_GO_ATA.has(ata) && !entry.is_deferred) {
      triggers.push({
        code: 'NO_GO_ATA',
        severity: 'critical',
        message: `Open discrepancy on safety-critical ATA ${ata} (non-deferred): ${entry.description?.slice(0, 80)}`,
        source: 'logbook',
        entry_id: entry.id,
      });
    }

    // No-go keyword match
    const hit = NO_GO_KEYWORDS.find(kw => desc.includes(kw));
    if (hit) {
      triggers.push({
        code: 'NO_GO_KEYWORD',
        severity: 'critical',
        message: `Discrepancy contains NO-GO condition ("${hit}"): ${entry.description?.slice(0, 80)}`,
        source: 'logbook',
        entry_id: entry.id,
      });
    }

    // RII required but not signed
    if (entry.rii_required && !entry.rii_signed_at && entry.discrepancy_status !== 'CLOSED') {
      triggers.push({
        code: 'RII_UNSIGNED',
        severity: 'critical',
        message: `RII required but not signed for log page ${entry.log_page || entry.id?.slice(0, 8)}`,
        source: 'logbook',
        entry_id: entry.id,
      });
    }
  }

  // ── B. MEL expired / interval exceeded ─────────────────────────────────────
  const activeMels = melItems.filter(m =>
    m.aircraft_tail === tail &&
    m.status !== 'cleared'
  );

  for (const mel of activeMels) {
    // Hard expiry_date exceeded
    if (mel.expiry_date) {
      const exp = new Date(mel.expiry_date);
      if (now > exp) {
        triggers.push({
          code: 'MEL_EXPIRED',
          severity: 'critical',
          message: `MEL CAT-${mel.category} expired ${Math.ceil((now - exp) / 86400000)} day(s) ago: ${mel.description?.slice(0, 60)}`,
          source: 'mel',
          mel_id: mel.id,
        });
      }
    }

    // Deferred date + category limit check
    if (mel.deferred_date && mel.category && MEL_LIMITS[mel.category]) {
      const deferredMs = now - new Date(mel.deferred_date).getTime();
      const deferredDays = deferredMs / 86400000;
      const limit = MEL_LIMITS[mel.category];

      if (deferredDays > limit) {
        triggers.push({
          code: 'MEL_INTERVAL_EXCEEDED',
          severity: 'critical',
          message: `MEL CAT-${mel.category} exceeded ${limit}-day interval by ${Math.ceil(deferredDays - limit)} day(s): ${mel.description?.slice(0, 60)}`,
          source: 'mel',
          mel_id: mel.id,
        });
      }

      // Warning at 90% of interval
      if (deferredDays > limit * 0.9 && deferredDays <= limit) {
        triggers.push({
          code: 'MEL_INTERVAL_WARNING',
          severity: 'warning',
          message: `MEL CAT-${mel.category} nearing expiry (${Math.ceil(limit - deferredDays)} day(s) remaining): ${mel.description?.slice(0, 60)}`,
          source: 'mel',
          mel_id: mel.id,
        });
      }
    }
  }

  // ── C. ETOPS / CAT III blocks ───────────────────────────────────────────────
  // ETOPS blocked via MEL
  const etopsBlockedMel = activeMels.find(m => m.etops_impact === 'NO_ETOPS');
  if (etopsBlockedMel && aircraft.etops_approval > 0) {
    triggers.push({
      code: 'ETOPS_BLOCKED',
      severity: 'critical',
      message: `ETOPS-${aircraft.etops_approval} blocked by open MEL: ${etopsBlockedMel.description?.slice(0, 60)}`,
      source: 'etops',
      mel_id: etopsBlockedMel.id,
    });
  }

  // Active fault messages — severity WARNING or above on critical systems
  const criticalFaults = faultMessages.filter(f =>
    f.aircraft_tail === tail &&
    f.status === 'active' &&
    (f.severity === 'warning') &&
    ['engine', 'flight_controls', 'hydraulics', 'fuel', 'landing_gear'].includes(f.system)
  );

  for (const fault of criticalFaults) {
    triggers.push({
      code: 'ACTIVE_FAULT_CRITICAL_SYSTEM',
      severity: 'critical',
      message: `Active WARNING fault on ${fault.system?.toUpperCase()}: ${fault.fault_code} — ${fault.description?.slice(0, 60)}`,
      source: 'fault',
      fault_id: fault.id,
    });
  }

  // ── D. Configuration blocks ─────────────────────────────────────────────────
  // Gear pin (logbook keyword check)
  const gearPinEntry = openEntries.find(e =>
    (e.description || '').toLowerCase().includes('gear pin') ||
    (e.notes || '').toLowerCase().includes('gear pin')
  );
  if (gearPinEntry) {
    triggers.push({
      code: 'GEAR_PIN_INSTALLED',
      severity: 'critical',
      message: 'Gear safety pin installed — aircraft cannot taxi or depart',
      source: 'logbook',
      entry_id: gearPinEntry.id,
    });
  }

  // Ferry flight has special ops — flag but not hard OOS
  if (aircraft.ferry_flight) {
    triggers.push({
      code: 'FERRY_FLIGHT_MODE',
      severity: 'warning',
      message: 'Aircraft flagged for ferry flight — verify ferry permit before dispatch',
      source: 'aircraft',
    });
  }

  // ── Verdict ─────────────────────────────────────────────────────────────────
  const criticalTriggers = triggers.filter(t => t.severity === 'critical');
  const shouldBeOOS = criticalTriggers.length > 0;

  return { triggers, shouldBeOOS, criticalCount: criticalTriggers.length };
}

// ── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { aircraft_tail, run_all } = body;

    // Fetch data
    const [allAircraft, logbookEntries, melItems, faultMessages] = await Promise.all([
      base44.asServiceRole.entities.Aircraft.list('tail_number', 500),
      base44.asServiceRole.entities.LogbookEntry.filter({ is_cleared: false }),
      base44.asServiceRole.entities.MELItem.filter({ status: 'open' }),
      base44.asServiceRole.entities.FaultMessage.filter({ status: 'active' }),
    ]);

    const targets = run_all
      ? allAircraft
      : allAircraft.filter(a => a.tail_number === aircraft_tail);

    if (targets.length === 0) {
      return Response.json({ error: 'Aircraft not found' }, { status: 404 });
    }

    const results = [];

    for (const aircraft of targets) {
      const { triggers, shouldBeOOS, criticalCount } = evaluateTriggers({
        aircraft,
        logbookEntries,
        melItems,
        faultMessages,
      });

      const previousStatus = aircraft.status;
      let newStatus = previousStatus;
      let statusChanged = false;

      // Auto-transition to OOS if critical triggers found and not already down
      if (shouldBeOOS && !['oos', 'maintenance', 'rts_pending', 'retired'].includes(previousStatus)) {
        newStatus = 'oos';
        statusChanged = true;
        await base44.asServiceRole.entities.Aircraft.update(aircraft.id, {
          status: 'oos',
          oos_reason: `Auto-OOS: ${triggers.find(t => t.severity === 'critical')?.message?.slice(0, 120)}`,
          oos_since: new Date().toISOString(),
        });
      }

      results.push({
        tail: aircraft.tail_number,
        aircraft_type: aircraft.aircraft_type,
        triggered: triggers.length > 0,
        critical_count: criticalCount,
        triggers,
        previous_status: previousStatus,
        new_status: newStatus,
        status_changed: statusChanged,
      });
    }

    const autoOosed = results.filter(r => r.status_changed).length;

    return Response.json({
      evaluated: results.length,
      auto_oosed: autoOosed,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});