import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * getSupabaseUsers
 * Returns all users from Supabase Auth using the service role key.
 * Supports actions: list, invite, updateRole, deleteUser
 */

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const anonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await req.json();
    const { action, email, role, userId, token } = body;

    // Verify the caller is a valid authenticated Supabase user
    if (token) {
      const anonClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: { user: callerUser }, error: callerError } = await anonClient.auth.getUser(token);
      if (callerError || !callerUser) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (action === 'list') {
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ users: data.users });
    }

    if (action === 'invite') {
      if (!email) return Response.json({ error: 'email required' });
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: role || 'user' }
      });
      if (error) return Response.json({ error: error.message });
      return Response.json({ user: data.user });
    }

    if (action === 'updateRole') {
      if (!userId || !role) return Response.json({ error: 'userId and role required' });
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role },
        app_metadata: { role }
      });
      if (error) return Response.json({ error: error.message });
      return Response.json({ user: data.user });
    }

    if (action === 'deleteUser') {
      if (!userId) return Response.json({ error: 'userId required' });
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) return Response.json({ error: error.message });
      return Response.json({ success: true });
    }

    return Response.json({ error: `Unknown action: ${action}` });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});