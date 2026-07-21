import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CFG = {
  release: 'RELEASE',
  feature: 'NEW FEATURE',
  maintenance: 'MAINTENANCE',
  alert: 'ALERT',
  announcement: 'ANNOUNCEMENT',
};

const inputCls = 'w-full bg-[#0d1117] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors';

export default function PostUpdateModal({ onClose }) {
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
              {Object.entries(CATEGORY_CFG).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
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