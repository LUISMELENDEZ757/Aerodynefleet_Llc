import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'update') return Response.json({ ok: true });

    const assignment = data;
    const alerts = [];

    // Illegal crew alert
    if (assignment.legal_status === 'illegal') {
      alerts.push({
        alert_type: 'crew_legality',
        severity: 'critical',
        title: `ILLEGAL CREW: ${assignment.crew_name}`,
        message: `${assignment.crew_name} (${assignment.role}) exceeds FAR 117 limits on flight ${assignment.flight_number}`,
        flight_number: assignment.flight_number,
        target_roles: ['dispatcher'],
        action_required: true,
        action_url: '/CrewControl'
      });
    }

    // Near limit alert
    if (assignment.legal_status === 'near_limit') {
      alerts.push({
        alert_type: 'crew_legality',
        severity: 'warning',
        title: `Crew Near Limit: ${assignment.crew_name}`,
        message: `${assignment.crew_name} approaching FAR 117 duty limits`,
        flight_number: assignment.flight_number,
        target_roles: ['dispatcher'],
        action_required: false,
        action_url: '/CrewControl'
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