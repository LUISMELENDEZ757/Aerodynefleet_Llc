import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="pb-20">
        <Outlet />
      </main>
    </div>
  );
}