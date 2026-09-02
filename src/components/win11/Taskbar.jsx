import { useState, useEffect } from 'react';
import { Search, Power, Plane, Maximize2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WifiIndicator from '@/components/layout/WifiIndicator';
import StarlinkIndicator from '@/components/layout/StarlinkIndicator';
import NotificationsBell from '@/components/layout/NotificationsBell';
import LocalModeToggle from '@/components/layout/LocalModeToggle';
import SupportButton from '@/components/layout/SupportButton';

// Windows 11 taskbar — Start button anchored bottom-left, open-window pills in
// the center-left, system tray on the right.
export default function Taskbar({
  startOpen,
  onStartToggle,
  windows,
  focusedId,
  onPillClick,
  userInfo,
  zuluTime,
  isDemoMode,
  exitDemoMode,
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  // Browser full-screen tracking + toggle (entire OS shell goes full screen).
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== 'undefined' && !!document.fullscreenElement
  );
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-12 flex items-center gap-1 px-2 bg-[#1c1c1f]/85 backdrop-blur-2xl border-t border-white/10">
      {/* Start button — bottom LEFT */}
      <button
        onClick={onStartToggle}
        className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
          startOpen ? 'bg-white/15' : 'hover:bg-white/10'
        }`}
        title="Start"
        aria-label="Start"
      >
        <Plane className="text-primary" size={18} />
      </button>

      {/* Search pill */}
      <button
        onClick={onStartToggle}
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md bg-white/8 border border-white/10 text-muted-foreground text-xs hover:bg-white/12 transition-colors"
      >
        <Search className="w-3.5 h-3.5" /> Search apps…
      </button>

      {/* Open windows */}
      <div className="flex items-center gap-1 ml-1">
        {windows.map((w) => {
          const isActive = w.id === focusedId && !w.minimized;
          return (
            <button
              key={w.id}
              onClick={() => onPillClick(w)}
              className={`relative flex items-center gap-2 h-9 px-2.5 rounded-md transition-colors ${
                isActive ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
              title={w.label}
            >
              <span className="text-sm leading-none">{w.icon}</span>
              <span className="text-xs font-medium text-foreground/90 hidden md:block">
                {w.label}
              </span>
              <span
                className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all ${
                  isActive ? 'w-4 bg-primary' : w.minimized ? 'w-2 bg-muted-foreground/60' : 'w-2 bg-primary/60'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* System tray */}
      <div className="ml-auto flex items-center gap-1">
        {isDemoMode && (
          <button
            onClick={exitDemoMode}
            className="text-[9px] font-extrabold px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
          >
            DEMO
          </button>
        )}
        <LocalModeToggle />
        <WifiIndicator />
        <StarlinkIndicator />
        <NotificationsBell />
        <SupportButton />

        {/* Full-screen toggle */}
        <button
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-white/10 transition-colors"
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Open in new tab */}
        <button
          onClick={() => window.open(window.location.href, '_blank', 'noopener')}
          className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-white/10 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Clock */}
        <div className="flex flex-col items-end px-2 leading-tight cursor-default">
          <span className="text-[11px] font-medium text-foreground/90 tabular-nums">{timeStr}</span>
          <span className="text-[9px] text-muted-foreground tabular-nums">{dateStr}</span>
        </div>

        {/* User */}
        {userInfo && (
          <div className="flex items-center px-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-black text-primary">{userInfo.initials}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => base44.auth.logout('/')}
          className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
          title="Sign out"
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}