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

    // Find the pending user in Base44
    const users = await base44.entities.User.filter({ email });
    const pendingUser = users.find(u => u.role === 'pending_access');

    if (!pendingUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Update role from pending_access to user
    await base44.entities.User.update(pendingUser.id, { role: 'user' });

    return Response.json({ status: 'approved', email });
  } catch (error) {
    console.error('Error approving request:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});