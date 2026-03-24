import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Plane, BookOpen, Zap, MoreHorizontal, X,
  Users, Radio, CalendarDays, Globe, Shield, Cloud, GraduationCap, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTabHistory, TAB_ROOTS } from '@/lib/TabHistoryContext';
import { AnimatePresence, motion } from 'framer-motion';

const PRIMARY_TABS = [
  { key: 'home', icon: Home,           label: 'Home',  path: '/Home' },
  { key: 'ops',  icon: Plane,          label: 'Ops',   path: '/Dashboard' },
  { key: 'efb',  icon: BookOpen,       label: 'EFB',   path: '/EFB' },
  { key: 'crew', icon: Zap,            label: 'Crew',  path: '/CrewControl' },
  { key: 'more', icon: MoreHorizontal, label: 'More',  path: null },
];

const MORE_ITEMS = [
  { icon: Users,         label: 'Cabin Crew',    path: '/FlightAttendant' },
  { icon: Radio,         label: 'Flight Crew',   path: '/FlightCrew' },
  { icon: CalendarDays,  label: 'Crew Calendar', path: '/CrewCalendar' },
  { icon: CalendarDays,  label: 'Scheduling',    path: '/Scheduling' },
  { icon: Globe,         label: 'World Clock',   path: '/WorldClock' },
  { icon: Shield,        label: 'Safety & QA',   path: '/SafetyQA' },
  { icon: Cloud,         label: 'Weather',       path: '/Weather' },
  { icon: GraduationCap, label: 'Learning',      path: '/Learning' },
  { icon: Settings,      label: 'Settings',      path: '/Settings' },
];

const MORE_PATHS = new Set(MORE_ITEMS.map(i => i.path));

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTab, navigateToTab } = useTabHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const isMoreActive = MORE_PATHS.has(location.pathname);

  const handleTabPress = (tabKey, path) => {
    if (tabKey === 'more') {
      setDrawerOpen(v => !v);
      return;
    }
    setDrawerOpen(false);
    navigateToTab(tabKey);
  };

  return (
    <>
      {/* ── BOTTOM TAB BAR ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/96 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-14">
          {PRIMARY_TABS.map(({ key, icon: Icon, label, path }) => {
            const isMore = key === 'more';
            const isActive = isMore
              ? isMoreActive || drawerOpen
              : activeTab === key;

            return (
              <button
                key={key}
                onClick={() => handleTabPress(key, path)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/* Active pill indicator */}
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── MORE DRAWER ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-9 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Plane className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">All Modules</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid */}
              <div className="p-3 grid grid-cols-3 gap-2 max-h-[58vh] overflow-y-auto">
                {MORE_ITEMS.map(({ icon: Icon, label, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <button
                      key={path}
                      onClick={() => { navigate(path); setDrawerOpen(false); }}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl transition-all text-center',
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary/50 text-muted-foreground active:bg-secondary'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                      <span className="text-[11px] font-semibold leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}