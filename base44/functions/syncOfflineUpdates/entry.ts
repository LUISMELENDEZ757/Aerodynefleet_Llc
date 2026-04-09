import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { updates } = await req.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return Response.json({ synced: 0, failed: 0, errors: [] });
    }

    const results = [];
    let synced = 0;
    let failed = 0;
    const errors = [];

    for (const update of updates) {
      try {
        const { operation, entity, id, data } = update;

        let result;
        if (operation === 'create') {
          result = await base44.entities[entity].create(data);
          synced++;
          results.push({ id: update.id, status: 'synced', serverId: result.id });
        } else if (operation === 'update') {
          await base44.entities[entity].update(id, data);
          synced++;
          results.push({ id: update.id, status: 'synced' });
        } else if (operation === 'delete') {
          await base44.entities[entity].delete(id);
          synced++;
          results.push({ id: update.id, status: 'synced' });
        }
      } catch (err) {
        failed++;
        errors.push({ updateId: update.id, error: err.message });
        results.push({ id: update.id, status: 'failed', error: err.message });
      }
    }

    return Response.json({
      synced,
      failed,
      errors,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});