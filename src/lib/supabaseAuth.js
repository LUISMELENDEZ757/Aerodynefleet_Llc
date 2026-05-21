import { createClient } from "@supabase/supabase-js";
import { base44 } from '@/api/base44Client';

let _client = null;
let _initPromise = null;

export async function initSupabaseAuthClient() {
  if (_client) return _client;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    let url = import.meta.env.VITE_SUPABASE_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      const res = await base44.functions.invoke('getSupabaseConfig', {});
      url = res.data?.supabaseUrl;
      key = res.data?.supabaseKey;
    }

    if (!url || !key) {
      throw new Error('Supabase credentials could not be resolved.');
    }

    _client = createClient(url, key);
    return _client;
  })();

  return _initPromise;
}

export function getSupabaseAuthClient() {
  if (!_client) throw new Error('Supabase client not initialized yet.');
  return _client;
}