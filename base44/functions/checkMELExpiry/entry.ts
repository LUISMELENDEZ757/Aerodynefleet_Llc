/**
 * checkMELExpiry — Scheduled automation
 * Runs daily. Checks MEL items approaching expiry or already expired.
 * MEL category limits: A=varies, B=3 days, C=10 days, D=120 days.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MEL_CATEGORY_DAYS = { A: 1, B: 3, C: 10, D: 120 };
const WARN_DAYS_BEFORE = 2; // Alert this many days before limit

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const today = new Date();

  const melItems = await base44.asServiceRole.entities.MELItem.list('-created_date', 1000);
  const activeItems = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');

  const results = { expired: [], expiring_soon: [], alerts_created: 0 };

  for (const item of activeItems) {
    if (!item.mel_category || !item.deferred_date) continue;

    const limitDays = MEL_CATEGORY_DAYS[item.mel_category];
    if (!limitDays) continue;

    const deferredAt = new Date(item.deferred_date);
    const expiryDate = new Date(deferredAt.getTime() + limitDays * 24 * 60 * 60 * 1000);
    const msUntilExpiry = expiryDate - today;
    const daysUntilExpiry = Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));

    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = !isExpired && daysUntilExpiry <= WARN_DAYS_BEFORE;

    if (!isExpired && !isExpiringSoon) continue;

    // Update MEL status
    const newStatus = isExpired ? 'expired' : 'expiring_soon';
    if (item.status !== newStatus) {
      await base44.asServiceRole.entities.MELItem.update(item.id, { status: newStatus });
    }

    const severity = isExpired ? 'critical' : 'warning';
    const tail = item.aircraft_tail || item.tail_number || '—';
    const title = isExpired
      ? `MEL EXPIRED: Cat ${item.mel_category} — ${tail}`
      : `MEL Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}: Cat ${item.mel_category} — ${tail}`;

    await base44.asServiceRole.entities.OpsAlert.create({
      alert_type: 'mx',
      severity,
      title,
      message: `MEL Item: ${item.mel_reference || item.title || '—'}\nAircraft: ${tail} | Category ${item.mel_category} | Deferred: ${item.deferred_date} | Expires: ${expiryDate.toISOString().split('T')[0]}`,
      aircraft_tail: tail,
      target_roles: ['admin', 'mcc_supervisor', 'dispatcher', 'engineer'],
      action_required: isExpired,
    });

    results.alerts_created++;
    if (isExpired) results.expired.push(`${tail} Cat-${item.mel_category}`);
    else results.expiring_soon.push(`${tail} Cat-${item.mel_category} (${daysUntilExpiry}d)`);
  }

  return Response.json({
    success: true,
    checked: activeItems.length,
    ...results,
    run_at: today.toISOString(),
  });
});