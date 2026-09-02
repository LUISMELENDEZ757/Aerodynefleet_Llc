import { useEffect, useRef } from 'react';
import { WALLPAPERS, setWallpaper } from './wallpapers';

// Right-click "Personalize" panel — picks a desktop wallpaper preset.
export default function PersonalizePanel({ pos, current, onPick, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  const left = Math.min(pos.x, window.innerWidth - 296);
  const top = Math.min(pos.y, window.innerHeight - 280);

  return (
    <div
      ref={ref}
      className="fixed z-[9997] w-72 rounded-2xl bg-[#1f1f23]/92 backdrop-blur-2xl border border-white/12 shadow-2xl p-3"
      style={{ left, top, animation: 'startpop .14s ease-out' }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
        Personalize · Background
      </p>
      <div className="grid grid-cols-4 gap-2">
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            title={w.name}
            onClick={() => {
              setWallpaper(w.id);
              onPick(w);
            }}
            className={`aspect-square rounded-lg border-2 transition-all ${
              current === w.id
                ? 'border-primary ring-2 ring-primary/40'
                : 'border-white/10 hover:border-white/30'
            }`}
            style={{ background: w.bg }}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 px-1">
        {WALLPAPERS.find((w) => w.id === current)?.name || ''}
      </p>
    </div>
  );
}