/**
 * TabHistoryContext
 * ─────────────────
 * Maintains an independent navigation stack per primary tab, mimicking
 * iOS UITabBarController behaviour, synchronized with NavigationStack.
 *
 *  - Tapping a tab you're already on pops back to that tab's root.
 *  - Tapping a new tab restores where you left off in that tab.
 *  - Child navigations within a tab push onto that tab's stack.
 * 
 * Enforces strict validation via NavigationStack to prevent orphaned routes.
 */
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTabForRoute, getPrimaryTabRoutes, isValidNavigation, getRouteDepth } from './NavigationStack';

// Map each primary tab to its "root" path (from NavigationStack)
export const TAB_ROOTS = getPrimaryTabRoutes();

// Which root belongs to which tab key (using NavigationStack mapping)
export function getTabForPath(pathname) {
  const tab = getTabForRoute(pathname);
  return tab === 'more' ? null : tab;
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
  // Validates navigation via NavigationStack before recording
  const recordPath = useCallback((pathname) => {
    const prevPathname = Object.values(lastPaths.current)[0] || '/Home';
    
    // Validate navigation before recording
    if (!isValidNavigation(pathname, prevPathname, { lastPaths })) {
      console.warn(`[TabHistory] Invalid navigation blocked: ${prevPathname} → ${pathname}`);
      return;
    }

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