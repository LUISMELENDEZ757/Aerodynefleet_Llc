import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Wrench, RefreshCw, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'text-destructive',   bg: 'bg-destructive/15' },
  in_progress: { label: 'In Progress', color: 'text-orange-400',    bg: 'bg-orange-500/15' },
  pending_parts:{ label: 'Pend. Parts', color: 'text-yellow-400',   bg: 'bg-yellow-500/15' },
  released:    { label: 'Released',    color: 'text-green-400',     bg: 'bg-green-500/15' },
  closed:      { label: 'Closed',      color: 'text-muted-foreground', bg: 'bg-muted' },
};

function OOSCard({ entry }) {
  const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.open;
  const start = entry.start_date ? new Date(entry.start_date) : null;
  const now = new Date();
  const hoursElapsed = start ? Math.round((now - start) / 36e5) : null;

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono font-bold text-foreground">{entry.aircraft_tail || '—'}</p>
          <p className="text-xs text-muted-foreground">{entry.aircraft_type || '—'}</p>
        </div>
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
      </div>

      <p className="text-sm font-semibold text-foreground">{entry.description || 'No description'}</p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-background/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Category</p>
          <p className="font-semibold text-foreground">{entry.category || '—'}</p>
        </div>
        <div className="bg-background/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Station</p>
          <p className="font-semibold text-foreground">{entry.station || '—'}</p>
        </div>
        <div className="bg-background/40 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Time OOS</p>
          <p className={cn('font-semibold', hoursElapsed != null && hoursElapsed > 24 ? 'text-destructive' : 'text-foreground')}>
            {hoursElapsed != null ? `${hoursElapsed}h` : '—'}
          </p>
        </div>
      </div>

      {entry.technician && (
        <p className="text-xs text-muted-foreground">Tech: <span className="text-foreground">{entry.technician}</span></p>
      )}

      {entry.estimated_return && (
        <p className="text-xs text-muted-foreground">Est. Return: <span className="text-foreground font-mono">{entry.estimated_return}</span></p>
      )}

      <Link to={`/OOSDetail?id=${entry.id}`}
        className="block w-full text-center text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg py-2 transition-colors">
        View Details →
      </Link>
    </div>
  );
}

export default function OOSDashboard() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['oos-dashboard'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 100),
    refetchInterval: 30000,
  });

  const filtered = statusFilter === 'all' ? entries : entries.filter(e => e.status === statusFilter);

  const open = entries.filter(e => e.status === 'open').length;
  const inProgress = entries.filter(e => e.status === 'in_progress').length;
  const pendingParts = entries.filter(e => e.status === 'pending_parts').length;
  const released = entries.filter(e => e.status === 'released').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Wrench className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">OOS DASHBOARD</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Fleet-Wide Out of Service · Maintenance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={refetch} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <Link to="/NewOOS" className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5" /> New OOS
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-card border border-destructive/30 px-3 py-3 text-center">
            <p className="text-2xl font-extrabold text-destructive">{open}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </div>
          <div className="rounded-xl bg-card border border-orange-500/30 px-3 py-3 text-center">
            <p className="text-2xl font-extrabold text-orange-400">{inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="rounded-xl bg-card border border-yellow-500/30 px-3 py-3 text-center">
            <p className="text-2xl font-extrabold text-yellow-400">{pendingParts}</p>
            <p className="text-xs text-muted-foreground">Parts Wait</p>
          </div>
          <div className="rounded-xl bg-card border border-green-500/30 px-3 py-3 text-center">
            <p className="text-2xl font-extrabold text-green-400">{released}</p>
            <p className="text-xs text-muted-foreground">Released</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {[
            { key: 'all', label: `All (${entries.length})` },
            { key: 'open', label: 'Open' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'pending_parts', label: 'Parts' },
            { key: 'released', label: 'Released' },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={cn('px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex-1',
                statusFilter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">Loading OOS entries…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No OOS entries {statusFilter !== 'all' ? `with status "${statusFilter}"` : ''}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(e => <OOSCard key={e.id} entry={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}