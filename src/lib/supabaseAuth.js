import { createClient } from "@supabase/supabase-js";
import { base44 } from "@/api/base44Client";

let _client = null;

export async function getSupabaseAuthClient() {
  if (_client) return _client;

  let url = import.meta.env.VITE_SUPABASE_URL;
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const res = await base44.functions.invoke('getSupabaseConfig', {});
    url = res.data?.supabaseUrl;
    key = res.data?.supabaseKey;
  }

  if (!url || !key) throw new Error('Supabase config not available');

  _client = createClient(url, key);
  return _client;
}