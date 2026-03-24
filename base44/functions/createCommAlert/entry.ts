import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') return Response.json({ ok: true });

    const msg = data;
    
    // Only create alerts for broadcasts and urgent/emergency messages
    if (msg.message_type !== 'broadcast' && msg.priority !== 'urgent' && msg.priority !== 'emergency') {
      return Response.json({ ok: true });
    }

    const severity = msg.priority === 'emergency' ? 'critical' : msg.priority === 'urgent' ? 'warning' : 'info';

    const alert = {
      alert_type: 'dispatch',
      severity,
      title: `${msg.message_type === 'broadcast' ? 'BROADCAST' : msg.priority?.toUpperCase()}: ${msg.channel}`,
      message: msg.content,
      flight_number: msg.flight_number || null,
      target_roles: msg.target_roles || ['all'],
      action_url: '/CommCenter',
      action_required: msg.priority === 'emergency'
    };

    await base44.entities.OpsAlert.create(alert);

    return Response.json({ ok: true, alert_created: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});