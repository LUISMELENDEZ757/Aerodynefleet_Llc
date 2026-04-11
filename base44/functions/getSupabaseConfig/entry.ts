import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * getSupabaseConfig
 * Returns Supabase configuration to the frontend from backend secrets
 */

Deno.serve(async (req) => {
  try {
    const url = Deno.env.get('VITE_SUPABASE_URL');
    const key = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!url || !key) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    return Response.json({ supabaseUrl: url, supabaseKey: key });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});