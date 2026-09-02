// Flattens the Left Rail navigation into a "Windows app" list the Start menu
// and taskbar use. Single source of truth: NAV_GROUPS in the Left Rail.
import { NAV_GROUPS } from '@/components/layout/LeftRail';

export const WIN_APPS = NAV_GROUPS.flatMap((g) =>
  (g.items || []).map((i) => ({
    label: i.label,
    icon: i.icon,
    path: i.path,
    group: g.title || 'Core',
  }))
);

// Resolves the active module for the current route (longest matching path wins).
export function getActiveApp(pathname) {
  let best = null;
  let bestLen = -1;
  for (const a of WIN_APPS) {
    const exact = a.path === '/';
    const match = exact
      ? pathname === '/' || pathname === '/Home' || pathname === '/Landing'
      : pathname === a.path || pathname.startsWith(a.path + '/');
    if (match && a.path.length > bestLen) {
      best = a;
      bestLen = a.path.length;
    }
  }
  return best;
}