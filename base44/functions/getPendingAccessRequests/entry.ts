import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createClient } from 'npm:@supabase/supabase-js@2.103.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all Supabase auth users
    const { data: { users: authUsers = [] } } = await supabase.auth.admin.listUsers();

    // Get all registered Base44 users
    const registeredUsers = await base44.entities.User.list('-created_date', 1000);
    const registeredEmails = new Set(registeredUsers.map(u => u.email));

    // Filter for pending users (in auth but not in Base44 User entity)
    const pendingRequests = authUsers.filter(u => 
      u.email && !registeredEmails.has(u.email) && u.user_metadata?.access_request === true
    );

    return Response.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});