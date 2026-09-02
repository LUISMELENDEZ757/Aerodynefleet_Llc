import { X, Minus, Square, Copy } from 'lucide-react';

const SNAP_T = 8; // px from screen edge to trigger a snap zone

// Determine the snap zone (if any) from the cursor position.
// Desktop working area = full width, full height minus the 48px taskbar.
function detectSnap(cx, cy) {
  const W = window.innerWidth;
  const H = window.innerHeight - 48;
  const left = cx <= SNAP_T;
  const right = cx >= W - SNAP_T;
  const top = cy <= SNAP_T;
  const bottom = cy >= H - SNAP_T;
  if (top && left) return 'tl';
  if (top && right) return 'tr';
  if (bottom && left) return 'bl';
  if (bottom && right) return 'br';
  if (top) return 'max';
  if (left) return 'left';
  if (right) return 'right';
  return null;
}

// A single independent, draggable, resizable, snappable desktop window.
export default function DesktopWindow({
  win,
  focused,
  onFocus,
  onClose,
  onMinimize,
  onToggleMax,
  onDrag,
  onResize,
  onDragStart,
  onDragEnd,
  onSnapPreview,
  onSnap,
  onRestoreDrag,
}) {
  if (win.minimized) return null;

  const style = win.maximized
    ? { left: 0, top: 0, right: 0, bottom: 0, zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  const startDrag = (e) => {
    onFocus();
    onDragStart();

    // If the window is maximized or snapped, restore its prior geometry first
    // so dragging feels natural instead of dragging a full-screen window.
    let ox = win.x;
    let oy = win.y;
    let sx = e.clientX;
    let sy = e.clientY;
    if (win.maximized || win.snapped) {
      const rg = win.restoreGeo || { x: 60, y: 40, w: 960, h: 640 };
      const frac = win.w > 0 ? (e.clientX - win.x) / win.w : 0.5;
      ox = e.clientX - Math.min(Math.max(frac, 0.1), 0.9) * rg.w;
      oy = e.clientY - 18;
      sx = e.clientX;
      sy = e.clientY;
      onRestoreDrag(ox, oy, rg.w, rg.h);
    }

    const move = (ev) => {
      const nx = ox + ev.clientX - sx;
      const ny = oy + ev.clientY - sy;
      onSnapPreview(detectSnap(ev.clientX, ev.clientY));
      onDrag(nx, ny);
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onSnapPreview(null);
      onDragEnd();
      const zone = detectSnap(ev.clientX, ev.clientY);
      if (zone) onSnap(zone);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResize = (e) => {
    e.stopPropagation();
    onFocus();
    onDragStart();
    const sx = e.clientX;
    const sy = e.clientY;
    const ow = win.w;
    const oh = win.h;
    const move = (ev) =>
      onResize(Math.max(360, ow + ev.clientX - sx), Math.max(240, oh + ev.clientY - sy));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onDragEnd();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div
      className={`absolute flex flex-col pointer-events-auto bg-card/90 backdrop-blur-2xl border ${
        focused ? 'border-primary/50' : 'border-white/10'
      } ${win.maximized ? 'rounded-none' : 'rounded-xl'} shadow-2xl overflow-hidden`}
      style={style}
      onPointerDown={onFocus}
    >
      {/* Title bar */}
      <div
        className="h-9 flex items-center gap-2 pl-3 pr-0 border-b border-white/10 bg-white/5 select-none flex-shrink-0 cursor-grab active:cursor-grabbing"
        onPointerDown={startDrag}
        onDoubleClick={onToggleMax}
      >
        <span className="text-sm leading-none">{win.icon}</span>
        <span className="text-[12px] font-semibold text-foreground/90 truncate">{win.label}</span>
        <div className="ml-auto flex items-center" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={onMinimize}
            className="w-11 h-9 flex items-center justify-center text-muted-foreground hover:bg-white/10 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleMax}
            className="w-11 h-9 flex items-center justify-center text-muted-foreground hover:bg-white/10 transition-colors"
            title={win.maximized ? 'Restore' : 'Maximize'}
          >
            {win.maximized ? <Copy className="w-3 h-3 -rotate-90" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="w-11 h-9 flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background overflow-hidden">
        <iframe
          src={win.src}
          title={win.label}
          className="w-full h-full border-0 bg-background"
          loading="lazy"
        />
      </div>

      {/* Resize handle */}
      {!win.maximized && (
        <div
          onPointerDown={startResize}
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize z-10"
        />
      )}
    </div>
  );
}