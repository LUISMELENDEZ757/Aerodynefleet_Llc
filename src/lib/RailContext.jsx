import React, { createContext, useContext, useState } from 'react';

const RailContext = createContext({ expanded: true, setExpanded: () => {} });

export function RailProvider({ children }) {
  const [expanded, setExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem('rail_expanded');
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  });

  const toggle = () => {
    setExpanded(e => {
      const next = !e;
      try { localStorage.setItem('rail_expanded', String(next)); } catch {}
      return next;
    });
  };

  return (
    <RailContext.Provider value={{ expanded, setExpanded, toggle }}>
      {children}
    </RailContext.Provider>
  );
}

export function useRail() {
  return useContext(RailContext);
}