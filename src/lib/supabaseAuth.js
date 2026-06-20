import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  // Also sync with Supabase's own auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });
  return () => {
    _listeners = _listeners.filter(l => l !== fn);
    subscription?.unsubscribe();
  };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  setSession(data.session);
  return data;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (data.session) setSession(data.session);
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  setSession(null);
}