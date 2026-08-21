import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, AlertTriangle, Clock, RefreshCw, BookMarked } from 'lucide-react';
import { VERDICTS } from './navConfig';

const VERDICT_ORDER = ['approved', 'review', 'rii', 'rejected'];
const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return '—';
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs >= 1) return `${hrs}h ago`;
  const min = Math.max(1, Math.floor(diff / 60000));
  return `${min}m ago`;
};

function GlassPanel({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 backdrop-blur-xl space-y-3 min-h-[180px]">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-xs font-bold text-foreground tracking-wide">{label}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyRow() {
  return <p className="text-[11px] text-muted-foreground/60">Nothing to show yet.</p>;
}

function Row({ title, meta, icon }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {icon && <span className="text-muted-foreground/50">{icon}</span>}
      <span className="text-xs text-foreground flex-1 truncate">{title}</span>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">{meta}</span>
    </div>
  );
}

export default function NavigatorFooter({ docs }) {
  const [verdicts, setVerdicts] = useState({});

  const recent = [...docs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 4);
  const bookmarked = docs.filter((d) => d.tags?.length > 0).slice(0, 3);
  const revisions = docs
    .filter((d) => d.revision)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 3);
  const tailAlerts = docs
    .filter((d) => d.category === 'cba' || d.tags?.some((t) => /^N\d/i.test(t)))
    .slice(0, 2);
  const pending = recent.slice(0, 4);

  const cycleVerdict = (id) =>
    setVerdicts((v) => {
      const cur = v[id] || 'review';
      const next = VERDICT_ORDER[(VERDICT_ORDER.indexOf(cur) + 1) % VERDICT_ORDER.length];
      return { ...v, [id]: next };
    });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 [min-width:900px]:grid-cols-3 gap-3">
      {/* Recently Viewed */}
      <GlassPanel icon={BookMarked} label="RECENTLY VIEWED MANUALS">
        {recent.length ? (
          <div className="divide-y divide-white/5">
            {recent.map((d) => (
              <Row key={d.id} title={d.title} meta={`Rev ${d.revision || '—'}`} />
            ))}
          </div>
        ) : (
          <EmptyRow />
        )}
      </GlassPanel>

      {/* Bookmarked Tasks */}
      <GlassPanel icon={Star} label="BOOKMARKED TASKS">
        {bookmarked.length ? (
          <div className="divide-y divide-white/5">
            {bookmarked.map((d) => (
              <Row key={d.id} title={d.title} meta={d.tags?.[0]} icon={<Star className="w-3 h-3" />} />
            ))}
          </div>
        ) : (
          <EmptyRow />
        )}
      </GlassPanel>

      {/* Pending Dispositions — signature verdict chips */}
      <GlassPanel icon={AlertTriangle} label="PENDING DISPOSITIONS">
        <div className="flex flex-wrap gap-1.5">
          {VERDICT_ORDER.map((k) => {
            const v = VERDICTS[k];
            return (
              <span
                key={k}
                className={cn('flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border', v.bg, v.border, v.color)}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', v.dot)} />
                {v.label}
              </span>
            );
          })}
        </div>
        <div className="divide-y divide-white/5">
          {pending.length ? (
            pending.map((d) => {
              const vkey = verdicts[d.id] || 'review';
              const v = VERDICTS[vkey];
              return (
                <button onClick={() => cycleVerdict(d.id)} key={d.id} className="flex items-center gap-2 py-1.5 w-full text-left">
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', v.dot)} />
                  <span className="text-xs text-foreground flex-1 truncate">{d.title}</span>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0', v.bg, v.border, v.color)}>
                    {v.label}
                  </span>
                </button>
              );
            })
          ) : (
            <EmptyRow />
          )}
        </div>
      </GlassPanel>

      {/* Revision Conflicts */}
      <GlassPanel icon={Clock} label="REVISION CONFLICTS">
        {revisions.length ? (
          <div className="divide-y divide-white/5">
            {revisions.map((d) => (
              <Row key={d.id} title={`Rev ${d.revision}`} meta={timeAgo(d.updated_date || d.created_date)} icon={<AlertTriangle className="w-3 h-3 text-amber-400" />} />
            ))}
          </div>
        ) : (
          <EmptyRow />
        )}
      </GlassPanel>

      {/* Tail-Specific Alerts */}
      <GlassPanel icon={AlertTriangle} label="TAIL-SPECIFIC ALERTS">
        {tailAlerts.length ? (
          <div className="divide-y divide-white/5">
            {tailAlerts.map((d) => (
              <Row key={d.id} title={d.title} meta={timeAgo(d.created_date)} icon={<AlertTriangle className="w-3 h-3 text-red-400" />} />
            ))}
          </div>
        ) : (
          <EmptyRow />
        )}
      </GlassPanel>

      {/* Sync status mini */}
      <GlassPanel icon={RefreshCw} label="MANUAL SYNC STATUS">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-primary leading-none">{docs.length}</span>
          <div>
            <p className="text-xs font-bold text-foreground">{docs.length} manuals indexed</p>
            <p className="flex items-center gap-1.5 text-[10px] text-green-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> All sources in sync
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['AMM', 'IPC', 'SRM', 'MEL', 'Aerodyne'].map((s) => (
            <span key={s} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground">
              {s} ✓
            </span>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}