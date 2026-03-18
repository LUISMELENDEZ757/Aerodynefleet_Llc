import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftRail from './LeftRail';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <LeftRail />
      <div className="flex-1 ml-16 min-h-screen transition-all duration-300">
        <main className="pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}