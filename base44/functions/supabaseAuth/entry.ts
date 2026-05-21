import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * supabaseAuth
 * Handles Supabase auth operations server-side to avoid CORS/fetch issues in the frontend preview.
 * Actions: signIn, signUp, getSession (via token)
 */

Deno.serve(async (req) => {
  try {
    const url = Deno.env.get('VITE_SUPABASE_URL');
    const key = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!url || !key) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(url, key);
    const { action, email, password, token } = await req.json();

    if (action === 'signIn') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ session: data.session, user: data.user });
    }

    if (action === 'signUp') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ session: data.session, user: data.user });
    }

    if (action === 'signOut') {
      if (!token) return Response.json({ error: 'token required' }, { status: 400 });
      const authed = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const { error } = await authed.auth.signOut();
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});