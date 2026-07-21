import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, X, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CFG = {
  release:      { label: 'RELEASE',      bg: 'bg-green-900/50',  text: 'text-green-300' },
  feature:      { label: 'NEW FEATURE',  bg: 'bg-blue-900/50',   text: 'text-blue-300' },
  maintenance:  { label: 'MAINTENANCE',  bg: 'bg-amber-900/50',  text: 'text-amber-300' },
  alert:        { label: 'ALERT',        bg: 'bg-red-900/50',    text: 'text-red-300' },
  announcement: { label: 'ANNOUNCEMENT', bg: 'bg-violet-900/50', text: 'text-violet-300' },
};

export default function ManageUpdatesModal({ onClose }) {
  const qc = useQueryClient();

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['system-updates'],
    queryFn: () => base44.entities.SystemUpdate.filter({ is_published: true }, '-created_date', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemUpdate.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-updates'] }),
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <p className="text-base font-extrabold text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" /> Manage System Updates
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-gray-600 text-sm py-8">Loading updates…</p>
          ) : updates.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-8">No published updates</p>
          ) : (
            updates.map(u => {
              const cfg = CATEGORY_CFG[u.category] || CATEGORY_CFG.announcement;
              return (
                <div key={u.id} className="flex items-start justify-between gap-3 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded', cfg.bg, cfg.text)}>{cfg.label}</span>
                      {u.version && <span className="text-[10px] font-mono font-bold text-primary">{u.version}</span>}
                      <span className="text-[10px] text-gray-600">{new Date(u.created_date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{u.title}</p>
                    {u.posted_by && <p className="text-[10px] text-gray-600 mt-1">Posted by {u.posted_by}</p>}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(u.id)}
                    disabled={deleteMutation.isPending}
                    className="w-8 h-8 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center hover:bg-red-900/60 transition-colors flex-shrink-0 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}