/**
 * RoleGuard — Role-Based Access Control
 *
 * Usage:
 *   <RoleGuard roles={['admin','mcc_supervisor']}>
 *     <SensitiveComponent />
 *   </RoleGuard>
 *
 *   <RoleGuard roles={['technician','inspector_rii']} fallback={<p>No access</p>}>
 *     <WorkOrderPanel />
 *   </RoleGuard>
 *
 * Hook:
 *   const { hasRole, userRole } = useRBAC();
 */
import { useAuth } from '@/lib/AuthContext';
import { ShieldOff } from 'lucide-react';

// Role hierarchy — higher index = more access
export const ROLE_HIERARCHY = [
  'viewer',
  'crew',
  'flight_attendant',
  'technician',
  'inspector_rii',
  'dispatcher',
  'engineer',
  'mcc_supervisor',
  'admin',
];

export const ROLE_LABELS = {
  admin:           { label: 'Administrator',       color: 'text-red-400',    bg: 'bg-red-500/20' },
  mcc_supervisor:  { label: 'MCC Supervisor',      color: 'text-orange-400', bg: 'bg-orange-500/20' },
  dispatcher:      { label: 'Dispatcher',          color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  engineer:        { label: 'Engineer',            color: 'text-purple-400', bg: 'bg-purple-500/20' },
  inspector_rii:   { label: 'RII Inspector',       color: 'text-amber-400',  bg: 'bg-amber-500/20' },
  technician:      { label: 'A&P Technician',      color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
  crew:            { label: 'Flight Crew',         color: 'text-green-400',  bg: 'bg-green-500/20' },
  flight_attendant:{ label: 'Flight Attendant',    color: 'text-teal-400',   bg: 'bg-teal-500/20' },
  viewer:          { label: 'Read-Only Viewer',    color: 'text-gray-400',   bg: 'bg-gray-500/20' },
};

export function useRBAC() {
  const { user } = useAuth();
  const userRole = user?.role || 'viewer';

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (allowedRoles.includes(userRole)) return true;
    // Admin always has access
    if (userRole === 'admin') return true;
    return false;
  };

  const hasMinRole = (minRole) => {
    const userIdx = ROLE_HIERARCHY.indexOf(userRole);
    const minIdx = ROLE_HIERARCHY.indexOf(minRole);
    return userIdx >= minIdx;
  };

  return { hasRole, hasMinRole, userRole, user };
}

export default function RoleGuard({ roles, minRole, children, fallback }) {
  const { hasRole, hasMinRole } = useRBAC();

  const allowed = minRole ? hasMinRole(minRole) : hasRole(roles);

  if (!allowed) {
    return fallback || (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldOff className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-base font-extrabold text-foreground">Access Restricted</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your role does not have permission to view this section.
          Contact your administrator.
        </p>
      </div>
    );
  }

  return children;
}