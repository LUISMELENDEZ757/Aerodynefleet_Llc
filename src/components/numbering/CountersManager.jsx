import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { RefreshCw, Hash, Database } from 'lucide-react';

const TYPE_LABELS = {
  me_part: 'M&E Part', tooling: 'Tooling', document: 'Document',
  work_order: 'Work Order', history: 'History', scrap: 'Scrap/BER',
  pool: 'Pool', traceability: 'Traceability',
};

export default function CountersManager() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: counters = [], isLoading, refetch } = useQuery({
    queryKey: ['me-numbering-counters'],
    queryFn: () => base44.entities.NumberingStandard.list('-updated_date', 500),
    refetchInterval: 30000,
  });

  const filtered = counters.filter(c => {
    const typeMatch = typeFilter === 'all' || c.number_type === typeFilter;
    const k = (c.counter_key || '').toLowerCase() + (c.description || '').toLowerCase();
    const searchMatch = !filter || k.includes(filter.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Counter Contexts" value={counters.length} icon={Hash} />
        <Stat label="Total Issued" value={counters.reduce((s, c) => s + Math.max(0, (c.next_seq || 1) - 1), 0)} icon={Database} />
        <Stat label="M&E Part Counters" value={counters.filter(c => c.number_type === 'me_part').length} icon={Hash} />
        <Stat label="Document Counters" value={counters.filter(c => c.number_type === 'document').length} icon={Hash} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search counter key / description…"
          className="flex-1 min-w-[200px] bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 font-mono outline-none focus:border-primary" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none">
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={() => refetch()} className="w-9 h-9 rounded-xl bg-[#1a1f2e] border border-white/10 flex items-center justify-center hover:bg-white/10">
          <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 border-b border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <div className="col-span-2">Type</div>
          <div className="col-span-4">Counter Key</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-1 text-center">Next Seq</div>
          <div className="col-span-1 text-center">Issued</div>
          <div className="col-span-1 text-right">Last Issued</div>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="px-4 py-10 text-center text-gray-600 text-sm">Loading counters…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-600 text-sm">No counters yet — issue a number to create the first counter.</div>
          ) : filtered.map(c => (
            <div key={c.id} className="grid grid-cols-12 px-4 py-2.5 items-center text-xs font-mono hover:bg-white/5">
              <div className="col-span-2">
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold',
                  c.number_type === 'me_part' ? 'bg-emerald-900/40 text-emerald-300' :
                  c.number_type === 'tooling' ? 'bg-blue-900/40 text-blue-300' :
                  c.number_type === 'document' ? 'bg-cyan-900/40 text-cyan-300' :
                  c.number_type === 'work_order' ? 'bg-amber-900/40 text-amber-300' :
                  c.number_type === 'history' ? 'bg-violet-900/40 text-violet-300' :
                  c.number_type === 'scrap' ? 'bg-red-900/40 text-red-300' :
                  c.number_type === 'pool' ? 'bg-indigo-900/40 text-indigo-300' :
                  'bg-gray-900/40 text-gray-300')}>
                  {TYPE_LABELS[c.number_type] || c.number_type}
                </span>
              </div>
              <div className="col-span-4 text-white truncate">{c.counter_key}</div>
              <div className="col-span-3 text-gray-500 truncate">{c.description || '—'}</div>
              <div className="col-span-1 text-center text-amber-400 font-bold">{c.next_seq || 1}</div>
              <div className="col-span-1 text-center text-gray-400">{Math.max(0, (c.next_seq || 1) - 1)}</div>
              <div className="col-span-1 text-right text-gray-500 text-[10px] truncate" title={c.last_issued_value}>{c.last_issued_value || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
      <Icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
      <div>
        <p className="text-2xl font-black text-white font-mono">{value}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}