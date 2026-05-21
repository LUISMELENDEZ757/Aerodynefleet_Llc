import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseAuth } from '@/lib/supabaseAuth';

const SupabaseAuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ session, loading: session === undefined }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);