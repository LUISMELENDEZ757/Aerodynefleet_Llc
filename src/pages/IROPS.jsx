import { useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Zap, Cloud, Wrench, Users, RefreshCw,
  ChevronDown, ChevronRight, Plus, CheckCircle, Clock,
  TrendingDown, DollarSign, User, ArrowRight, X, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import IROPSRecoveryAI from '@/components/irops/IROPSRecoveryAI';
import IROPSDominoes from '@/components/irops/IROPSDominoes';
import NewIROPSModal from '@/components/irops/NewIROPSModal';

const TODAY = new Date().toISOString().split('T')[0];

const TYPE_CFG = {
  weather:  { icon: Cloud,          color: 'text-blue-400',      bg: 'bg-blue-500/15',      border: 'border-blue-500/30',      label: 'Weather' },
  mx:       { icon: Wrench,         color: 'text-orange-400',    bg: 'bg-orange-500/15',    border: 'border-orange-500/30',    label: 'Maintenance' },
  crew:     { icon: Users,          color: 'text-purple-400',    bg: 'bg-purple-500/15',    border: 'border-purple-500/30',    label: 'Crew' },
  atc:      { icon: Zap,            color: 'text-yellow-400',    bg: 'bg-yellow-500/15',    border: 'border-yellow-500/30',    label: 'ATC' },
  security: { icon: AlertTriangle,  color: 'text-red-400',       bg: 'bg-red-500/15',       border: 'border-red-500/30',       label: 'Security' },
  gate:     { icon: ArrowRight,     color: 'text-cyan-400',      bg: 'bg-cyan-500/15',      border: 'border-cyan-500/30',      label: 'Gate' },
  other:    { icon: AlertTriangle,  color: 'text-muted-foreground', bg: 'bg-muted',          border: 'border-border',           label: 'Other' },
};

const SEV_CFG = {
  minor:    { color: 'text-blue-400',       bg: 'bg-blue-500/15' },
  moderate: { color: 'text-orange-400',     bg: 'bg-orange-500/15' },
  major:    { color: 'text-red-400',        bg: 'bg-red-500/15' },
  critical: { color: 'text-destructive',    bg: 'bg-destructive/15' },
};

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function IROPSCard({ event, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const cfg = TYPE_CFG[event.event_type] || TYPE_CFG.other;
  const sev = SEV_CFG[event.severity] || SEV_CFG.moderate;
  const TypeIcon = cfg.icon;

  return (
    <div className={cn('rounded-xl bg-card border overflow-hidden', sev.bg.replace('/15', '/5'), 'border-border')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
            <TypeIcon className={cn('w-4 h-4', cfg.color)} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {cfg.label}
              {event.affected_station && ` · ${event.affected_station}`}
              {event.pax_impacted > 0 && ` · ${event.pax_impacted} PAX`}
              {event.affected_flights?.length > 0 && ` · ${event.affected_flights.length} flt${event.affected_flights.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', sev.bg, sev.color)}>
            {event.severity?.toUpperCase()}
          </span>
          <span className={cn('text-xs font-semibold px-2 py-1 rounded-full',
            event.status === 'resolved' ? 'bg-green-500/15 text-green-400' :
            event.status === 'monitoring' ? 'bg-primary/15 text-primary' :
            'bg-destructive/15 text-destructive'
          )}>
            {event.status}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-4">
          {event.description && (
            <p className="text-sm text-foreground/80">{event.description}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {event.affected_flights?.length > 0 && (
              <div className="bg-background/40 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Flights</p>
                <p className="text-lg font-mono font-bold text-destructive">{event.affected_flights.length}</p>
              </div>
            )}
            {event.pax_impacted > 0 && (
              <div className="bg-background/40 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">PAX</p>
                <p className="text-lg font-mono font-bold text-orange-400">{event.pax_impacted}</p>
              </div>
            )}
            {event.cost_impact > 0 && (
              <div className="bg-background/40 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Est. Cost</p>
                <p className="text-lg font-mono font-bold text-yellow-400">${(event.cost_impact / 1000).toFixed(0)}K</p>
              </div>
            )}
          </div>

          {/* Affected flights */}
          {event.affected_flights?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Affected Flights</p>
              <div className="flex flex-wrap gap-1.5">
                {event.affected_flights.map(f => (
                  <span key={f} className="text-xs font-mono bg-secondary px-2.5 py-1 rounded-lg text-foreground">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recovery actions */}
          {event.recovery_actions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recovery Actions</p>
              <div className="space-y-1.5">
                {event.recovery_actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 bg-background/40 rounded-lg px-3 py-2">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                      a.status === 'done' ? 'bg-green-400' :
                      a.status === 'in_progress' ? 'bg-primary' : 'bg-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{a.action}</p>
                      {a.flight && <p className="text-xs text-muted-foreground">{a.flight} {a.assigned_to && `· ${a.assigned_to}`}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI + Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAI(!showAI)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
            >
              <Brain className="w-3.5 h-3.5" />
              AI Recovery Plan
            </button>
            {event.status !== 'resolved' && (
              <button
                onClick={() => onResolve(event.id)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark Resolved
              </button>
            )}
          </div>

          {showAI && (
            <IROPSRecoveryAI event={event} />
          )}
        </div>
      )}
    </div>
  );
}

export default function IROPS() {
  const [activeTab, setActiveTab] = useState('active');
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['irops-events'],
    queryFn: () => base44.entities.IROPSEvent.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const { data: flights = [] } = useQuery({
    queryKey: ['irops-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => base44.entities.IROPSEvent.update(id, { status: 'resolved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['irops-events'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.IROPSEvent.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['irops-events'] }); setShowNew(false); },
  });

  const active = events.filter(e => e.status === 'active');
  const monitoring = events.filter(e => e.status === 'monitoring');
  const resolved = events.filter(e => e.status === 'resolved');

  const totalPax = active.reduce((s, e) => s + (e.pax_impacted || 0), 0);
  const totalCost = active.reduce((s, e) => s + (e.cost_impact || 0), 0);
  const totalFlights = new Set(active.flatMap(e => e.affected_flights || [])).size;

  const filtered = activeTab === 'active' ? active : activeTab === 'monitoring' ? monitoring : resolved;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0 hover:bg-destructive/30 transition-colors">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">IROPS CENTER</h1>
              <p className="text-xs font-mono text-destructive tracking-widest uppercase">Irregular Ops · Recovery · AI Assist</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={refetch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {active.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-destructive/15 border border-destructive/30 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm font-bold text-destructive">
              {active.length} ACTIVE IROPS EVENT{active.length > 1 ? 'S' : ''} — IMMEDIATE ACTION REQUIRED
            </p>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon={AlertTriangle} label="Active Events"   value={active.length}    color={active.length > 0 ? 'text-destructive' : 'text-muted-foreground'} />
          <StatTile icon={Clock}         label="Monitoring"      value={monitoring.length} color="text-orange-400" />
          <StatTile icon={Users}         label="PAX Impacted"    value={totalPax}          color={totalPax > 0 ? 'text-orange-400' : 'text-muted-foreground'} />
          <StatTile icon={DollarSign}    label="Est. Cost"       value={totalCost > 0 ? `$${(totalCost/1000).toFixed(0)}K` : '$0'} color="text-yellow-400" />
        </div>

        {/* Domino effect visualization */}
        {flights.length > 0 && active.length > 0 && (
          <IROPSDominoes events={active} flights={flights} />
        )}

        {/* Tabs + New button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {[
              { key: 'active',     label: `Active (${active.length})` },
              { key: 'monitoring', label: `Monitor (${monitoring.length})` },
              { key: 'resolved',   label: `Resolved (${resolved.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >{t.label}</button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Event
          </button>
        </div>

        {/* Events list */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">
              {activeTab === 'active' ? 'No active IROPS events' : activeTab === 'monitoring' ? 'No events under monitoring' : 'No resolved events'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All operations normal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(event => (
              <IROPSCard key={event.id} event={event} onResolve={(id) => resolveMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewIROPSModal
          flights={flights}
          onClose={() => setShowNew(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}