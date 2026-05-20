import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    const projectRef = 'rkrfmvwuqyyfyvvwxkyv';
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const keys = await res.json();
    return Response.json({ keys });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});