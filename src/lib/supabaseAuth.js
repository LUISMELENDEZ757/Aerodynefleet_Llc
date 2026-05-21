import { createClient } from "@supabase/supabase-js";

let _client = null;

export async function getSupabaseAuthClient() {
  if (_client) return _client;

  let url = import.meta.env.VITE_SUPABASE_URL;
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const res = await fetch('/api/functions/getSupabaseConfig');
    const config = await res.json();
    url = config.supabaseUrl;
    key = config.supabaseKey;
  }

  if (!url || !key) throw new Error('Supabase config not available');

  _client = createClient(url, key);
  return _client;
}