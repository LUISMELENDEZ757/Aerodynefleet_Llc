import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabaseAuthClient() {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
  }

  _client = createClient(url, key);
  return _client;
}