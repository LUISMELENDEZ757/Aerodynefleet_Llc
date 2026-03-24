import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  FileText, Shield, RefreshCw, Search, Filter, AlertTriangle,
  Info, Zap, User, Clock, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULE_COLORS = {
  dispatch: 'text-primary bg-primary/15',
  crew:     'text-purple-400 bg-purple-500/15',
  mx:       'text-orange-400 bg-orange-500/15',
  flight:   'text-blue-400 bg-blue-500/15',
  irops:    'text-destructive bg-destructive/15',
  fuel:     'text-yellow-400 bg-yellow-500/15',
  safety:   'text-red-400 bg-red-500/15',
  efb:      'text-green-400 bg-green-500/15',
  system:   'text-muted-foreground bg-muted',
};

const SEV_CFG = {
  info:     { icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  warning:  { icon: AlertTriangle, color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  critical: { icon: Zap,           color: 'text-destructive', bg: 'bg-destructive/10' },
};

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_CFG[log.severity] || SEV_CFG.info;
  const SevIcon = sev.icon;
  const modClass = MODULE_COLORS[log.module] || MODULE_COLORS.system;

  const ts = log.created_date
    ? new Date(log.created_date).toLocaleString('en-US', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      })
    : '--';

  return (
    <div className={cn('border-b border-border/50 last:border-0', sev.bg)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
      >
        <SevIcon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', sev.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', modClass)}>
              {log.module?.toUpperCase()}
            </span>
            <span className="text-xs font-mono text-muted-foreground">{log.action}</span>
            {log.flight_number && (
              <span className="text-xs font-mono text-primary">{log.flight_number}</span>
            )}
          </div>
          <p className="text-xs text-foreground mt-0.5 truncate">{log.details}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{ts}</span>
          <span className="text-xs text-muted-foreground">{log.actor_name}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 ml-6 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {log.actor_role && (
              <div><span className="text-muted-foreground">Role: </span><span className="text-foreground">{log.actor_role}</span></div>
            )}
            {log.entity_type && (
              <div><span className="text-muted-foreground">Entity: </span><span className="text-foreground font-mono">{log.entity_type} #{log.entity_id?.slice(-6)}</span></div>
            )}
            {log.aircraft_tail && (
              <div><span className="text-muted-foreground">Aircraft: </span><span className="text-foreground font-mono">{log.aircraft_tail}</span></div>
            )}
          </div>
          {(log.before_value || log.after_value) && (
            <div className="grid grid-cols-2 gap-2">
              {log.before_value && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Before</p>
                  <pre className="text-xs bg-background/60 rounded px-2 py-1.5 text-foreground overflow-x-auto">{log.before_value}</pre>
                </div>
              )}
              {log.after_value && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">After</p>
                  <pre className="text-xs bg-background/60 rounded px-2 py-1.5 text-primary overflow-x-auto">{log.after_value}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const filtered = logs.filter(l => {
    const matchMod = moduleFilter === 'all' || l.module === moduleFilter;
    const matchSev = sevFilter === 'all' || l.severity === sevFilter;
    const matchSearch = !search ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.flight_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase());
    return matchMod && matchSev && matchSearch;
  });

  const critical = logs.filter(l => l.severity === 'critical').length;
  const warning = logs.filter(l => l.severity === 'warning').length;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Shield className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">AUDIT LOG</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Immutable Ops Trail · FAA Compliance</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={refetch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-muted-foreground">{logs.length} total entries</span>
          {critical > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full bg-destructive/15 text-destructive">{critical} critical</span>}
          {warning > 0 && <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/15 text-orange-400">{warning} warnings</span>}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Search & filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs…"
              className="w-full h-9 bg-card border border-border rounded-xl pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="h-9 bg-card border border-border rounded-xl px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Modules</option>
            {['dispatch','crew','mx','flight','irops','fuel','safety','efb','system'].map(m => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
          <select
            value={sevFilter}
            onChange={e => setSevFilter(e.target.value)}
            className="h-9 bg-card border border-border rounded-xl px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Log table */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-2 bg-secondary/60 border-b border-border flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              {filtered.length} entries
            </p>
            <p className="text-xs text-muted-foreground">Click row to expand</p>
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground p-4">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">No log entries match your filters</p>
          ) : (
            <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {filtered.map(log => <LogRow key={log.id} log={log} />)}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          All audit entries are immutable. Tampering is logged automatically.
        </p>
      </div>
    </div>
  );
}