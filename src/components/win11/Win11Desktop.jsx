import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { useTabHistory } from '@/lib/TabHistoryContext';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import DesktopWindow from './DesktopWindow';
import DesktopIcons from './DesktopIcons';
import { getActiveApp } from './navApps';

// Keeps the tab-history context in sync with route changes inside the shell.
function DesktopLocationSync() {
  const location = useLocation();
  const { recordPath } = useTabHistory();
  useEffect(() => {
    recordPath(location.pathname);
  }, [location.pathname, recordPath]);
  return null;
}

// Build an embed-mode URL so an iframe shows just the page, with no shell.
const buildSrc = (path) => {
  const sep = path.includes('?') ? '&' : '?';
  return `${window.location.origin}${path}${sep}embed=1`;
};

// Windows 11 multi-window desktop shell.
export default function Win11Desktop({ userInfo, zuluTime, isDemoMode, exitDemoMode }) {
  const [startOpen, setStartOpen] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [previewZone, setPreviewZone] = useState(null);
  const location = useLocation();
  const zRef = useRef(11);

  // Snap geometry for each zone, in viewport coordinates (taskbar excluded).
  const snapRect = (zone) => {
    const W = window.innerWidth;
    const H = window.innerHeight - 48;
    const hw = Math.floor(W / 2);
    const hh = Math.floor(H / 2);
    switch (zone) {
      case 'max': return { x: 0, y: 0, w: W, h: H };
      case 'left': return { x: 0, y: 0, w: hw, h: H };
      case 'right': return { x: hw, y: 0, w: W - hw, h: H };
      case 'tl': return { x: 0, y: 0, w: hw, h: hh };
      case 'tr': return { x: hw, y: 0, w: W - hw, h: hh };
      case 'bl': return { x: 0, y: hh, w: hw, h: H - hh };
      case 'br': return { x: hw, y: hh, w: W - hw, h: H - hh };
      default: return null;
    }
  };

  // Seed the initial window from the route the desktop was opened on.
  const [windows, setWindows] = useState(() => {
    const app = getActiveApp(location.pathname) || {
      label: 'Aerodyne Fleet OS',
      icon: '✈️',
      path: location.pathname || '/',
    };
    return [
      {
        id: `${app.path}#init`,
        path: app.path,
        label: app.label,
        icon: app.icon,
        src: buildSrc(app.path),
        x: 60,
        y: 40,
        w: 960,
        h: 640,
        z: 11,
        minimized: false,
        maximized: false,
      },
    ];
  });

  const focusWin = useCallback((id) => {
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, z: ++zRef.current, minimized: false } : w))
    );
  }, []);

  const openWindow = useCallback((app) => {
    const path = app.path;
    setWindows((ws) => {
      const existing = ws.find((w) => w.path === path);
      if (existing) {
        return ws.map((w) =>
          w.id === existing.id ? { ...w, z: ++zRef.current, minimized: false } : w
        );
      }
      const offset = ws.length * 28;
      return [
        ...ws,
        {
          id: `${path}#${Date.now()}`,
          path,
          label: app.label,
          icon: app.icon,
          src: buildSrc(path),
          x: 60 + offset,
          y: 40 + offset,
          w: 960,
          h: 640,
          z: ++zRef.current,
          minimized: false,
          maximized: false,
        },
      ];
    });
    setStartOpen(false);
  }, []);

  const closeWin = (id) => setWindows((ws) => ws.filter((w) => w.id !== id));
  const minimizeWin = (id) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  const toggleMaxWin = (id) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));

  const dragWin = (id, x, y) => {
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 48 - 40;
        return {
          ...w,
          x: Math.min(Math.max(x, -w.w + 140), maxX),
          y: Math.min(Math.max(y, 0), maxY),
        };
      })
    );
  };

  const resizeWin = (id, w, h) =>
    setWindows((ws) =>
      ws.map((wv) => (wv.id === id ? { ...wv, w, h, snapped: false } : wv))
    );

  // Apply a snap zone to a window, saving its pre-snap geometry for later restore.
  const applySnap = (id, zone) => {
    const r = snapRect(zone);
    if (!r) return;
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        const restoreGeo = { x: w.x, y: w.y, w: w.w, h: w.h, maximized: w.maximized };
        return {
          ...w,
          ...r,
          maximized: zone === 'max',
          snapped: zone !== 'max',
          restoreGeo,
        };
      })
    );
    setPreviewZone(null);
  };

  // Restore a snapped/maximized window to a free-floating geometry on drag-away.
  const restoreDrag = (id, x, y, w, h) =>
    setWindows((ws) =>
      ws.map((wv) =>
        wv.id === id ? { ...wv, x, y, w, h, maximized: false, snapped: false } : wv
      )
    );

  // Focused = top-most non-minimized window.
  const focusedId = windows.reduce(
    (top, w) => (!w.minimized && w.z > (top?.z || 0) ? w : top),
    null
  )?.id;

  const onPillClick = (w) => {
    if (w.id === focusedId && !w.minimized) minimizeWin(w.id);
    else focusWin(w.id);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif" }}
    >
      <DesktopLocationSync />
      <style>{`
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

      {/* Desktop shortcuts (draggable / placeable) */}
      <DesktopIcons onLaunch={openWindow} />

      {/* Windows layer (above taskbar reserved space) — pass-through so empty
          desktop areas let pointer events reach the icons beneath it. */}
      <div className="absolute inset-0 bottom-12 pointer-events-none">
        {windows.map((w) => (
          <DesktopWindow
            key={w.id}
            win={w}
            focused={w.id === focusedId}
            onFocus={() => focusWin(w.id)}
            onClose={() => closeWin(w.id)}
            onMinimize={() => minimizeWin(w.id)}
            onToggleMax={() => toggleMaxWin(w.id)}
            onDrag={(x, y) => dragWin(w.id, x, y)}
            onResize={(ww, hh) => resizeWin(w.id, ww, hh)}
            onDragStart={() => setInteracting(true)}
            onDragEnd={() => setInteracting(false)}
            onSnapPreview={setPreviewZone}
            onSnap={(zone) => applySnap(w.id, zone)}
            onRestoreDrag={(x, y, ww, hh) => restoreDrag(w.id, x, y, ww, hh)}
          />
        ))}
      </div>

      {/* Snap preview outline */}
      {previewZone &&
        (() => {
          const r = snapRect(previewZone);
          if (!r) return null;
          return (
            <div
              className="absolute rounded-xl border-2 border-primary/60 bg-primary/15 pointer-events-none transition-all duration-100"
              style={{ left: r.x, top: r.y, width: r.w, height: r.h, zIndex: 9998 }}
            />
          );
        })()}

      {/* Drag/resize shield — covers iframes so pointermove keeps firing */}
      {interacting && <div className="fixed inset-0 z-[9999]" style={{ cursor: 'inherit' }} />}

      {/* Start menu */}
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} onLaunch={openWindow} userInfo={userInfo} />

      {/* Taskbar */}
      <Taskbar
        startOpen={startOpen}
        onStartToggle={() => setStartOpen((o) => !o)}
        windows={windows}
        focusedId={focusedId}
        onPillClick={onPillClick}
        userInfo={userInfo}
        zuluTime={zuluTime}
        isDemoMode={isDemoMode}
        exitDemoMode={exitDemoMode}
      />
    </div>
  );
}