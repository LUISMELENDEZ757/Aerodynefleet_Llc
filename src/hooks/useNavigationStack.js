/**
 * useNavigationStack
 * Canonical re-export + convenience hook wrapping NavigationStack utilities.
 * Keeps consuming code decoupled from lib/NavigationStack.js path.
 */
export {
  ROUTE_DEPTH,
  getRouteDepth,
  getNavigationDirection,
  isValidNavigation,
  getTabForRoute,
  getPrimaryTabRoutes,
  isPrimaryTab,
  isChildScreen,
} from '@/lib/NavigationStack';

import { useLocation } from 'react-router-dom';
import { getRouteDepth, isPrimaryTab, isChildScreen, getTabForRoute } from '@/lib/NavigationStack';

/**
 * Returns metadata about the current route from within a component.
 */
export function useCurrentRouteInfo() {
  const location = useLocation();
  const depth    = getRouteDepth(location.pathname);
  const tab      = getTabForRoute(location.pathname);

  return {
    pathname:     location.pathname,
    depth,
    tab,
    isPrimary:    isPrimaryTab(location.pathname),
    isChild:      isChildScreen(location.pathname),
  };
}