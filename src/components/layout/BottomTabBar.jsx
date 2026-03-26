import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Plane, BookOpen, Zap, MoreHorizontal, X,
  Users, Radio, CalendarDays, Globe, Shield, Cloud, GraduationCap, Settings,
  AlertTriangle, Fuel, BarChart3, FileText, LayoutDashboard,
  Weight, Navigation2, DollarSign, CalendarCheck, Wrench, BookMarked
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
  { icon: GraduationCap,  label: 'Learning',      path: '/Learning' },
  { icon: LayoutDashboard, label: 'OPS Center',   path: '/OpsCenter' },
  { icon: AlertTriangle, label: 'IROPS',          path: '/IROPS' },
  { icon: Fuel,          label: 'Fuel Mgmt',      path: '/Fuel' },
  { icon: BarChart3,     label: 'Analytics',      path: '/Analytics' },
  { icon: FileText,      label: 'Audit Log',      path: '/AuditLog' },
  { icon: Settings,      label: 'Settings',       path: '/Settings' },
  { icon: Weight,        label: 'Load Control',   path: '/LoadControl' },
  { icon: Navigation2,   label: 'Flight Plans',   path: '/FlightPlanner' },
  { icon: DollarSign,    label: 'Delay Costs',    path: '/DelayCost' },
  { icon: CalendarCheck, label: 'Crew Bidding',   path: '/CrewBidding' },
  { icon: Wrench,        label: 'MEL',            path: '/MEL' },
  { icon: BookMarked,    label: 'Documents',      path: '/Documents' },
  { icon: GraduationCap, label: 'Training',       path: '/Training' },
  { icon: Fuel,          label: 'Fuel Contracts', path: '/FuelContracts' },
  { icon: Users,         label: 'PAX Reaccom',    path: '/PaxReaccom' },
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


    </>
  );
}