import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Power, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { WIN_APPS } from './navApps';

// Windows 11 Start menu — anchored above the bottom-left Start button.
export default function StartMenu({ open, onClose, userInfo }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return WIN_APPS;
    return WIN_APPS.filter(
      (a) =>
        a.label.toLowerCase().includes(qq) ||
        a.path.toLowerCase().includes(qq) ||
        a.group.toLowerCase().includes(qq)
    );
  }, [q]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach((a) => {
      (map[a.group] ||= []).push(a);
    });
    return Object.entries(map);
  }, [filtered]);

  if (!open) return null;

  const launch = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 left-2 bottom-14 w-[420px] max-w-[94vw] max-h-[72vh] flex flex-col rounded-2xl bg-[#1f1f23]/90 backdrop-blur-2xl border border-white/12 shadow-2xl overflow-hidden"
        style={{ animation: 'startpop .16s ease-out' }}
      >
        {/* Search */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/8 border border-white/10">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for apps and modules"
              className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 scrollbar-hide">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {q ? 'Results' : 'Pinned'}
          </p>
          <div className="grid grid-cols-4 gap-1">
            {filtered.slice(0, 16).map((a) => (
              <button
                key={a.path}
                onClick={() => launch(a.path)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl leading-none">{a.icon}</span>
                <span className="text-[10px] text-foreground/80 text-center leading-tight line-clamp-2">
                  {a.label}
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No apps match “{q}”.</p>
          )}

          {/* All apps list */}
          {!q && (
            <div className="mt-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                All apps
              </p>
              <div className="max-h-44 overflow-y-auto scrollbar-hide">
                {groups.map(([g, items]) => (
                  <div key={g} className="mb-1">
                    {items.map((a) => (
                      <button
                        key={a.path}
                        onClick={() => launch(a.path)}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <span className="text-base leading-none">{a.icon}</span>
                        <span className="text-xs text-foreground/85">{a.label}</span>
                        <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground/50" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-black text-primary">{userInfo?.initials || 'U'}</span>
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{userInfo?.name || 'User'}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{userInfo?.role || ''}</p>
            </div>
          </div>
          <button
            onClick={() => base44.auth.logout('/')}
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
            title="Sign out"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}