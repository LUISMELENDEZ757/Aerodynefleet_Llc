import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { flight_id, status, delay_minutes, notes } = await req.json();

    if (!flight_id || !status) {
      return Response.json({ error: 'flight_id and status required' }, { status: 400 });
    }

    const updates = { status };
    if (delay_minutes != null) updates.delay_minutes = delay_minutes;
    if (notes) updates.notes = notes;

    const updated = await base44.entities.Flight.update(flight_id, updates);

    return Response.json({ success: true, flight: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});