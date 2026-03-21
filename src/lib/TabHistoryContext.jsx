/**
 * TabHistoryContext
 * ─────────────────
 * Maintains an independent navigation stack per primary tab, mimicking
 * iOS UITabBarController behaviour:
 *
 *  - Tapping a tab you're already on pops back to that tab's root.
 *  - Tapping a new tab restores where you left off in that tab.
 *  - Child navigations within a tab push onto that tab's stack.
 */
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Map each primary tab to its "root" path
export const TAB_ROOTS = {
  home:    '/Home',
  ops:     '/Dashboard',
  efb:     '/EFB',
  crew:    '/CrewControl',
};

// Which root belongs to which tab key
export function getTabForPath(pathname) {
  if (pathname.startsWith('/Home') || pathname === '/') return 'home';
  if (['/Dashboard', '/OOSDetail', '/NewOOS'].some(p => pathname.startsWith(p))) return 'ops';
  if (pathname.startsWith('/EFB')) return 'efb';
  if (['/CrewControl', '/CrewCalendar', '/CrewControl'].some(p => pathname.startsWith(p))) return 'crew';
  return null; // "more" tab group — no independent stack needed
}

const TabHistoryContext = createContext(null);

export function TabHistoryProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Last visited path per tab (persists across tab switches)
  const lastPaths = useRef({
    home:  '/Home',
    ops:   '/Dashboard',
    efb:   '/EFB',
    crew:  '/CrewControl',
  });

  // Track which tab is active so we can detect same-tab re-tap
  const [activeTab, setActiveTab] = useState(() => getTabForPath(location.pathname) || 'home');

  const navigateToTab = useCallback((tabKey) => {
    if (tabKey === activeTab) {
      // Same tab tapped → pop to root
      const root = TAB_ROOTS[tabKey];
      navigate(root, { replace: true });
      lastPaths.current[tabKey] = root;
    } else {
      // Different tab → restore last path in that tab
      const target = lastPaths.current[tabKey] || TAB_ROOTS[tabKey];
      setActiveTab(tabKey);
      navigate(target);
    }
  }, [activeTab, navigate]);

  // Called by pages when they push a child route within a tab
  const recordPath = useCallback((pathname) => {
    const tab = getTabForPath(pathname);
    if (tab) {
      lastPaths.current[tab] = pathname;
      setActiveTab(tab);
    }
  }, []);

  return (
    <TabHistoryContext.Provider value={{ activeTab, navigateToTab, recordPath, lastPaths }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  return useContext(TabHistoryContext);
}