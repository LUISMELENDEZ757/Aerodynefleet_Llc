import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Home, Users, Settings, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home,  label: 'Home',        path: '/Home' },
  { icon: Plane, label: 'Flight Ops',  path: '/Dashboard' },
  { icon: Users, label: 'Cabin Crew',  path: '/FlightAttendant' },
  { icon: Radio, label: 'Flight Crew', path: '/FlightCrew' },
];

export default function LeftRail() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'fixed left-0 top-0 h-full bg-card border-r border-border flex flex-col items-start py-4 z-50 transition-all duration-300 overflow-hidden',
        expanded ? 'w-44' : 'w-16'
      )}
    >
      {/* Logo */}
      <Link to="/Dashboard" className="mb-6 flex items-center gap-3 px-3.5">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Plane className="w-5 h-5 text-primary" />
        </div>
        {expanded && (
          <span className="text-sm font-bold tracking-wide text-primary whitespace-nowrap">
            FLIGHT OPS
          </span>
        )}
      </Link>

      {/* Divider */}
      <div className="w-full px-3.5 mb-4">
        <div className="h-px bg-border" />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1 w-full px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'relative flex items-center gap-3 px-2.5 h-11 rounded-xl transition-all',
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col w-full px-2">
        <div className="h-px bg-border mb-3 mx-1.5" />
        <Link
          to="/Home"
          className="flex items-center gap-3 px-2.5 h-11 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {expanded && (
            <span className="text-sm font-medium whitespace-nowrap">Settings</span>
          )}
        </Link>
      </div>
    </aside>
  );
}