import { createClient } from "@supabase/supabase-js";
import { appParams } from '@/lib/app-params';

let _client = null;
let _initPromise = null;

async function fetchConfigFromBackend() {
  const appId = appParams.appId;
  const baseUrl = appParams.appBaseUrl || `https://api.base44.com`;
  const res = await fetch(`${baseUrl}/api/apps/${appId}/functions/getSupabaseConfig`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to fetch Supabase config from backend');
  return res.json();
}

export async function initSupabaseAuthClient() {
  if (_client) return _client;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    let url = import.meta.env.VITE_SUPABASE_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      const config = await fetchConfigFromBackend();
      url = config.supabaseUrl;
      key = config.supabaseKey;
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
  if (!_client) throw new Error('Supabase client not initialized yet. Call initSupabaseAuthClient() first.');
  return _client;
}