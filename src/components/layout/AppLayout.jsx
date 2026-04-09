import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeftRail from './LeftRail';
import BottomTabBar from './BottomTabBar';
import WifiIndicator from './WifiIndicator';
import StarlinkIndicator from './StarlinkIndicator';
import NotificationsBell from './NotificationsBell';
import { TabHistoryProvider, useTabHistory } from '@/lib/TabHistoryContext';
import PageTransition from '@/components/ui/PageTransition';
import SupportButton from './SupportButton';

// Syncs location changes into TabHistoryContext so lastPaths stays accurate
function LocationSync() {
  const location = useLocation();
  const { recordPath } = useTabHistory();
  useEffect(() => {
    recordPath(location.pathname);
  }, [location.pathname]);
  return null;
}

function AppContent() {
  const [hidden, setHidden] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const handleScroll = () => {
      const currentY = root.scrollTop;
      setHidden(currentY > lastScrollY.current && currentY > 60);
      lastScrollY.current = currentY;
    };
    root.addEventListener('scroll', handleScroll, { passive: true });
    return () => root.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <LocationSync />
      <LeftRail onCollapsedChange={setRailCollapsed} />
      <div className={`flex-1 min-h-screen transition-all duration-300 ${railCollapsed ? 'ml-12' : 'ml-48'}`}>
        {/* Top indicators bar */}
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 h-12 flex items-center justify-between gap-2">
          <div className="flex flex-col leading-none">
            <span className="text-xs font-extrabold text-primary tracking-widest uppercase">Aerodyne Fleet LLC</span>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">Aircraft Maintenance Management System</span>
          </div>
          <WifiIndicator />
          <StarlinkIndicator />
          <NotificationsBell />
          <SupportButton />
        </div>
        <main className="pb-safe-bottom">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}

export default function AppLayout() {
  return (
    <TabHistoryProvider>
      <AppContent />
    </TabHistoryProvider>
  );
}