import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Please add them in App Settings → Secrets.');
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

// Session stored in memory + listeners
let _session = null;
let _listeners = [];

export function getSession() {
  return _session;
}

export function setSession(session) {
  _session = session;
  _listeners.forEach(fn => fn(session));
}

export function onSessionChange(fn) {
  _listeners.push(fn);
  try {
    const client = getSupabase();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      _listeners = _listeners.filter(l => l !== fn);
      subscription?.unsubscribe();
    };
  } catch {
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  }
}

export async function signIn(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  setSession(data.session);
  return data;
}

export async function signUp(email, password) {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (data.session) setSession(data.session);
  return data;
}

export async function signOut() {
  await getSupabase().auth.signOut();
  setSession(null);
}