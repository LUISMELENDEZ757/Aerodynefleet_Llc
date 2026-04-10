/**
 * checkDiscrepancyEscalation — Scheduled automation
 * Runs every hour. Escalates discrepancies that remain OPEN or IN_PROGRESS
 * beyond configured thresholds without a corrective action.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ESCALATION_THRESHOLDS_HOURS = {
  OPEN: 4,        // Escalate if OPEN for > 4 hours
  IN_PROGRESS: 8, // Escalate if IN_PROGRESS for > 8 hours
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const now = new Date();

  const entries = await base44.asServiceRole.entities.LogbookEntry.filter({ entry_type: 'discrepancy' });
  const activeEntries = entries.filter(e =>
    e.discrepancy_status === 'OPEN' || e.discrepancy_status === 'IN_PROGRESS'
  );

  const results = { escalated: 0, checked: activeEntries.length };

  for (const entry of activeEntries) {
    const referenceTime = entry.discrepancy_status === 'IN_PROGRESS' && entry.work_started_at
      ? new Date(entry.work_started_at)
      : new Date(entry.created_date);

    const hoursElapsed = (now - referenceTime) / (1000 * 60 * 60);
    const threshold = ESCALATION_THRESHOLDS_HOURS[entry.discrepancy_status];

    if (hoursElapsed < threshold) continue;

    // Check if we already sent an escalation alert for this entry recently (avoid spam)
    const existingAlerts = await base44.asServiceRole.entities.OpsAlert.filter({
      aircraft_tail: entry.aircraft_tail,
    });
    const recentEscalation = existingAlerts.find(a =>
      a.title?.includes(entry.id?.slice(-6)) &&
      (now - new Date(a.created_date)) < 4 * 60 * 60 * 1000 // within last 4 hours
    );
    if (recentEscalation) continue;

    const hoursStr = hoursElapsed.toFixed(1);
    await base44.asServiceRole.entities.OpsAlert.create({
      alert_type: 'mx',
      severity: hoursElapsed > threshold * 2 ? 'critical' : 'warning',
      title: `Discrepancy Escalation: ${entry.aircraft_tail} — ${entry.discrepancy_status} for ${hoursStr}h [${entry.id?.slice(-6)}]`,
      message: `Open discrepancy requires attention.\nAircraft: ${entry.aircraft_tail} | Status: ${entry.discrepancy_status} | ATA: ${entry.ata_chapter || '—'}\nOpen for: ${hoursStr} hours\nDescription: ${entry.description?.slice(0, 120)}`,
      aircraft_tail: entry.aircraft_tail,
      flight_number: entry.flight_number,
      target_roles: ['admin', 'mcc_supervisor'],
      action_required: true,
    });

    results.escalated++;
  }

  return Response.json({ success: true, ...results, run_at: now.toISOString() });
});