import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * getSupabaseUsers
 * Returns all users from Supabase Auth using the service role key.
 * Supports actions: list, invite, updateRole, deleteUser
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { action, email, role, userId } = await req.json();

    if (action === 'list') {
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ users: data.users });
    }

    if (action === 'invite') {
      if (!email) return Response.json({ error: 'email required' }, { status: 400 });
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: role || 'user' }
      });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ user: data.user });
    }

    if (action === 'updateRole') {
      if (!userId || !role) return Response.json({ error: 'userId and role required' }, { status: 400 });
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role },
        app_metadata: { role }
      });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ user: data.user });
    }

    if (action === 'deleteUser') {
      if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});