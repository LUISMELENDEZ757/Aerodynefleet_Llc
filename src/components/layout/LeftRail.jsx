import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Home, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/Dashboard' },
  { icon: Plus, label: 'New OOS', path: '/NewOOS' },
];

export default function LeftRail() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-card border-r border-border flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <Link to="/Dashboard" className="mb-6 flex flex-col items-center">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Plane className="w-5 h-5 text-primary" />
        </div>
      </Link>

      {/* Divider */}
      <div className="w-8 h-px bg-border mb-4" />

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              title={label}
              className={cn(
                'group relative flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all',
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              {/* Tooltip */}
              <span className="absolute left-14 bg-popover text-popover-foreground text-xs font-medium px-2 py-1 rounded-md border border-border shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-px bg-border mb-3" />
        <Link
          to="/Dashboard"
          title="Settings"
          className="flex flex-col items-center justify-center w-11 h-11 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all group relative"
        >
          <Settings className="w-5 h-5" />
          <span className="absolute left-14 bg-popover text-popover-foreground text-xs font-medium px-2 py-1 rounded-md border border-border shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}