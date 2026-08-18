/**
 * checkDiscrepancyEscalation — Scheduled automation
 * Runs every hour. Escalates discrepancies that remain OPEN or IN_PROGRESS
 * beyond configured thresholds without a corrective action.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ESCALATION_THRESHOLDS_HOURS = {
  OPEN: 4,        // Escalate if OPEN for > 4 hours
  IN_PROGRESS: 8, // Escalate if IN_PROGRESS for > 8 hours
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    const entries = await base44.asServiceRole.entities.LogbookEntry.filter(
      { entry_type: 'discrepancy' }, '-created_date', 500
    );
    const activeEntries = entries.filter(e =>
      e.discrepancy_status === 'OPEN' || e.discrepancy_status === 'IN_PROGRESS'
    );

    // Fetch recent alerts once (last 4h window) to avoid duplicate escalations
    const recentAlerts = await base44.asServiceRole.entities.OpsAlert.filter(
      { alert_type: 'mx' }, '-created_date', 200
    );
    const fourHoursAgo = now.getTime() - 4 * 60 * 60 * 1000;
    const recentTitles = recentAlerts
      .filter(a => new Date(a.created_date).getTime() > fourHoursAgo)
      .map(a => a.title || '');

    const results = { escalated: 0, checked: activeEntries.length };

    for (const entry of activeEntries) {
      const referenceTime = entry.discrepancy_status === 'IN_PROGRESS' && entry.work_started_at
        ? new Date(entry.work_started_at)
        : new Date(entry.created_date);
      if (isNaN(referenceTime.getTime())) continue;

      const hoursElapsed = (now.getTime() - referenceTime.getTime()) / (1000 * 60 * 60);
      const threshold = ESCALATION_THRESHOLDS_HOURS[entry.discrepancy_status];
      if (hoursElapsed < threshold) continue;

      const entryRef = entry.id ? entry.id.slice(-6) : '';
      if (entryRef && recentTitles.some(t => t.includes(entryRef))) continue;

      const hoursStr = hoursElapsed.toFixed(1);
      await base44.asServiceRole.entities.OpsAlert.create({
        alert_type: 'mx',
        severity: hoursElapsed > threshold * 2 ? 'critical' : 'warning',
        title: `Discrepancy Escalation: ${entry.aircraft_tail} — ${entry.discrepancy_status} for ${hoursStr}h [${entryRef}]`,
        message: `Open discrepancy requires attention.\nAircraft: ${entry.aircraft_tail} | Status: ${entry.discrepancy_status} | ATA: ${entry.ata_chapter || '—'}\nOpen for: ${hoursStr} hours\nDescription: ${(entry.description || '').slice(0, 120)}`,
        aircraft_tail: entry.aircraft_tail,
        flight_number: entry.flight_number,
        target_roles: ['admin', 'mcc_supervisor'],
        action_required: true,
      });

      results.escalated++;
    }

    return Response.json({ success: true, ...results, run_at: now.toISOString() });
  } catch (error) {
    console.error('checkDiscrepancyEscalation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}