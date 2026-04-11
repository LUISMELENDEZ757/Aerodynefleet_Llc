import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * supabaseProxy
 * General-purpose Supabase data proxy using the shared connector.
 *
 * Actions:
 *   { action: 'list_projects' }
 *   { action: 'list_tables', project_ref?: string }
 *   { action: 'query', table: string, select?: string, filters?: object, limit?: number, offset?: number, order?: string, project_ref?: string }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const payload = await req.json();
    const { action } = payload;

    // ── List projects ────────────────────────────────────────────────────────
    if (action === 'list_projects') {
      const res = await fetch('https://api.supabase.com/v1/projects', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const projects = await res.json();
      return Response.json({ projects });
    }

    // ── Resolve project ref ──────────────────────────────────────────────────
    async function getProjectRef(explicitRef) {
      if (explicitRef) return explicitRef;
      const res = await fetch('https://api.supabase.com/v1/projects', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const projects = await res.json();
      if (!projects?.length) throw new Error('No Supabase projects found on this account.');
      // Default to AERODYNEMASTERnumber1 if available, else first
      const aero = projects.find(p => p.name === 'AERODYNEMASTERnumber1');
      return aero ? aero.ref : projects[0].ref;
    }

    // ── Get service_role key for PostgREST queries ───────────────────────────
    async function getServiceRoleKey(projectRef) {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const keys = await res.json();
      const srKey = keys.find(k => k.name === 'service_role');
      if (!srKey) throw new Error('Could not retrieve service_role key.');
      return srKey.api_key;
    }

    // ── List tables via PostgREST OpenAPI spec ───────────────────────────────
    if (action === 'list_tables' || action === 'get_schema') {
      const projectRef = await getProjectRef(payload.project_ref);
      const serviceRoleKey = await getServiceRoleKey(projectRef);
      const res = await fetch(`https://${projectRef}.supabase.co/rest/v1/`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });
      const spec = await res.json();
      const tables = Object.keys(spec.paths || {}).map(p => p.replace('/', '').replace(/^\//, ''));
      return Response.json({ project_ref: projectRef, tables, definitions: spec.definitions || {} });
    }

    // ── Query table data ─────────────────────────────────────────────────────
    if (action === 'query') {
      const { table, select = '*', filters = {}, limit = 100, offset = 0, order } = payload;
      if (!table) return Response.json({ error: 'table is required for query action' }, { status: 400 });

      const projectRef = await getProjectRef(payload.project_ref);
      const serviceRoleKey = await getServiceRoleKey(projectRef);

      const params = new URLSearchParams();
      params.set('select', select);
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (order) params.set('order', order);

      for (const [col, val] of Object.entries(filters)) {
        if (typeof val === 'object' && val !== null) {
          const [op, v] = Object.entries(val)[0];
          params.set(col, `${op}.${v}`);
        } else {
          params.set(col, `eq.${val}`);
        }
      }

      const url = `https://${projectRef}.supabase.co/rest/v1/${table}?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: 'count=exact',
        },
      });

      const data = await res.json();
      const contentRange = res.headers.get('Content-Range');
      const total = contentRange ? parseInt(contentRange.split('/')[1]) || null : null;

      return Response.json({ project_ref: projectRef, table, data, total, limit, offset });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});