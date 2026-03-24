import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { crew_id, legal_status, notes } = await req.json();

    if (!crew_id || !legal_status) {
      return Response.json({ error: 'crew_id and legal_status required' }, { status: 400 });
    }

    const updates = { legal_status };
    if (notes) updates.notes = notes;

    const updated = await base44.entities.CrewAssignment.update(crew_id, updates);

    return Response.json({ success: true, crew: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});