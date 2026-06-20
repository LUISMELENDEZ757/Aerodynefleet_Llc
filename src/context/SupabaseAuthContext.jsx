import { createContext, useContext, useEffect, useState } from 'react';
import { setSession } from '@/lib/supabaseAuth';

const SupabaseAuthContext = createContext(null);



export function SupabaseAuthProvider({ children }) {
  const [session, setLocalSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      // No Supabase config — skip auth gate, let app render
      setLoading(false);
      return;
    }

    import('@supabase/supabase-js').then(({ createClient }) => {
      const client = createClient(url, key);

      client.auth.getSession().then(({ data: { session } }) => {
        setLocalSession(session);
        setSession(session);
        setLoading(false);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setLocalSession(session);
        setSession(session);
      });

      return () => subscription?.unsubscribe();
    });
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ session, loading }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);