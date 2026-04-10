/**
 * checkADAlerts — Scheduled automation
 * Runs daily. Finds ADs due within 30 days or already overdue,
 * creates OpsAlert records, and sends email notifications.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const today = new Date();
  const warnWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days

  const ads = await base44.asServiceRole.entities.AirworthinessDirective.list('-effective_date', 1000);
  const openADs = ads.filter(ad => ad.status === 'open' || ad.status === 'overdue');

  const results = { overdue: [], due_soon: [], alerts_created: 0 };

  for (const ad of openADs) {
    if (!ad.compliance_due_date) continue;

    const dueDate = new Date(ad.compliance_due_date);
    const msUntilDue = dueDate - today;
    const daysUntilDue = Math.ceil(msUntilDue / (24 * 60 * 60 * 1000));

    const isOverdue = daysUntilDue < 0;
    const isDueSoon = !isOverdue && daysUntilDue <= 30;

    if (!isOverdue && !isDueSoon) continue;

    // Update AD status to overdue if applicable
    if (isOverdue && ad.status !== 'overdue') {
      await base44.asServiceRole.entities.AirworthinessDirective.update(ad.id, { status: 'overdue' });
    }

    const severity = isOverdue ? 'critical' : daysUntilDue <= 7 ? 'warning' : 'info';
    const title = isOverdue
      ? `AD OVERDUE: ${ad.ad_number} — ${ad.aircraft_tail}`
      : `AD Due in ${daysUntilDue} days: ${ad.ad_number} — ${ad.aircraft_tail}`;

    await base44.asServiceRole.entities.OpsAlert.create({
      alert_type: 'mx',
      severity,
      title,
      message: `${ad.title}\nAircraft: ${ad.aircraft_tail} | ATA: ${ad.ata_chapter || '—'} | Due: ${ad.compliance_due_date} | Authority: ${ad.issuing_authority}`,
      aircraft_tail: ad.aircraft_tail,
      target_roles: ['admin', 'mcc_supervisor', 'engineer'],
      action_required: isOverdue,
    });

    results.alerts_created++;
    if (isOverdue) results.overdue.push(ad.ad_number);
    else results.due_soon.push(ad.ad_number);
  }

  return Response.json({
    success: true,
    checked: openADs.length,
    ...results,
    run_at: today.toISOString(),
  });
});