import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Plane, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLOR = {
  OPEN: 'bg-amber-900/50 text-amber-400',
  IN_PROGRESS: 'bg-blue-900/50 text-blue-400',
  PENDING_RII: 'bg-purple-900/50 text-purple-400',
  CLOSED: 'bg-green-900/50 text-green-400',
};

export default function GlobalLogbookSearch({ onSelectTail }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    const isAta = /^\d{1,2}(-\d+)?$/.test(q);
    const [byTail, byAta] = await Promise.all([
      isAta ? Promise.resolve([]) : base44.entities.LogbookEntry.filter({ aircraft_tail: q.toUpperCase() }, '-created_date', 100),
      isAta ? base44.entities.LogbookEntry.filter({ ata_chapter: q.split('-')[0] }, '-created_date', 100) : Promise.resolve([]),
    ]);
    setResults([...byTail, ...byAta]);
    setLoading(false);
  };

  const clear = () => { setQuery(''); setResults(null); };

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
      <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
        <Search className="w-3 h-3" /> Global Logbook Search — All Aircraft
      </p>
      <form onSubmit={runSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by tail number (N455GJ) or ATA chapter (79)…"
            className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
          />
          {query && (
            <button type="button" onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button type="submit" disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
        </button>
      </form>

      {results !== null && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">{results.length} historical {results.length === 1 ? 'entry' : 'entries'} found</p>
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {results.map(e => {
              const status = e.is_cleared ? 'CLOSED' : (e.discrepancy_status || 'OPEN');
              return (
                <button key={e.id} onClick={() => onSelectTail?.(e.aircraft_tail)}
                  className="w-full text-left bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                      <Plane className="w-3 h-3" /> {e.aircraft_tail}
                    </span>
                    {e.log_page && <span className="text-[10px] font-mono font-bold text-gray-400">{e.log_page}</span>}
                    {e.ata_chapter && <span className="text-[10px] text-gray-500">ATA {e.ata_chapter}</span>}
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', STATUS_COLOR[status] || STATUS_COLOR.OPEN)}>{status}</span>
                    <span className="text-[10px] text-gray-600 ml-auto">{new Date(e.created_date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{e.description}</p>
                  {e.corrective_action && <p className="text-[10px] text-green-500 mt-0.5 line-clamp-1">✓ {e.corrective_action}</p>}
                </button>
              );
            })}
            {results.length === 0 && (
              <p className="text-center text-gray-600 text-sm py-6">No entries match "{query}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}