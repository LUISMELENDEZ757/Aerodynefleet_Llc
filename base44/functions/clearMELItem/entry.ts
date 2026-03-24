import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { mel_id, cleared_by } = await req.json();

    if (!mel_id) {
      return Response.json({ error: 'mel_id required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const updates = {
      status: 'cleared',
      cleared_date: today,
      cleared_by: cleared_by || 'System'
    };

    const updated = await base44.entities.MELItem.update(mel_id, updates);

    return Response.json({ success: true, mel: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});