import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists in User entity
    const existingUsers = await base44.entities.User.filter({ email: user.email });
    
    if (existingUsers.length > 0) {
      return Response.json({ 
        status: 'already_registered',
        message: 'User already has access' 
      });
    }

    // Create pending_access user record
    const newUser = await base44.entities.User.create({
      email: user.email,
      full_name: user.full_name || 'Unknown',
      role: 'pending_access',
    });

    return Response.json({
      status: 'pending',
      message: 'Access request submitted. Admin approval pending.',
      user_id: newUser.id,
    });
  } catch (error) {
    console.error('requestAccessOnFirstLogin error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});