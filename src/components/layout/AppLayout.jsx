import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftRail from './LeftRail';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <LeftRail />
      {/* Desktop: offset for side rail. Mobile: no left margin, bottom padding for tab bar */}
      <div className="flex-1 lg:ml-16 min-h-screen transition-all duration-300">
        <main className="pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}