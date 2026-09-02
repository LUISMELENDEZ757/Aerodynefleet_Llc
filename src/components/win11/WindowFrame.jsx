import { X, Minus, Square, Copy } from 'lucide-react';

// Windows 11-styled window chrome wrapping the active module's page.
export default function WindowFrame({
  app,
  minimized,
  maximized,
  onMinimize,
  onToggleMax,
  onClose,
  children,
}) {
  if (minimized) return null;

  const wrap = maximized ? 'inset-0 rounded-none' : 'inset-3 sm:inset-6 rounded-xl';

  return (
    <div
      className={`absolute ${wrap} flex flex-col bg-card/85 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden`}
      style={{ animation: 'winpop .14s ease-out' }}
    >
      {/* Title bar */}
      <div className="h-9 flex items-center gap-2 pl-3 pr-0 border-b border-white/10 bg-white/5 select-none flex-shrink-0">
        <span className="text-sm leading-none">{app?.icon || '✈️'}</span>
        <span className="text-[12px] font-semibold text-foreground/90 truncate">
          {app?.label || 'Aerodyne Fleet OS'}
        </span>
        {app?.path && (
          <span className="text-[10px] text-muted-foreground/70 font-mono ml-1 hidden sm:block">
            {app.path}
          </span>
        )}
        <div className="ml-auto flex items-center">
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
            title={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? <Copy className="w-3 h-3 -rotate-90" /> : <Square className="w-3 h-3" />}
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
      <div className="flex-1 overflow-y-auto bg-background">{children}</div>
    </div>
  );
}