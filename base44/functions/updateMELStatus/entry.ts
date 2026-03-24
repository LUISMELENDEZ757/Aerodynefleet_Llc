import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' && event.type !== 'update') return Response.json({ ok: true });

    const melItem = data;
    const today = new Date();
    const expiryDate = new Date(melItem.expiry_date);

    // Determine status based on expiry date
    let status = melItem.status;
    if (melItem.status !== 'cleared') {
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 3) {
        status = 'expiring_soon';
      } else {
        status = 'open';
      }

      // Update if status changed
      if (status !== melItem.status) {
        await base44.asServiceRole.entities.MELItem.update(melItem.id, { status });
      }
    }

    return Response.json({ ok: true, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});