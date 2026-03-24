import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeftRail from './LeftRail';
import BottomTabBar from './BottomTabBar';
import OpsAlertsPanel from './OpsAlertsPanel';
import { RailProvider, useRail } from '@/lib/RailContext';
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
  const { expanded } = useRail();
  return (
    <div className="min-h-screen bg-background flex">
      <LocationSync />
      <LeftRail />
      <div className={`flex-1 min-h-screen transition-all duration-300 ${expanded ? 'lg:ml-44' : 'lg:ml-16'}`}>
        <main className="pb-safe-bottom">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <BottomTabBar />
      {/* Global alerts bell — fixed top-right */}
      <div className="fixed top-3 right-72 z-[60]" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <OpsAlertsPanel />
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <RailProvider>
      <TabHistoryProvider>
        <AppContent />
      </TabHistoryProvider>
    </RailProvider>
  );
}