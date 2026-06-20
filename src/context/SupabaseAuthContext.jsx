import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { setSession } from '@/lib/supabaseAuth';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SupabaseAuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [session, setLocalSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session on mount (handles page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLocalSession(session);
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLocalSession(session);
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ session, loading }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);