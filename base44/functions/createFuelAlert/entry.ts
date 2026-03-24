import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'update' && event.type !== 'create') return Response.json({ ok: true });

    const fuelRecord = data;
    const alerts = [];

    // Fuel variance flagged
    if (fuelRecord.release_status === 'variance_flagged') {
      const varianceAbs = Math.abs(fuelRecord.variance_percent || 0);
      alerts.push({
        alert_type: 'fuel',
        severity: varianceAbs > 10 ? 'critical' : 'warning',
        title: `Fuel Variance: ${fuelRecord.flight_number}`,
        message: `Fuel burn variance ${fuelRecord.variance_percent > 0 ? '+' : ''}${fuelRecord.variance_percent?.toFixed(1)}% (${fuelRecord.variance_lbs} lbs) from plan`,
        flight_number: fuelRecord.flight_number,
        aircraft_tail: fuelRecord.aircraft_tail,
        target_roles: ['dispatcher'],
        action_required: true,
        action_url: '/Fuel'
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