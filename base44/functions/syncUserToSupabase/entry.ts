import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * syncUserToSupabase
 * Syncs a Base44 user into Supabase Auth.
 * Called by entity automation on User create/update, or manually.
 *
 * Payload (from entity automation):
 *   { event: { type, entity_name, entity_id }, data: { email, full_name, role, ... } }
 *
 * Also callable directly:
 *   { email: string, full_name?: string, role?: string }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Support both automation payload and direct call
    const userData = payload.data || payload;
    const email = userData.email;
    const fullName = userData.full_name || '';
    const role = userData.role || 'user';

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    // Get Supabase service_role key via connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    // Find the AERODYNEMASTERnumber1 project
    const projRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const projects = await projRes.json();
    const project = projects.find(p => p.name === 'AERODYNEMASTERnumber1') || projects[0];
    if (!project) throw new Error('No Supabase project found');
    const projectRef = project.ref;

    // Get service_role key
    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const keys = await keysRes.json();
    const srKey = keys.find(k => k.name === 'service_role')?.api_key;
    if (!srKey) throw new Error('Could not retrieve service_role key');

    const adminBase = `https://${projectRef}.supabase.co/auth/v1/admin`;
    const headers = {
      apikey: srKey,
      Authorization: `Bearer ${srKey}`,
      'Content-Type': 'application/json',
    };

    // Check if user already exists in Supabase Auth
    const listRes = await fetch(`${adminBase}/users?page=1&per_page=1000`, { headers });
    const listData = await listRes.json();
    const existingUser = (listData.users || []).find(u => u.email === email);

    if (existingUser) {
      // Update existing user metadata
      const updateRes = await fetch(`${adminBase}/users/${existingUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          user_metadata: { full_name: fullName, role },
          app_metadata: { role, synced_from: 'base44' },
        }),
      });
      const updated = await updateRes.json();
      return Response.json({ action: 'updated', supabase_user_id: updated.id, email });
    } else {
      // Create new user in Supabase Auth
      // Generate a secure random password — user will need to use "Forgot Password" to set their own
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      const createRes = await fetch(`${adminBase}/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          password: tempPassword,
          email_confirm: true, // auto-confirm so no confirmation email needed
          user_metadata: { full_name: fullName, role },
          app_metadata: { role, synced_from: 'base44' },
        }),
      });
      const created = await createRes.json();
      if (created.error) throw new Error(created.message || created.error);
      return Response.json({ action: 'created', supabase_user_id: created.id, email });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});