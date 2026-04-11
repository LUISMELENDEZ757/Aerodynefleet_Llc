import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createClient } from 'npm:@supabase/supabase-js@2.103.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all Base44 users
    const allUsers = await base44.entities.User.list('-created_date', 1000);
    const approvedEmails = new Set(allUsers.map(u => u.email));

    // Get pending access requests from Base44 (users with pending_access role)
    const pendingRequests = allUsers.filter(u => u.role === 'pending_access');

    return Response.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});