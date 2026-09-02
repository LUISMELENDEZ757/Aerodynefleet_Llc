import { useState } from 'react';
import { WIN_APPS } from './navApps';

const STORAGE_KEY = 'win11_desktop_icon_positions';

// Default pinned shortcuts shown on the desktop wallpaper.
const DEFAULT_PATHS = [
  '/',
  '/FleetDashboard',
  '/MaintenanceControl',
  '/OpsHub',
  '/MEL',
  '/TechOps',
  '/Dispatch',
  '/FleetRegistry',
  '/ETOPSMonitor',
  '/TechnicianMode',
  '/Analytics',
  '/Settings',
];

const appByPath = Object.fromEntries(WIN_APPS.map((a) => [a.path, a]));

function defaultPositions() {
  const pos = {};
  DEFAULT_PATHS.forEach((p, i) => {
    pos[p] = { x: 24, y: 120 + i * 94 };
  });
  return pos;
}

// Draggable, placeable OS-style desktop shortcuts.
export default function DesktopIcons({ onLaunch }) {
  const [positions, setPositions] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored) return { ...defaultPositions(), ...stored };
    } catch {
      /* ignore */
    }
    return defaultPositions();
  });
  const [selected, setSelected] = useState(null);

  const persist = (pos) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  };

  const startDrag = (e, path) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(path);
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = positions[path] || { x: 0, y: 0 };
    let moved = false;

    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      moved = true;
      const nx = Math.min(Math.max(orig.x + dx, 0), window.innerWidth - 84);
      const ny = Math.min(Math.max(orig.y + dy, 0), window.innerHeight - 48 - 88);
      setPositions((prev) => ({ ...prev, [path]: { x: nx, y: ny } }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) {
        setPositions((prev) => {
          persist(prev);
          return prev;
        });
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      className="absolute inset-0 bottom-12 pointer-events-none"
      onPointerDown={() => setSelected(null)}
    >
      {DEFAULT_PATHS.map((path) => {
        const app = appByPath[path];
        if (!app) return null;
        const pos = positions[path] || { x: 24, y: 120 };
        const isSel = selected === path;
        return (
          <button
            key={path}
            onPointerDown={(e) => startDrag(e, path)}
            onDoubleClick={() => onLaunch(app)}
            className={`absolute w-[76px] flex flex-col items-center gap-1 px-1.5 py-2 rounded-lg pointer-events-auto select-none transition-colors ${
              isSel ? 'bg-primary/25 ring-1 ring-primary/40' : 'hover:bg-white/10'
            }`}
            style={{ left: pos.x, top: pos.y }}
            title={app.label}
          >
            <span className="text-3xl leading-none drop-shadow-lg">{app.icon}</span>
            <span className="text-[11px] font-medium text-white text-center leading-tight line-clamp-2 drop-shadow-md">
              {app.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}