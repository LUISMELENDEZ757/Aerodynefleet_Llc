import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LeftRail from './LeftRail';
import BottomTabBar from './BottomTabBar';
import MobileLeftRail from './MobileLeftRail';

import WifiIndicator from './WifiIndicator';
import StarlinkIndicator from './StarlinkIndicator';
import NotificationsBell from './NotificationsBell';
import { TabHistoryProvider, useTabHistory } from '@/lib/TabHistoryContext';
import PageTransition from '@/components/ui/PageTransition';
import SupportButton from './SupportButton';
import LocalModeToggle from './LocalModeToggle';
import { base44 } from '@/api/base44Client';
import { LogOut, Clock, Menu, X } from 'lucide-react';

// Syncs location changes into TabHistoryContext so lastPaths stays accurate
function LocationSync() {
  const location = useLocation();
  const { recordPath } = useTabHistory();
  useEffect(() => {
    recordPath(location.pathname);
  }, [location.pathname]);
  return null;
}

// Detect device class
function useDeviceClass() {
  const [device, setDevice] = useState(() => {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) setDevice('mobile');
      else if (w < 1024) setDevice('tablet');
      else setDevice('desktop');
    };
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);
  return device;
}

function AppContent() {
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const lastScrollY = useRef(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [zuluTime, setZuluTime] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const location = useLocation();
  const device = useDeviceClass();

  // Auto-collapse rail on tablet, auto-expand on desktop
  useEffect(() => {
    if (device === 'tablet') setRailCollapsed(true);
    else if (device === 'desktop') setRailCollapsed(false);
  }, [device]);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const exitDemoMode = () => {
    localStorage.removeItem('demoMode');
    setIsDemoMode(false);
    window.location.reload();
  };

  useEffect(() => {
    setIsDemoMode(localStorage.getItem('demoMode') === 'true');
    base44.auth.me().then(user => {
      if (user) {
        setUserInfo({
          name: user.full_name || user.email?.split('@')[0] || 'User',
          role: user.role || 'user',
          initials: (user.full_name || user.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        });
      }
    }).catch(() => {});
    const tick = () => {
      const now = new Date();
      setZuluTime(`${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}Z`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const roleColor = userInfo?.role === 'admin' ? 'text-primary' : 'text-blue-400';
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const isDesktop = device === 'desktop';

  // Rail margin: mobile=0, tablet=collapsed(48px), desktop=full(208px) or collapsed(48px)
  const mainMargin = isMobile ? 'ml-0' : railCollapsed ? 'ml-12' : 'ml-52';

  return (
    <div className="min-h-screen bg-background flex">
      <LocationSync />

      {/* ── Left Rail — hidden on mobile, always shown on tablet/desktop ── */}
      {!isMobile && (
        <LeftRail onCollapsedChange={setRailCollapsed} />
      )}

      {/* ── Mobile slide-out drawer ── */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {mobileDrawerOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
          )}
          {/* Drawer — always mounted, slide in/out via transform */}
          <div className={`fixed left-0 top-0 bottom-0 z-50 w-56 bg-sidebar border-r border-border shadow-2xl overflow-y-auto transition-transform duration-300 ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Close button */}
            <div className="flex justify-end px-3 pt-3 pb-1">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <MobileLeftRail onNavigate={() => setMobileDrawerOpen(false)} />
          </div>
        </>
      )}

      <div className={`flex-1 min-h-screen transition-all duration-300 ${mainMargin}`}>
        {/* ── Top header bar ── */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-3 h-11 flex items-center justify-between gap-2">
          
          {/* Mobile: hamburger menu button */}
          {isMobile && (
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/60 border border-border text-muted-foreground hover:text-white transition-colors flex-shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Brand — hide long subtitle on mobile */}
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black text-primary tracking-widest uppercase">Aerodyne Fleet</span>
            {!isMobile && (
              <span className="text-[9px] text-muted-foreground tracking-widest uppercase">Aircraft Maintenance Management System</span>
            )}
          </div>

          {/* Right: indicators */}
          <div className="flex items-center gap-1.5 ml-auto">
            {isDemoMode && (
              <button onClick={exitDemoMode}
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors">
                DEMO
              </button>
            )}

            {/* Zulu clock — hide label on mobile */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 border border-border">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] font-mono font-semibold text-foreground tabular-nums">{zuluTime}</span>
            </div>

            {/* Hide some indicators on mobile to keep header clean */}
            {!isMobile && <LocalModeToggle />}
            <WifiIndicator />
            {!isMobile && <StarlinkIndicator />}
            <NotificationsBell />
            {!isMobile && <SupportButton />}

            {/* User avatar */}
            {userInfo && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-border">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-black text-primary">{userInfo.initials}</span>
                </div>
                {isDesktop && (
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] font-semibold text-foreground truncate max-w-[80px]">{userInfo.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${roleColor}`}>{userInfo.role}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => base44.auth.logout('/')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/12 text-destructive hover:bg-destructive/20 transition-colors text-[11px] font-semibold"
              title="Sign out"
            >
              <LogOut className="w-3 h-3" />
              {!isMobile && <span>Sign Out</span>}
            </button>
          </div>
        </div>

        {/* ── Page content ── */}
        <main className={isMobile ? 'pb-20' : 'pb-safe-bottom'}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* ── Bottom tab bar — mobile only ── */}
      {isMobile && <BottomTabBar />}
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