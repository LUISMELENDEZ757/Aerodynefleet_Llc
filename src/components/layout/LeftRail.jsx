import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plane, Home, Users, Settings, Radio, BookOpen,
  CalendarDays, Zap, Globe, Shield, Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRail } from '@/lib/RailContext';

const NAV_ITEMS = [
  { icon: Home,          label: 'Home',          path: '/Home' },
  { icon: Plane,         label: 'Flight Ops',    path: '/Dashboard' },
  { icon: Users,         label: 'Cabin Crew',    path: '/FlightAttendant' },
  { icon: Radio,         label: 'Flight Crew',   path: '/FlightCrew' },
  { icon: BookOpen,      label: 'EFB',           path: '/EFB' },
  { icon: CalendarDays,  label: 'Crew Calendar', path: '/CrewCalendar' },
  { icon: Zap,           label: 'Crew Control',  path: '/CrewControl' },
  { icon: Globe,         label: 'World Clock',   path: '/WorldClock' },
  { icon: Shield,        label: 'Safety & QA',   path: '/SafetyQA' },
  { icon: CalendarDays,  label: 'Scheduling',    path: '/Scheduling' },
  { icon: Cloud,         label: 'Weather',       path: '/Weather' },
  { icon: BookOpen,      label: 'Learning',      path: '/Learning' },
];

export default function LeftRail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { expanded, toggle, setExpanded } = useRail();

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/Home') {
      toggle();
    } else {
      navigate('/Home');
      setExpanded(true);
      try { localStorage.setItem('rail_expanded', 'true'); } catch {}
    }
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex fixed left-0 top-0 h-full bg-card border-r border-border flex-col items-start py-4 z-50 transition-all duration-300 overflow-hidden',
        expanded ? 'w-44' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="mb-4 flex items-center justify-center w-full px-3.5">
        <Link
          to="/Dashboard"
          aria-label="Go to Flight Ops Dashboard"
          className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors"
        >
          <Plane className="w-5 h-5 text-primary" />
        </Link>
      </div>

      <div className="w-full px-3.5 mb-4">
        <div className="h-px bg-border" />
      </div>

      <nav className="flex flex-col gap-1 flex-1 w-full px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isHome = path === '/Home';
          const sharedClass = cn(
            'relative flex items-center gap-3 px-2.5 h-10 rounded-xl transition-all flex-shrink-0 w-full',
            isActive
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          );
          const inner = (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              )}
            </>
          );
          return isHome ? (
            <button key={path} onClick={handleHomeClick} className={sharedClass}>
              {inner}
            </button>
          ) : (
            <Link key={path} to={path} className={sharedClass}>
              {inner}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col w-full px-2">
        <div className="h-px bg-border mb-3 mx-1.5" />
        <Link
          to="/Settings"
          className={cn(
            'flex items-center gap-3 px-2.5 rounded-xl transition-all w-full min-h-[44px]',
            location.pathname === '/Settings'
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
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