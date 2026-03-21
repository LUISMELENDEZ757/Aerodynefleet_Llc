import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plane, BookOpen, Zap, MoreHorizontal, X, Users, Radio, CalendarDays, Globe, Shield, Cloud, GraduationCap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_TABS = [
  { icon: Home,           label: 'Home',   path: '/Home' },
  { icon: Plane,          label: 'Ops',    path: '/Dashboard' },
  { icon: BookOpen,       label: 'EFB',    path: '/EFB' },
  { icon: Zap,            label: 'Crew',   path: '/CrewControl' },
  { icon: MoreHorizontal, label: 'More',   path: null },
];

const MORE_ITEMS = [
  { icon: Users,        label: 'Cabin Crew',    path: '/FlightAttendant' },
  { icon: Radio,        label: 'Flight Crew',   path: '/FlightCrew' },
  { icon: CalendarDays, label: 'Crew Calendar', path: '/CrewCalendar' },
  { icon: Zap,          label: 'Crew Control',  path: '/CrewControl' },
  { icon: CalendarDays, label: 'Scheduling',    path: '/Scheduling' },
  { icon: Globe,        label: 'World Clock',   path: '/WorldClock' },
  { icon: Shield,       label: 'Safety & QA',   path: '/SafetyQA' },
  { icon: Cloud,        label: 'Weather',       path: '/Weather' },
  { icon: GraduationCap,label: 'Training',      path: '/Training' },
  { icon: Settings,     label: 'Settings',      path: '/Settings' },
];

export default function BottomTabBar() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some(i => i.path === location.pathname);

  return (
    <>
      {/* ── BOTTOM TAB BAR ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch">
          {PRIMARY_TABS.map(({ icon: Icon, label, path }) => {
            const isActive = path ? location.pathname === path : isMoreActive || drawerOpen;
            const isMore = path === null;

            return isMore ? (
              <button
                key={label}
                onClick={() => setDrawerOpen(v => !v)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 min-h-[56px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </button>
            ) : (
              <Link
                key={label}
                to={path}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 min-h-[56px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/* Active indicator dot */}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── MORE DRAWER (sheet from bottom) ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Plane className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground tracking-wide">All Modules</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of nav items */}
            <div className="p-3 grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
              {MORE_ITEMS.map(({ icon: Icon, label, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all text-center',
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[11px] font-semibold leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}