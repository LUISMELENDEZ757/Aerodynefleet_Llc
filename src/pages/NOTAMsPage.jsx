import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { AlertTriangle, Plus, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMPACT_COLORS = {
  critical: 'text-destructive bg-destructive/15 border-destructive/30',
  warning: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
  info: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
};

function NOTAMCard({ notam, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = IMPACT_COLORS[notam.impact_level] || IMPACT_COLORS.info;
  return (
    <div className={cn('rounded-xl border p-4 space-y-2', cfg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', cfg)}>{notam.impact_level?.toUpperCase()}</span>
          <span className="text-xs font-mono font-bold text-foreground">{notam.notam_id}</span>
          <span className="text-xs text-muted-foreground">{notam.airport}</span>
        </div>
        <button onClick={() => onDelete(notam.id)} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className={cn('text-sm', expanded ? '' : 'line-clamp-2')}>{notam.text}</p>
      {notam.text?.length > 120 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted-foreground hover:text-foreground">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      {notam.effective && (
        <p className="text-xs text-muted-foreground">Effective: {notam.effective}</p>
      )}
    </div>
  );
}

function NewNOTAMModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ notam_id: '', airport: '', impact_level: 'info', effective: '', text: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md space-y-3">
        <h3 className="font-bold text-foreground">New NOTAM Entry</h3>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="NOTAM ID" value={form.notam_id} onChange={e => set('notam_id', e.target.value)}
            className="h-9 bg-background border border-border rounded px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <input placeholder="Airport ICAO" value={form.airport} onChange={e => set('airport', e.target.value)}
            className="h-9 bg-background border border-border rounded px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.impact_level} onChange={e => set('impact_level', e.target.value)}
            className="h-9 bg-background border border-border rounded px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <input placeholder="Effective (e.g. 2026-03-25)" value={form.effective} onChange={e => set('effective', e.target.value)}
            className="h-9 bg-background border border-border rounded px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <textarea placeholder="NOTAM text" value={form.text} onChange={e => set('text', e.target.value)} rows={4}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-secondary text-muted-foreground text-sm font-semibold hover:bg-secondary/80">Cancel</button>
          <button onClick={() => onCreate(form)} disabled={!form.notam_id || !form.text}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">Add NOTAM</button>
        </div>
      </div>
    </div>
  );
}

export default function NOTAMsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  // Store NOTAMs via DispatchRelease notams array — we'll keep them in local entity mock
  const [localNotams, setLocalNotams] = useState([
    { id: '1', notam_id: 'KEWR A1234/26', airport: 'KEWR', impact_level: 'warning', effective: '2026-03-25 0800Z', text: 'TWY B CLSD BTN TWY A AND TWY C DUE CONSTRUCTION. ALTN ROUTING VIA TWY D.' },
    { id: '2', notam_id: 'KJFK A5678/26', airport: 'KJFK', impact_level: 'critical', effective: '2026-03-25 1200Z', text: 'RWY 13R/31L CLSD TO ALL ACFT. ILS RWY 22L UNUSABLE. EXPECT DELAYS.' },
    { id: '3', notam_id: 'KORD A9012/26', airport: 'KORD', impact_level: 'info', effective: '2026-03-25 0600Z', text: 'ACFT STAND CHANGE: GATE B14 UNAVAILABLE, USE GATE B16. NO IMPACT TO DEPARTURES.' },
  ]);

  const filtered = localNotams
    .filter(n => filter === 'all' || n.impact_level === filter)
    .filter(n => !search || n.notam_id.toLowerCase().includes(search.toLowerCase()) || n.airport.toLowerCase().includes(search.toLowerCase()) || n.text.toLowerCase().includes(search.toLowerCase()));

  const critical = localNotams.filter(n => n.impact_level === 'critical').length;
  const warning = localNotams.filter(n => n.impact_level === 'warning').length;

  const handleCreate = (data) => {
    setLocalNotams(prev => [...prev, { ...data, id: Date.now().toString() }]);
    setShowNew(false);
  };
  const handleDelete = (id) => setLocalNotams(prev => prev.filter(n => n.id !== id));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">NOTAM CENTER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Notices to Air Missions · Route & Field Alerts</p>
            </div>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
            <Plus className="w-3.5 h-3.5" /> Add NOTAM
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-foreground">{localNotams.length}</p>
            <p className="text-xs text-muted-foreground">Total NOTAMs</p>
          </div>
          <div className="rounded-xl bg-card border border-destructive/30 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-destructive">{critical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className="rounded-xl bg-card border border-orange-500/30 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-orange-400">{warning}</p>
            <p className="text-xs text-muted-foreground">Warning</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input placeholder="Search NOTAM ID, airport, or text…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {['all', 'critical', 'warning', 'info'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize',
                  filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(n => <NOTAMCard key={n.id} notam={n} onDelete={handleDelete} />)}
          {filtered.length === 0 && (
            <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No NOTAMs match your filters
            </div>
          )}
        </div>
      </div>

      {showNew && <NewNOTAMModal onClose={() => setShowNew(false)} onCreate={handleCreate} />}
    </div>
  );
}