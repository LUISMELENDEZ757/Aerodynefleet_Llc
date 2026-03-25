import React, { createContext, useContext, useState } from 'react';

const RailContext = createContext({ expanded: true, setExpanded: () => {}, mode: 'flight', setMode: () => {} });

export function RailProvider({ children }) {
  const [expanded, setExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem('rail_expanded');
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  });

  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('rail_mode') || 'flight'; } catch { return 'flight'; }
  });

  const toggle = () => {
    setExpanded(e => {
      const next = !e;
      try { localStorage.setItem('rail_expanded', String(next)); } catch {}
      return next;
    });
  };

  const switchMode = (m) => {
    setMode(m);
    try { localStorage.setItem('rail_mode', m); } catch {}
  };

  return (
    <RailContext.Provider value={{ expanded, setExpanded, toggle, mode, switchMode }}>
      {children}
    </RailContext.Provider>
  );
}

export function useRail() {
  return useContext(RailContext);
}