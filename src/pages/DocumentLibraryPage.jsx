import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookMarked, Search, Plus, RefreshCw, ExternalLink, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CAT_CFG = {
  far:      { label: 'FAR', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  sop:      { label: 'SOP', color: 'text-primary', bg: 'bg-primary/15' },
  cba:      { label: 'CBA', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  manual:   { label: 'Manual', color: 'text-green-400', bg: 'bg-green-500/15' },
  bulletin: { label: 'Bulletin', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  policy:   { label: 'Policy', color: 'text-muted-foreground', bg: 'bg-muted' },
  other:    { label: 'Other', color: 'text-muted-foreground', bg: 'bg-muted' },
};

function NewDocModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    title: '', category: 'sop', document_number: '', revision: '', effective_date: '',
    summary: '', content: '', tags: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    onSave({ ...form, tags, is_active: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <p className="text-sm font-bold text-foreground">Add Document</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              {Object.entries(CAT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Doc Number</label>
            <input value={form.document_number} onChange={e => set('document_number', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Revision</label>
            <input value={form.revision} onChange={e => set('revision', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Effective Date</label>
            <input type="date" value={form.effective_date} onChange={e => set('effective_date', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Summary</label>
          <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={2}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1 resize-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Content / Key Excerpts</label>
          <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={4}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1 resize-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tags (comma-separated)</label>
          <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. far117, crew, duty-time"
            className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={!form.title}
            className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">
            Add Document
          </button>
          <button onClick={onClose} className="flex-1 h-10 border border-border text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DocCard({ doc }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CAT_CFG[doc.category] || CAT_CFG.other;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
          <BookMarked className={cn('w-4 h-4', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', cfg.bg, cfg.color)}>{cfg.label}</span>
            {doc.document_number && <span className="text-xs font-mono text-muted-foreground">{doc.document_number}</span>}
            {doc.revision && <span className="text-xs text-muted-foreground">Rev {doc.revision}</span>}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
          {doc.summary && <p className="text-xs text-muted-foreground line-clamp-1">{doc.summary}</p>}
        </div>
        {doc.effective_date && <span className="text-xs text-muted-foreground flex-shrink-0">{doc.effective_date}</span>}
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-3 bg-secondary/10">
          {doc.summary && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
              <p className="text-sm text-foreground">{doc.summary}</p>
            </div>
          )}
          {doc.content && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Content</p>
              <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{doc.content}</p>
            </div>
          )}
          {doc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          )}
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Open Document
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentLibraryPage() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: docs = [], refetch } = useQuery({
    queryKey: ['doc-library'],
    queryFn: () => base44.entities.DocumentLibrary.list('-effective_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentLibrary.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doc-library'] }); setShowNew(false); },
  });

  const filtered = docs.filter(d => {
    const matchesCat = catFilter === 'all' || d.category === catFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || d.title?.toLowerCase().includes(q) || d.summary?.toLowerCase().includes(q) || d.document_number?.toLowerCase().includes(q) || d.tags?.some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <BookMarked className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">DOCUMENT LIBRARY</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">FARs · SOPs · CBAs · Manuals · Bulletins</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={refetch} className="text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents, doc numbers, tags..."
            className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {[{ key: 'all', label: 'All' }, ...Object.entries(CAT_CFG).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
            <button key={f.key} onClick={() => setCatFilter(f.key)}
              className={cn('whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0',
                catFilter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-secondary')}>
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No documents found{search ? ` for "${search}"` : ''}. Click "Add" to start building your library.
            </div>
          ) : (
            filtered.map(doc => <DocCard key={doc.id} doc={doc} />)
          )}
        </div>
      </div>

      {showNew && <NewDocModal onSave={(d) => createMutation.mutate(d)} onClose={() => setShowNew(false)} />}
    </div>
  );
}