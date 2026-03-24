/**
 * NavigationStackContext
 * Canonical re-export of NavigationStack utilities as a React context shape.
 * Thin wrapper — actual logic lives in lib/NavigationStack.js.
 *
 * Import NavigationStack helpers from here for new code:
 *   import { useCurrentRouteInfo } from '@/context/NavigationStackContext';
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

export { useCurrentRouteInfo } from '@/hooks/useNavigationStack';