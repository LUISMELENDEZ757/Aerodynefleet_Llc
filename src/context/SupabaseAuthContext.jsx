import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseAuthClient } from '@/lib/supabaseAuth';

const SupabaseAuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    const client = getSupabaseAuthClient();

    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ session, loading: session === undefined }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);