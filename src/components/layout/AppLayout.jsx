import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftRail from './LeftRail';
import BottomTabBar from './BottomTabBar';
import { RailProvider, useRail } from '@/lib/RailContext';
import PageTransition from '@/components/ui/PageTransition';

function AppContent() {
  const { expanded } = useRail();
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop side rail */}
      <LeftRail />

      {/* Page content */}
      <div className={`flex-1 min-h-screen transition-all duration-300 ${expanded ? 'lg:ml-44' : 'lg:ml-16'}`}>
        <main className="pb-safe-bottom">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}

export default function AppLayout() {
  return (
    <RailProvider>
      <AppContent />
    </RailProvider>
  );
}