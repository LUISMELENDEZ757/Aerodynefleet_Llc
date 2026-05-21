import { base44 } from '@/api/base44Client';

// Session stored in memory
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
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export async function signIn(email, password) {
  const res = await base44.functions.invoke('supabaseAuth', { action: 'signIn', email, password });
  if (res.data?.error) throw new Error(res.data.error);
  setSession(res.data.session);
  return res.data;
}

export async function signUp(email, password) {
  const res = await base44.functions.invoke('supabaseAuth', { action: 'signUp', email, password });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export async function signOut() {
  const token = _session?.access_token;
  if (token) {
    await base44.functions.invoke('supabaseAuth', { action: 'signOut', token });
  }
  setSession(null);
}