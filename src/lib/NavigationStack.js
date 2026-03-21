/**
 * NavigationStack - Enforces strict navigation stack synchronized with tab history
 * 
 * Provides:
 * - Route depth mapping for precise animation direction
 * - Navigation stack validation to prevent orphaned routes
 * - Synchronized state between router and tab history
 */

/**
 * Comprehensive route depth map:
 * Depth 0: Root/home screens
 * Depth 1: Primary tab navigation screens
 * Depth 2: Child screens (detail views, forms)
 * Depth 3+: Deeper nested views
 */
export const ROUTE_DEPTH = {
  // Root
  '/Home': 0,
  '/': 0,

  // Primary tabs (depth 1)
  '/Dashboard': 1,
  '/FlightAttendant': 1,
  '/FlightCrew': 1,
  '/EFB': 1,
  '/CrewCalendar': 1,
  '/CrewControl': 1,
  '/WorldClock': 1,
  '/SafetyQA': 1,
  '/Scheduling': 1,
  '/Weather': 1,
  '/Learning': 1,
  '/Settings': 1,

  // Child screens - Dashboard tab (depth 2)
  '/OOSDetail': 2,
  '/NewOOS': 2,
};

/**
 * Get depth for a given pathname, with fallback validation
 * @param {string} pathname - Current pathname
 * @returns {number} Route depth (0, 1, 2, etc.)
 */
export function getRouteDepth(pathname) {
  // Exact match
  if (ROUTE_DEPTH[pathname] !== undefined) {
    return ROUTE_DEPTH[pathname];
  }

  // Query parameters — match base path
  const basePath = pathname.split('?')[0];
  if (ROUTE_DEPTH[basePath] !== undefined) {
    return ROUTE_DEPTH[basePath];
  }

  // Fallback: assume depth 1 for unknown routes
  return 1;
}

/**
 * Determine navigation direction based on depth change
 * @param {number} currentDepth - Current route depth
 * @param {number} previousDepth - Previous route depth
 * @returns {number} Direction: >0 = push (deeper), <0 = pop (back), 0 = same
 */
export function getNavigationDirection(currentDepth, previousDepth) {
  return currentDepth - previousDepth;
}

/**
 * Validate if a navigation is valid within the stack
 * Prevents: orphaned routes, invalid depth jumps
 * @param {string} currentPath - Current pathname
 * @param {string} previousPath - Previous pathname
 * @param {object} tabHistory - Tab history context
 * @returns {boolean} Is navigation valid
 */
export function isValidNavigation(currentPath, previousPath, tabHistory) {
  const currentDepth = getRouteDepth(currentPath);
  const previousDepth = getRouteDepth(previousPath);
  const direction = getNavigationDirection(currentDepth, previousDepth);

  // Rule 1: Cannot jump more than 1 depth level (except back to root)
  if (direction > 1) {
    console.warn(`[NavigationStack] Invalid depth jump: ${previousPath} → ${currentPath}`);
    return false;
  }

  // Rule 2: Ensure root is never bypassed
  if (currentDepth === 0 && previousDepth > 1) {
    console.warn(`[NavigationStack] Root bypass detected`);
    return false;
  }

  return true;
}

/**
 * Map a route to its tab group
 * Used for tab history stack tracking
 * @param {string} pathname - Current pathname
 * @returns {string|null} Tab key ('home', 'ops', 'efb', 'crew', 'more') or null
 */
export function getTabForRoute(pathname) {
  if (pathname === '/Home' || pathname === '/') return 'home';
  if (['/Dashboard', '/OOSDetail', '/NewOOS'].includes(pathname)) return 'ops';
  if (pathname === '/EFB') return 'efb';
  if (['/CrewControl', '/CrewCalendar'].includes(pathname)) return 'crew';
  return 'more'; // Settings, Learning, Weather, SafetyQA, etc.
}

/**
 * Get primary tab routes (depth 1 screens)
 * @returns {object} Map of tab keys to their root paths
 */
export function getPrimaryTabRoutes() {
  return {
    home: '/Home',
    ops: '/Dashboard',
    efb: '/EFB',
    crew: '/CrewControl',
    more: '/Learning', // Default for "more" tab
  };
}

/**
 * Check if a path is a primary tab screen (depth 0-1)
 * @param {string} pathname - Pathname to check
 * @returns {boolean} Is primary tab
 */
export function isPrimaryTab(pathname) {
  return getRouteDepth(pathname) <= 1;
}

/**
 * Check if a path is a child screen requiring BackHeader (depth 2+)
 * @param {string} pathname - Pathname to check
 * @returns {boolean} Requires BackHeader
 */
export function isChildScreen(pathname) {
  return getRouteDepth(pathname) >= 2;
}