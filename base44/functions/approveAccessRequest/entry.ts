import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createClient } from 'npm:@supabase/supabase-js@2.103.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the auth user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);

    if (!authUser) {
      return Response.json({ error: 'User not found in auth' }, { status: 404 });
    }

    // Create Base44 User record
    await base44.entities.User.create({
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || 'Unknown',
      role: 'user',
    });

    // Update Supabase auth user metadata
    await supabase.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...authUser.user_metadata,
        access_request: false,
        approved_at: new Date().toISOString(),
      },
    });

    return Response.json({ status: 'approved', email });
  } catch (error) {
    console.error('Error approving request:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});