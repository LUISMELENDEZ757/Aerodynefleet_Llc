import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, onSessionChange } from '@/lib/supabaseAuth';

const SupabaseAuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [session, setSession] = useState(getSession()); // null = not logged in

  useEffect(() => {
    const unsub = onSessionChange((s) => setSession(s));
    return unsub;
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ session, loading: false }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);