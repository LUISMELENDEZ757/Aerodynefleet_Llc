import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Set it in Dashboard → Settings → Environment Variables.');
}
if (!supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Set it in Dashboard → Settings → Environment Variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);