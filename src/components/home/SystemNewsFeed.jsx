import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CFG = {
  release:      { label: 'RELEASE',      bg: 'bg-green-900/50',  text: 'text-green-300' },
  feature:      { label: 'NEW FEATURE',  bg: 'bg-blue-900/50',   text: 'text-blue-300' },
  maintenance:  { label: 'MAINTENANCE',  bg: 'bg-amber-900/50',  text: 'text-amber-300' },
  alert:        { label: 'ALERT',        bg: 'bg-red-900/50',    text: 'text-red-300' },
  announcement: { label: 'ANNOUNCEMENT', bg: 'bg-violet-900/50', text: 'text-violet-300' },
};

export default function SystemNewsFeed() {
  const qc = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), staleTime: 60000 });
  const isAdmin = me?.role === 'admin';

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['system-updates'],
    queryFn: () => base44.entities.SystemUpdate.filter({ is_published: true }, '-created_date', 25),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemUpdate.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-updates'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> System Update News
        </h2>
      </div>

      {isLoading ? (
        <div className="bg-[#141922] border border-white/8 rounded-2xl py-10 text-center text-gray-600 text-sm">Loading updates…</div>
      ) : updates.length === 0 ? (
        <div className="bg-[#141922] border border-white/8 rounded-2xl py-10 text-center text-gray-600 text-sm">
          No system updates posted yet
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map(u => {
            const cfg = CATEGORY_CFG[u.category] || CATEGORY_CFG.announcement;
            return (
              <div key={u.id} className="bg-[#141922] border border-white/8 rounded-2xl px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded', cfg.bg, cfg.text)}>{cfg.label}</span>
                      {u.version && <span className="text-[10px] font-mono font-bold text-primary">{u.version}</span>}
                      <span className="text-[10px] text-gray-600">{new Date(u.created_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-extrabold text-white">{u.title}</p>
                    {u.body && <p className="text-xs text-gray-400 mt-1 leading-relaxed whitespace-pre-line">{u.body}</p>}
                    {u.posted_by && <p className="text-[10px] text-gray-600 mt-2">Posted by {u.posted_by}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deleteMutation.mutate(u.id)}
                      className="w-7 h-7 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center hover:bg-red-900/60 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}