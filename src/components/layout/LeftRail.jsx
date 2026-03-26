import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'HOME', path: '/Home' },
  { label: 'AOCS', path: '/AocsDashboard' },
  { label: 'FLIGHT OPS', path: '/Dashboard' },
  { label: 'TECH OPS', path: '/OOSDashboard' },
  { label: 'DISPATCH', path: '/Dispatch' },
  { label: 'CABIN CREW', path: '/FlightAttendant' },
  { label: 'FLIGHT CREW', path: '/FlightCrew' },
  { label: 'EFB', path: '/EFB' },
  { label: 'CREW CONTROL', path: '/CrewControl' },
  { label: 'WEATHER', path: '/Weather' },
  { label: 'IROPS', path: '/IROPS' },
  { label: 'FUEL MGMT', path: '/Fuel' },
  { label: 'LOAD CONTROL', path: '/LoadControl' },
  { label: 'FLIGHT PLANNER', path: '/FlightPlanner' },
  { label: 'SAFETY & QA', path: '/SafetyQA' },
  { label: 'ANALYTICS', path: '/Analytics' },
  { label: 'FLEET DASHBOARD', path: '/FleetDashboard' },
  { label: 'E-LOGBOOK', path: '/TechOpsLogbook' },
  { label: 'MEL', path: '/MEL' },
  { label: 'MCC', path: '/MaintenanceControl' },
  { label: 'OOS', path: '/OOSDashboard' },
  { label: 'TOOLING', path: '/ToolingManagement' },
  { label: 'TRAINING', path: '/Training' },
  { label: 'DOCUMENTS', path: '/Documents' },
  { label: 'COMM CENTER', path: '/CommCenter' },
  { label: 'STARLINK', path: '/Starlink' },
  { label: 'SETTINGS', path: '/Settings' },
];

export default function LeftRail() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-48 glass-strong border-r border-border flex flex-col py-4 z-50 liquid-glow">
      <nav className="flex flex-col gap-1 flex-1 w-full px-3 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'relative group flex items-center h-10 px-3 rounded-xl transition-all text-xs font-extrabold tracking-wide whitespace-nowrap',
                isActive
                  ? 'bg-primary/30 text-primary border border-primary/30'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}