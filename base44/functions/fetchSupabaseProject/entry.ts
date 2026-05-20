import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    const res = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const projects = await res.json();
    return Response.json({ projects });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});