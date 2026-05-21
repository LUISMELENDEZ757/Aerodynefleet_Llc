import { createContext, useContext, useEffect, useState } from 'react';
import { initSupabaseAuthClient } from '@/lib/supabaseAuth';

const SupabaseAuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    let subscription;

    initSupabaseAuthClient()
      .then((client) => {
        client.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
        });

        const { data } = client.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
        subscription = data.subscription;
      })
      .catch((err) => {
        console.error('Supabase init error:', err);
        setInitError(err.message);
        setSession(null);
      });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ session, loading: session === undefined, initError }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);