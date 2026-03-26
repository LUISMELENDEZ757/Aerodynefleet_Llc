import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeftRail from './LeftRail';
import BottomTabBar from './BottomTabBar';
import OpsAlertsPanel from './OpsAlertsPanel';
import StarlinkIndicator from './StarlinkIndicator';
import WifiIndicator from './WifiIndicator';
import { TabHistoryProvider, useTabHistory } from '@/lib/TabHistoryContext';
import PageTransition from '@/components/ui/PageTransition';

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
      <LeftRail />
      <div className="flex-1 min-h-screen ml-48">
        <main className="pb-safe-bottom">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <BottomTabBar />
      {/* Global indicators — fixed top-center, hide on scroll down */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 transition-transform duration-300"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          transform: hidden ? `translateX(-50%) translateY(calc(-100% - 20px))` : 'translateX(-50%) translateY(0)',
        }}
      >
        <WifiIndicator />
        <StarlinkIndicator />
        <OpsAlertsPanel />
      </div>
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