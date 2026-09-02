import { X, Minus, Square, Copy } from 'lucide-react';

// A single independent, draggable, resizable desktop window.
// Content is an embed-mode iframe so each window is a fully live page.
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
}) {
  if (win.minimized) return null;

  const style = win.maximized
    ? { left: 0, top: 0, right: 0, bottom: 0, zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  const startDrag = (e) => {
    if (win.maximized) return;
    onFocus();
    onDragStart();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = win.x;
    const oy = win.y;
    const move = (ev) => onDrag(ox + ev.clientX - sx, oy + ev.clientY - sy);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onDragEnd();
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
      className={`absolute flex flex-col bg-card/90 backdrop-blur-2xl border ${
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
        <div
          className="ml-auto flex items-center"
          onPointerDown={(e) => e.stopPropagation()}
        >
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

      {/* Content — live page via embed-mode iframe */}
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