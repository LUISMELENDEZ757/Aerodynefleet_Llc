import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Satellite, Wifi, WifiOff, RefreshCw, Plus, Signal,
  ArrowDown, ArrowUp, Clock, AlertTriangle, CheckCircle, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  active:    { label: 'Active',    color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  inactive:  { label: 'Inactive',  color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
  suspended: { label: 'Suspended', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  pending:   { label: 'Pending',   color: 'text-primary',    bg: 'bg-primary/15',    border: 'border-primary/30' },
};

function SignalBar({ value, max = 100, color = 'bg-primary' }) {
  return (
    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, unit, color = 'text-primary' }) {
  return (
    <div className="rounded-xl bg-secondary/40 px-3 py-2.5 text-center">
      <Icon className={cn('w-3.5 h-3.5 mx-auto mb-1', color)} />
      <p className={cn('text-base font-extrabold font-mono leading-tight', color)}>{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function TerminalCard({ terminal }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[terminal.activation_status] || STATUS_CFG.pending;
  const signalColor = terminal.signal_quality >= 80 ? 'bg-green-500' : terminal.signal_quality >= 50 ? 'bg-primary' : 'bg-destructive';

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', cfg.border)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
            {terminal.activation_status === 'active'
              ? <Wifi className={cn('w-4 h-4', cfg.color)} />
              : <WifiOff className={cn('w-4 h-4', cfg.color)} />}
          </div>
          <div>
            <p className="text-sm font-mono font-bold text-foreground">{terminal.aircraft_tail}</p>
            <p className="text-xs text-muted-foreground">{terminal.terminal_id} · {terminal.service_plan?.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {terminal.signal_quality != null && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-mono font-bold text-foreground">{terminal.signal_quality}%</p>
              <p className="text-[10px] text-muted-foreground">Signal</p>
            </div>
          )}
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
        </div>
      </button>

      {terminal.signal_quality != null && (
        <div className="px-4 pb-2">
          <SignalBar value={terminal.signal_quality} color={signalColor} />
        </div>
      )}

      {expanded && (
        <div className="border-t border-border/50 px-4 py-3 bg-secondary/10 space-y-3">
          {/* Speed & latency */}
          <div className="grid grid-cols-4 gap-2">
            <StatTile icon={ArrowDown} label="Download"  value={terminal.download_mbps ?? '--'}  unit="Mbps" color="text-green-400" />
            <StatTile icon={ArrowUp}   label="Upload"    value={terminal.upload_mbps ?? '--'}    unit="Mbps" color="text-blue-400" />
            <StatTile icon={Clock}     label="Latency"   value={terminal.latency_ms ?? '--'}     unit="ms"   color={terminal.latency_ms > 50 ? 'text-orange-400' : 'text-primary'} />
            <StatTile icon={Satellite} label="Satellites" value={terminal.satellites_visible ?? '--'} unit="" color="text-purple-400" />
          </div>

          {/* Uptime & obstruction */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Uptime</p>
              <p className="text-sm font-mono font-bold text-green-400">{terminal.uptime_percent != null ? `${terminal.uptime_percent}%` : '—'}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Obstruction</p>
              <p className={cn('text-sm font-mono font-bold', terminal.obstruction_percent > 5 ? 'text-orange-400' : 'text-foreground')}>
                {terminal.obstruction_percent != null ? `${terminal.obstruction_percent}%` : '—'}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {terminal.firmware_version && (
              <div><span className="text-muted-foreground">Firmware: </span><span className="font-mono text-foreground">{terminal.firmware_version}</span></div>
            )}
            {terminal.ip_address && (
              <div><span className="text-muted-foreground">WAN IP: </span><span className="font-mono text-foreground">{terminal.ip_address}</span></div>
            )}
            {terminal.install_date && (
              <div><span className="text-muted-foreground">Installed: </span><span className="text-foreground">{terminal.install_date}</span></div>
            )}
            {terminal.last_seen && (
              <div><span className="text-muted-foreground">Last Seen: </span><span className="text-foreground">{new Date(terminal.last_seen).toLocaleTimeString()}</span></div>
            )}
          </div>

          {terminal.notes && <p className="text-xs text-muted-foreground italic">{terminal.notes}</p>}
          {terminal.demo && <p className="text-[10px] text-primary/60 font-mono">⚡ Demo data — connect Starlink API for live telemetry</p>}
        </div>
      )}
    </div>
  );
}

function NewTerminalModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ aircraft_tail: '', terminal_id: '', kit_serial: '', activation_status: 'pending', service_plan: 'aviation_priority', install_date: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 space-y-3">
        <h2 className="text-sm font-extrabold text-foreground tracking-wide">Register Starlink Terminal</h2>
        {[
          { label: 'Aircraft Tail *', key: 'aircraft_tail', placeholder: 'N455GJ' },
          { label: 'Terminal ID *',   key: 'terminal_id',   placeholder: 'STLK-XXXX-XXXX' },
          { label: 'Kit Serial',      key: 'kit_serial',    placeholder: 'Serial number' },
          { label: 'Install Date',    key: 'install_date',  placeholder: '', type: 'date' },
        ].map(({ label, key, placeholder, type = 'text' }) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground block mb-1">{label}</label>
            <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Status</label>
            <select value={form.activation_status} onChange={e => set('activation_status', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {['active','inactive','suspended','pending'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Service Plan</label>
            <select value={form.service_plan} onChange={e => set('service_plan', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {['aviation_100','aviation_priority','maritime','standard'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 h-9 text-xs font-semibold rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button
            onClick={() => { if (!form.aircraft_tail || !form.terminal_id) return; onCreate(form); }}
            className="flex-1 h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >Register Terminal</button>
        </div>
      </div>
    </div>
  );
}

export default function StarlinkDashboard() {
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: terminals = [], isLoading, refetch } = useQuery({
    queryKey: ['starlink-terminals'],
    queryFn: () => base44.entities.StarlinkTerminal.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const { data: telemetry, isFetching: syncing, refetch: syncTelemetry } = useQuery({
    queryKey: ['starlink-telemetry'],
    queryFn: () => base44.functions.invoke('starlinkStatus', { action: 'fleet_status' }),
    refetchInterval: 60000,
    enabled: terminals.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StarlinkTerminal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['starlink-terminals'] }); setShowNew(false); },
  });

  // Merge live telemetry into terminal records
  const enriched = terminals.map(t => {
    const live = telemetry?.data?.terminals?.find(l => l.terminal_id === t.terminal_id);
    return live ? { ...t, ...live } : t;
  });

  const active = enriched.filter(t => t.activation_status === 'active').length;
  const avgSignal = enriched.filter(t => t.signal_quality).length
    ? Math.round(enriched.filter(t => t.signal_quality).reduce((s, t) => s + t.signal_quality, 0) / enriched.filter(t => t.signal_quality).length)
    : null;
  const isDemo = telemetry?.data?.demo;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Satellite className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">STARLINK</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Aviation Connectivity · Fleet Terminals</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={() => { refetch(); syncTelemetry(); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={cn('w-3 h-3', syncing && 'animate-spin')} /> Sync
            </button>
          </div>
        </div>

        {isDemo && (
          <div className="mt-3 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <p className="text-xs text-primary">Demo mode — set <span className="font-mono font-bold">STARLINK_API_KEY</span> & <span className="font-mono font-bold">STARLINK_ACCOUNT_ID</span> for live data</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-3 mt-3 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-foreground">{terminals.length} Terminals</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/15 text-green-400">{active} Active</span>
          {avgSignal != null && (
            <span className={cn('text-xs font-bold px-3 py-1 rounded-full', avgSignal >= 80 ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400')}>
              Avg Signal {avgSignal}%
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Fleet Terminals</p>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Terminal
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">Loading terminals…</div>
        ) : enriched.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-12 text-center space-y-2">
            <Satellite className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No Starlink terminals registered</p>
            <p className="text-xs text-muted-foreground">Add a terminal to start monitoring connectivity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {enriched.map(t => <TerminalCard key={t.id} terminal={t} />)}
          </div>
        )}
      </div>

      {showNew && <NewTerminalModal onClose={() => setShowNew(false)} onCreate={(d) => createMutation.mutate(d)} />}
    </div>
  );
}