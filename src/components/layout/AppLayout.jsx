import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeftRail from './LeftRail';
import BottomTabBar from './BottomTabBar';
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