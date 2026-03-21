import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftRail from './LeftRail';
import { RailProvider, useRail } from '@/lib/RailContext';

function AppContent() {
  const { expanded } = useRail();
  return (
    <div className="min-h-screen bg-background flex">
      <LeftRail />
      <div className={`flex-1 min-h-screen transition-all duration-300 ${expanded ? 'lg:ml-44' : 'lg:ml-16'}`}>
        <main className="pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
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