import { createClient } from "@supabase/supabase-js";

let supabase = null;

const initSupabase = async () => {
  if (supabase) return supabase;

  try {
    // Try frontend env vars first
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (url && key) {
      supabase = createClient(url, key);
      return supabase;
    }

    // Fall back to backend config
    const res = await fetch('/api/functions/getSupabaseConfig');
    const { supabaseUrl, supabaseKey } = await res.json();
    
    if (!supabaseUrl || !supabaseKey) throw new Error('No Supabase config available');
    supabase = createClient(supabaseUrl, supabaseKey);
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
};

export { initSupabase };
export const getSupabase = () => supabase || initSupabase();