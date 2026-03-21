import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Plane, Home, Users, Settings, Radio, BookOpen,
  CalendarDays, Zap, Globe, Shield, X, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home,         label: 'Home',           path: '/Home' },
  { icon: Plane,        label: 'Flight Ops',     path: '/Dashboard' },
  { icon: Users,        label: 'Cabin Crew',     path: '/FlightAttendant' },
  { icon: Radio,        label: 'Flight Crew',    path: '/FlightCrew' },
  { icon: BookOpen,     label: 'EFB',            path: '/EFB' },
  { icon: CalendarDays, label: 'Crew Calendar',  path: '/CrewCalendar' },
  { icon: Zap,          label: 'Crew Control',   path: '/CrewControl' },
  { icon: Globe,        label: 'World Clock',    path: '/WorldClock' },
  { icon: Shield,       label: 'Safety & QA',    path: '/SafetyQA' },
  { icon: CalendarDays, label: 'Scheduling',     path: '/Scheduling' },
];

// Bottom 5 items shown in mobile tab bar
const MOBILE_TAB_ITEMS = [
  { icon: Home,     label: 'Home',       path: '/Home' },
  { icon: Plane,    label: 'Ops',        path: '/Dashboard' },
  { icon: BookOpen, label: 'EFB',        path: '/EFB' },
  { icon: Zap,      label: 'Crew',       path: '/CrewControl' },
  { icon: Menu,     label: 'More',       path: null }, // opens drawer
];

export default function LeftRail() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem('rail_expanded') === 'true'; } catch { return false; }
  });

  const toggleExpanded = () => {
    setExpanded(e => {
      const next = !e;
      try { localStorage.setItem('rail_expanded', next); } catch {}
      return next;
    });
  };
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <>
      {/* ─── DESKTOP SIDE RAIL ─── */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 h-full bg-card border-r border-border flex-col items-start py-4 z-50 transition-all duration-300 overflow-hidden',
          expanded ? 'w-44' : 'w-16'
        )}
      >
        {/* Logo / expand toggle */}
        <div className="mb-6 flex items-center gap-3 px-3.5 w-full">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors"
          >
            <Plane className="w-5 h-5 text-primary" />
          </button>
          {expanded && (
            <button onClick={() => setExpanded(e => !e)} className="text-sm font-bold tracking-wide text-primary whitespace-nowrap">
              FLIGHT OPS
            </button>
          )}
        </div>

        <div className="w-full px-3.5 mb-4">
          <div className="h-px bg-border" />
        </div>

        <nav className="flex flex-col gap-1 flex-1 w-full px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'relative flex items-center gap-3 px-2.5 h-10 rounded-xl transition-all flex-shrink-0',
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

        <div className="flex flex-col w-full px-2">
          <div className="h-px bg-border mb-3 mx-1.5" />
          <Link
            to="/Home"
            className="flex items-center gap-3 px-2.5 h-10 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {expanded && (
              <span className="text-sm font-medium whitespace-nowrap">Settings</span>
            )}
          </Link>
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM TAB BAR ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch">
        {MOBILE_TAB_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = path && location.pathname === path;
          const isMore = path === null;
          if (isMore) {
            return (
              <button
                key={label}
                onClick={() => setMobileDrawerOpen(true)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors',
                  mobileDrawerOpen ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            );
          }
          return (
            <Link
              key={label}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ─── MOBILE FULL DRAWER ─── */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Sheet from bottom */}
          <div className="relative mt-auto bg-card rounded-t-2xl border-t border-border pb-safe overflow-y-auto max-h-[85vh]">
            {/* Handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <Link
                to="/Home"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Plane className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-primary tracking-wide">FLIGHT OPS</span>
              </Link>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="p-3 grid grid-cols-2 gap-2">
              {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}