import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Plus, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import NavigatorModuleCard from '@/components/navigator/NavigatorModuleCard';
import NavigatorFooter from '@/components/navigator/NavigatorFooter';
import ManualDocCard from '@/components/navigator/ManualDocCard';
import NewManualModal from '@/components/navigator/NewManualModal';
import { NAV_MODULES } from '@/components/navigator/navConfig';

export default function DocumentLibraryPage() {
  const [search, setSearch] = useState('');
  const [activeModule, setActiveModule] = useState(null);
  const [showList, setShowList] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: docs = [], refetch } = useQuery({
    queryKey: ['doc-library'],
    queryFn: () => base44.entities.DocumentLibrary.list('-effective_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentLibrary.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doc-library'] });
      setShowNew(false);
    },
  });

  const moduleCounts = {};
  for (const m of NAV_MODULES) {
    moduleCounts[m.id] = m.cats ? docs.filter((d) => m.cats.includes(d.category)).length : docs.length;
  }

  const activeMod = activeModule ? NAV_MODULES.find((m) => m.id === activeModule) : null;

  const visibleDocs = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.title?.toLowerCase().includes(q) ||
      d.summary?.toLowerCase().includes(q) ||
      d.document_number?.toLowerCase().includes(q) ||
      d.tags?.some((t) => t.toLowerCase().includes(q));
    const matchesMod = !activeMod || !activeMod.cats || activeMod.cats.includes(d.category);
    return matchesSearch && matchesMod;
  });

  const openModule = (id) => {
    if (id === activeModule && !search) {
      setShowList(false);
      setActiveModule(null);
      return;
    }
    setActiveModule(id);
    setShowList(true);
  };

  const clearFilters = () => {
    setShowList(false);
    setActiveModule(null);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ambient gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative px-4 pt-5 pb-24 max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Manuals Navigator</h1>
            <p className="text-[11px] font-mono text-primary tracking-widest uppercase mt-1">
              Operators · OEM · MEL/CDL · Engineering · Aerodyne · Training
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Global search */}
        <div className="relative">
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Search
            className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-all', search ? 'left-4 text-primary' : 'left-4')}
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value && !showList) setShowList(true);
            }}
            placeholder="Search AMM / SRM / IPC / MEL / engineering orders / Aerodyne procedures…"
            className="w-full h-12 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl pl-12 pr-12 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40"
          />
        </div>

        {/* Module grid */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Manual Modules</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 [min-width:900px]:grid-cols-5 gap-3">
            {NAV_MODULES.map((m) => (
              <NavigatorModuleCard
                key={m.id}
                mod={m}
                active={activeModule === m.id}
                count={moduleCounts[m.id]}
                onClick={() => openModule(m.id)}
              />
            ))}
          </div>
        </div>

        {/* Drill-down document list */}
        {(showList || search) && (
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">
                {search ? 'Search results' : activeMod?.label || 'Documents'}{' '}
                <span className="text-muted-foreground font-normal">· {visibleDocs.length}</span>
              </p>
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            {visibleDocs.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No manuals found{search ? ` for "${search}"` : ''}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleDocs.map((doc) => (
                  <ManualDocCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer grid */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Workbench</p>
          <NavigatorFooter docs={docs} />
        </div>
      </div>

      {showNew && <NewManualModal onSave={(d) => createMutation.mutate(d)} onClose={() => setShowNew(false)} />}
    </div>
  );
}