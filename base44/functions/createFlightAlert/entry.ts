import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'update') return Response.json({ ok: true });

    const flight = data;
    const alerts = [];

    // Delay alert (>15 min)
    if (flight.delay_minutes > 15) {
      alerts.push({
        alert_type: 'flight_status',
        severity: flight.delay_minutes > 60 ? 'critical' : 'warning',
        title: `Flight ${flight.flight_number} Delayed`,
        message: `${flight.delay_minutes} minute delay from ${flight.origin} to ${flight.destination}`,
        flight_number: flight.flight_number,
        aircraft_tail: flight.aircraft_tail,
        target_roles: ['dispatcher', 'captain'],
        action_required: true,
        action_url: '/Dashboard'
      });
    }

    // Cancellation alert
    if (flight.status === 'cancelled') {
      alerts.push({
        alert_type: 'flight_status',
        severity: 'critical',
        title: `Flight ${flight.flight_number} Cancelled`,
        message: `${flight.origin} → ${flight.destination} has been cancelled`,
        flight_number: flight.flight_number,
        aircraft_tail: flight.aircraft_tail,
        target_roles: ['dispatcher', 'captain', 'flight_attendant'],
        action_required: true,
        action_url: '/Dashboard'
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