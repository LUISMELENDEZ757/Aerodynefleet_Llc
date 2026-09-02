import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { useTabHistory } from '@/lib/TabHistoryContext';
import PageTransition from '@/components/ui/PageTransition';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import WindowFrame from './WindowFrame';
import { getActiveApp } from './navApps';

// Keeps the tab-history context in sync with route changes inside the shell.
function DesktopLocationSync() {
  const location = useLocation();
  const { recordPath } = useTabHistory();
  useEffect(() => {
    recordPath(location.pathname);
  }, [location.pathname]);
  return null;
}

// Windows 11 desktop shell — single-window desktop model: one active module at
// a time, launched from the Start menu / taskbar, rendered in a Win11 window.
export default function Win11Desktop({ userInfo, zuluTime, isDemoMode, exitDemoMode }) {
  const [startOpen, setStartOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const activeApp = getActiveApp(location.pathname);

  // Launching from Start (route change) restores the window and closes the menu.
  useEffect(() => {
    setMinimized(false);
    setStartOpen(false);
  }, [location.pathname]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif" }}
    >
      <DesktopLocationSync />
      <style>{`
        @keyframes winpop { from{opacity:0; transform: translateY(6px) scale(.99)} to{opacity:1; transform:none} }
        @keyframes startpop { from{opacity:0; transform: translateY(10px)} to{opacity:1; transform:none} }
      `}</style>

      {/* Desktop wallpaper */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0a0f1c 0%, #0d1326 45%, #122042 100%)' }}
      />

      {/* Desktop watermark / brand */}
      <div className="absolute top-6 left-8 flex items-center gap-2.5 opacity-90 select-none pointer-events-none">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Plane className="w-5 h-5 text-primary" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-black text-white tracking-wide">Aerodyne Fleet OS</p>
          <p className="text-[10px] text-white/50 tracking-widest uppercase">Technical Operations · Windows Shell</p>
        </div>
      </div>

      {/* Active module window */}
      <div className="absolute inset-0 bottom-12">
        <WindowFrame
          app={activeApp}
          minimized={minimized}
          maximized={maximized}
          onMinimize={() => setMinimized(true)}
          onToggleMax={() => setMaximized((m) => !m)}
          onClose={() => navigate('/')}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </WindowFrame>
      </div>

      {/* Start menu */}
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} userInfo={userInfo} />

      {/* Taskbar */}
      <Taskbar
        startOpen={startOpen}
        onStartToggle={() => setStartOpen((o) => !o)}
        activeApp={activeApp}
        minimized={minimized}
        onToggleApp={() => setMinimized((m) => !m)}
        userInfo={userInfo}
        zuluTime={zuluTime}
        isDemoMode={isDemoMode}
        exitDemoMode={exitDemoMode}
      />
    </div>
  );
}