import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CFG = {
  release:      { label: 'RELEASE',      bg: 'bg-green-900/50',  text: 'text-green-300' },
  feature:      { label: 'NEW FEATURE',  bg: 'bg-blue-900/50',   text: 'text-blue-300' },
  maintenance:  { label: 'MAINTENANCE',  bg: 'bg-amber-900/50',  text: 'text-amber-300' },
  alert:        { label: 'ALERT',        bg: 'bg-red-900/50',    text: 'text-red-300' },
  announcement: { label: 'ANNOUNCEMENT', bg: 'bg-violet-900/50', text: 'text-violet-300' },
};

const inputCls = 'w-full bg-[#0d1117] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors';

function PostUpdateModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', body: '', category: 'announcement', version: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.SystemUpdate.create({ ...form, is_published: true, posted_by: me.full_name });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-updates'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <p className="text-base font-extrabold text-white">Post System Update</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <input placeholder="Update headline *" value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
              {Object.entries(CATEGORY_CFG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </select>
            <input placeholder="Version (e.g. v2.4.1)" value={form.version} onChange={e => set('version', e.target.value)} className={inputCls} />
          </div>
          <textarea rows={5} placeholder="Details / release notes..." value={form.body} onChange={e => set('body', e.target.value)} className={cn(inputCls, 'resize-none')} />
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.title.trim() || mutation.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {mutation.isPending ? 'Posting…' : 'Publish Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SystemNewsFeed() {
  const [showPost, setShowPost] = useState(false);
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
        {isAdmin && (
          <button
            onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Post Update
          </button>
        )}
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

      {showPost && <PostUpdateModal onClose={() => setShowPost(false)} />}
    </div>
  );
}