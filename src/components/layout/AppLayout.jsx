import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeftRail from './LeftRail';

import WifiIndicator from './WifiIndicator';
import StarlinkIndicator from './StarlinkIndicator';
import NotificationsBell from './NotificationsBell';
import { TabHistoryProvider, useTabHistory } from '@/lib/TabHistoryContext';
import PageTransition from '@/components/ui/PageTransition';
import SupportButton from './SupportButton';
import LocalModeToggle from './LocalModeToggle';
import { signOut, getSession } from '@/lib/supabaseAuth';
import { LogOut, Clock } from 'lucide-react';

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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [zuluTime, setZuluTime] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const exitDemoMode = () => {
    localStorage.removeItem('demoMode');
    setIsDemoMode(false);
    window.location.reload();
  };

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demoMode') === 'true');
    // Get user info from session
    const session = getSession();
    if (session?.user) {
      const meta = session.user.user_metadata || {};
      setUserInfo({
        name: meta.full_name || session.user.email?.split('@')[0] || 'User',
        role: meta.role || session.user.app_metadata?.role || 'user',
        initials: (meta.full_name || session.user.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      });
    }
    // Zulu clock
    const tick = () => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      setZuluTime(`${hh}:${mm}Z`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

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

  const roleColor = userInfo?.role === 'admin' ? 'text-primary' : 'text-blue-400';
  const roleBg = userInfo?.role === 'admin' ? 'bg-primary/15' : 'bg-blue-500/15';

  return (
    <div className="min-h-screen bg-background flex">
      <LocationSync />
      <LeftRail onCollapsedChange={setRailCollapsed} />
      <div className={`flex-1 min-h-screen transition-all duration-300 ${railCollapsed ? 'ml-12' : 'ml-52'}`}>
        {/* Top header bar */}
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 h-11 flex items-center justify-between gap-3">
          {/* Left: brand */}
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black text-primary tracking-widest uppercase">Aerodyne Fleet LLC</span>
            <span className="text-[9px] text-muted-foreground tracking-widest uppercase">Aircraft Maintenance Management System</span>
          </div>

          {/* Right: indicators */}
          <div className="flex items-center gap-2 ml-auto">
            {isDemoMode && (
              <button onClick={exitDemoMode}
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors">
                DEMO
              </button>
            )}

            {/* Zulu clock */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 border border-border">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] font-mono font-semibold text-foreground tabular-nums">{zuluTime}</span>
            </div>

            <LocalModeToggle />
            <WifiIndicator />
            <StarlinkIndicator />
            <NotificationsBell />
            <SupportButton />

            {/* User avatar + role */}
            {userInfo && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[9px] font-black text-primary">{userInfo.initials}</span>
                </div>
                <div className="hidden md:flex flex-col leading-none">
                  <span className="text-[10px] font-semibold text-foreground truncate max-w-[80px]">{userInfo.name}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${roleColor}`}>{userInfo.role}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => signOut().then(() => window.location.href = '/')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/12 text-destructive hover:bg-destructive/20 transition-colors text-[11px] font-semibold"
              title="Sign out"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
        <main className="pb-safe-bottom">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
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