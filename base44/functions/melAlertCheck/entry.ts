import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CAT_DAYS = { A: 0, B: 3, C: 10, D: 120 };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated users and scheduled automation (service role)
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    // Fetch all open MEL items
    const items = await base44.asServiceRole.entities.MELItem.list('-deferred_date', 500);
    const openItems = items.filter(i => i.status !== 'cleared');

    const now = new Date().toISOString().split('T')[0];
    const alerts = [];
    const updates = [];

    for (const item of openItems) {
      const days = daysUntil(item.expiry_date);
      if (days === null) continue;

      let newStatus = item.status;
      let shouldAlert = false;
      let alertSeverity = 'info';
      let alertMsg = '';

      if (days < 0) {
        newStatus = 'expired';
        shouldAlert = true;
        alertSeverity = 'critical';
        alertMsg = `MEL EXPIRED: ${item.aircraft_tail} — ${item.description} (Cat ${item.category}) expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago. Aircraft may not be dispatchable.`;
      } else if (days <= 1) {
        newStatus = 'expiring_soon';
        shouldAlert = true;
        alertSeverity = 'critical';
        alertMsg = `MEL CRITICAL: ${item.aircraft_tail} — ${item.description} (Cat ${item.category}) expires TODAY${days === 1 ? ' TOMORROW' : ''}.`;
      } else if (days <= 3) {
        newStatus = 'expiring_soon';
        shouldAlert = true;
        alertSeverity = 'warning';
        alertMsg = `MEL WARNING: ${item.aircraft_tail} — ${item.description} (Cat ${item.category}) expires in ${days} day${days !== 1 ? 's' : ''} (${item.expiry_date}).`;
      } else if (item.category === 'B' && days <= 1) {
        newStatus = 'expiring_soon';
        shouldAlert = true;
        alertSeverity = 'warning';
        alertMsg = `Cat B MEL: ${item.aircraft_tail} — ${item.description} — only ${days}d remaining.`;
      }

      // Update status in DB if changed
      if (newStatus !== item.status) {
        updates.push(base44.asServiceRole.entities.MELItem.update(item.id, { status: newStatus }));
      }

      // Create OpsAlert if urgent
      if (shouldAlert) {
        alerts.push(base44.asServiceRole.entities.OpsAlert.create({
          alert_type: 'mx',
          severity: alertSeverity,
          title: `MEL ${days < 0 ? 'EXPIRED' : 'EXPIRING'}: ${item.aircraft_tail}`,
          message: alertMsg,
          aircraft_tail: item.aircraft_tail,
          action_required: true,
          target_roles: ['dispatcher', 'all'],
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }));
      }
    }

    await Promise.all([...updates, ...alerts]);

    return Response.json({
      checked: openItems.length,
      expired: openItems.filter(i => daysUntil(i.expiry_date) !== null && daysUntil(i.expiry_date) < 0).length,
      expiring_soon: openItems.filter(i => { const d = daysUntil(i.expiry_date); return d !== null && d >= 0 && d <= 3; }).length,
      alerts_created: alerts.length,
      status_updates: updates.length,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});