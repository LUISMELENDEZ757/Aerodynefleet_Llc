import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'update' && event.type !== 'create') return Response.json({ ok: true });

    const melItem = data;
    const alerts = [];

    // Expired MEL item alert
    if (melItem.status === 'expired') {
      alerts.push({
        alert_type: 'mx',
        severity: 'critical',
        title: `MEL Item Expired: ${melItem.aircraft_tail}`,
        message: `ATA ${melItem.ata_chapter}: ${melItem.description} expired on ${melItem.expiry_date}`,
        aircraft_tail: melItem.aircraft_tail,
        target_roles: ['dispatcher'],
        action_required: true,
        action_url: '/MEL'
      });
    }

    // Expiring soon alert
    if (melItem.status === 'expiring_soon') {
      alerts.push({
        alert_type: 'mx',
        severity: 'warning',
        title: `MEL Item Expiring Soon: ${melItem.aircraft_tail}`,
        message: `ATA ${melItem.ata_chapter}: ${melItem.description} expires ${melItem.expiry_date}`,
        aircraft_tail: melItem.aircraft_tail,
        target_roles: ['dispatcher'],
        action_required: false,
        action_url: '/MEL'
      });
    }

    // Create alerts
    for (const alert of alerts) {
      await base44.entities.OpsAlert.create(alert);
    }

    return Response.json({ ok: true, alerts_created: alerts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});