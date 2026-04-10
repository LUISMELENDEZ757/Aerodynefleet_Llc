import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Users, AlertTriangle, Wifi, Satellite, Wrench, DollarSign,
  MessageSquare, Plane, Zap, RefreshCw, Plus, Shield, Activity,
  CheckCircle, Clock, FileCheck, Package, BarChart2, ChevronRight,
  BookOpen, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OpsAlertCreationModal from '@/components/ops/OpsAlertCreationModal';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';

const TODAY = new Date().toISOString().split('T')[0];

const SEVERITY_CFG = {
  critical: { color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  warning:  { color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  info:     { color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
};

function KpiCard({ label, value, color, icon: Icon, onClick, alert }) {
  return (
    <button onClick={onClick}
      className={cn('bg-card border rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-primary/30 transition-all text-left w-full',
        alert ? 'border-red-500/40' : 'border-border')}>
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-black', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {alert && <div className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
    </button>
  );
}

function AlertCard({ alert }) {
  const cfg = SEVERITY_CFG[alert.severity] || SEVERITY_CFG.info;
  return (
    <div className={cn('bg-card border rounded-xl px-4 py-3 flex items-start gap-3', cfg.border)}>
      <AlertTriangle className={cn('w-4 h-4 mt-0.5 flex-shrink-0', cfg.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {alert.aircraft_tail && <span className="text-[10px] font-mono font-bold text-primary">{alert.aircraft_tail}</span>}
          <span className="text-[10px] text-muted-foreground">{new Date(alert.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}Z</span>
          <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>{alert.severity}</span>
        </div>
      </div>
      {alert.action_required && (
        <span className="text-[10px] font-extrabold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg flex-shrink-0">ACTION</span>
      )}
    </div>
  );
}

const TABS = [
  { id: 'overview',     label: 'Overview',      icon: Activity },
  { id: 'maintenance',  label: 'Maintenance',   icon: Wrench },
  { id: 'crew',         label: 'Crew & Ops',    icon: Users },
  { id: 'alerts',       label: 'All Alerts',    icon: AlertTriangle },
  { id: 'compliance',   label: 'Compliance',    icon: Shield },
  { id: 'links',        label: 'Quick Access',  icon: BarChart2 },
];

export default function SupervisorDashboard() {
  const [tab, setTab] = useState('overview');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const pollingInterval = useDynamicPolling(30000, 300000);
  const qc = useQueryClient();

  const { data: flights = [], refetch } = useQuery({
    queryKey: ['sup-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['sup-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: 30000,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['sup-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: mels = [] } = useQuery({
    queryKey: ['sup-mels'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 200),
    select: d => d.filter(m => m.status !== 'cleared' && m.status !== 'voided'),
    refetchInterval: pollingInterval,
  });

  const { data: discrepancies = [] } = useQuery({
    queryKey: ['sup-discrepancies'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }),
    select: d => d.filter(e => e.discrepancy_status !== 'CLOSED'),
    refetchInterval: 30000,
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['sup-ads'],
    queryFn: () => base44.entities.AirworthinessDirective.list('-effective_date', 200),
    select: d => d.filter(a => a.status === 'open' || a.status === 'overdue'),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['sup-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: crsList = [] } = useQuery({
    queryKey: ['sup-crs'],
    queryFn: () => base44.entities.CertificateOfRelease.list('-created_date', 50),
    refetchInterval: 60000,
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['sup-handovers'],
    queryFn: () => base44.entities.ShiftHandover.list('-created_date', 5),
    refetchInterval: 60000,
  });

  const { data: starlink = [] } = useQuery({
    queryKey: ['sup-starlink'],
    queryFn: () => base44.entities.StarlinkTerminal.list(),
    refetchInterval: 30000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['sup-unread'],
    queryFn: () => base44.entities.CommMessage.filter({ is_read: false }),
    refetchInterval: pollingInterval,
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.OpsAlert.update(id, { is_dismissed: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sup-alerts'] }),
  });

  // Derived stats
  const airborne = flights.filter(f => f.status === 'airborne').length;
  const delayed = flights.filter(f => f.delay_minutes > 0).length;
  const illegalCrew = crew.filter(c => c.legal_status === 'illegal').length;
  const overdueADs = ads.filter(a => a.status === 'overdue').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const openDiscrepancies = discrepancies.filter(d => d.discrepancy_status === 'OPEN');
  const inProgressDiscrepancies = discrepancies.filter(d => d.discrepancy_status === 'IN_PROGRESS');
  const pendingCRS = crsList.filter(c => c.status === 'draft' || c.status === 'pending_rii' || c.status === 'pending_supervisor');
  const oosAircraft = aircraft.filter(a => a.status === 'oos');
  const starlinkActive = starlink.filter(s => s.activation_status === 'active').length;

  const melExpiring = mels.filter(m => {
    const limits = { A: 1, B: 3, C: 10, D: 120 };
    if (!m.mel_category || !m.deferred_date) return false;
    const limit = limits[m.mel_category];
    if (!limit) return false;
    const expiry = new Date(new Date(m.deferred_date).getTime() + limit * 86400000);
    return (expiry - new Date()) < 2 * 86400000;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">MCC Supervisor Dashboard</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Shift Command · Regulatory Oversight · Fleet Control</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowAlertModal(true)} className="flex items-center gap-2 px-4 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Alert
            </button>
          </div>
        </div>

        {/* Critical banner */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-2.5 flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm font-extrabold text-red-400">{criticalAlerts.length} CRITICAL ALERT{criticalAlerts.length > 1 ? 'S' : ''} — Immediate action required</p>
            <button onClick={() => setTab('alerts')} className="ml-auto text-xs font-bold text-red-400 border border-red-500/40 px-3 py-1.5 rounded-lg hover:bg-red-500/20">
              View All
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                tab === id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'alerts' && alerts.length > 0 && (
                <span className={cn('text-[9px] font-extrabold px-1.5 py-0.5 rounded-full',
                  tab === id ? 'bg-white/20' : 'bg-red-600 text-white')}>{alerts.length}</span>
              )}
              {id === 'maintenance' && openDiscrepancies.length > 0 && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-600 text-white">{openDiscrepancies.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-5 max-w-5xl mx-auto">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Flight Operations</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard icon={Plane} label="Airborne" value={airborne} color={airborne > 0 ? 'text-green-400' : 'text-muted-foreground'} onClick={() => {}} />
                <KpiCard icon={AlertTriangle} label="Delays" value={delayed} color={delayed > 0 ? 'text-orange-400' : 'text-muted-foreground'} alert={delayed > 0} onClick={() => {}} />
                <KpiCard icon={Users} label="Illegal Crew" value={illegalCrew} color={illegalCrew > 0 ? 'text-red-400' : 'text-muted-foreground'} alert={illegalCrew > 0} onClick={() => setTab('crew')} />
                <KpiCard icon={Wrench} label="OOS Aircraft" value={oosAircraft.length} color={oosAircraft.length > 0 ? 'text-orange-400' : 'text-muted-foreground'} alert={oosAircraft.length > 0} onClick={() => setTab('maintenance')} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Maintenance Status</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard icon={AlertTriangle} label="Open Discrepancies" value={openDiscrepancies.length} color={openDiscrepancies.length > 0 ? 'text-red-400' : 'text-green-400'} alert={openDiscrepancies.length > 0} onClick={() => setTab('maintenance')} />
                <KpiCard icon={Activity} label="In Progress" value={inProgressDiscrepancies.length} color="text-amber-400" onClick={() => setTab('maintenance')} />
                <KpiCard icon={Zap} label="Open/Overdue ADs" value={ads.length} color={overdueADs > 0 ? 'text-red-400' : 'text-amber-400'} alert={overdueADs > 0} onClick={() => setTab('compliance')} />
                <KpiCard icon={FileCheck} label="Pending CRS" value={pendingCRS.length} color={pendingCRS.length > 0 ? 'text-amber-400' : 'text-green-400'} onClick={() => setTab('compliance')} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Comms & Connectivity</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard icon={Satellite} label="Starlink Active" value={starlinkActive} color="text-blue-400" onClick={() => {}} />
                <KpiCard icon={MessageSquare} label="Unread Comms" value={messages.length} color={messages.length > 0 ? 'text-primary' : 'text-muted-foreground'} onClick={() => {}} />
                <KpiCard icon={Shield} label="MEL Expiring" value={melExpiring.length} color={melExpiring.length > 0 ? 'text-red-400' : 'text-green-400'} alert={melExpiring.length > 0} onClick={() => setTab('compliance')} />
                <KpiCard icon={Radio} label="Active Alerts" value={alerts.length} color={criticalAlerts.length > 0 ? 'text-red-400' : alerts.length > 0 ? 'text-amber-400' : 'text-muted-foreground'} alert={criticalAlerts.length > 0} onClick={() => setTab('alerts')} />
              </div>
            </div>

            {/* Latest handover */}
            {handovers[0] && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Latest Shift Handover</p>
                  <Link to="/ShiftHandover" className="text-xs text-primary hover:underline">All Handovers →</Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                    handovers[0].status === 'acknowledged' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400')}>
                    {handovers[0].status?.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-foreground">{handovers[0].submitted_by}</span>
                  <span className="text-xs text-muted-foreground capitalize">{handovers[0].shift_period} — {handovers[0].shift_date}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{handovers[0].progress_summary}</p>
                {handovers[0].safety_critical_notes && (
                  <div className="bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 font-bold">
                    ⚠ {handovers[0].safety_critical_notes}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* MAINTENANCE TAB */}
        {tab === 'maintenance' && (
          <div className="space-y-4">
            {oosAircraft.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-4 py-3">
                <p className="text-xs font-extrabold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> OOS Aircraft</p>
                <div className="flex flex-wrap gap-2">
                  {oosAircraft.map(a => (
                    <span key={a.id} className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-red-800/40 border border-red-500/30 text-red-300">
                      {a.tail_number} · {a.aircraft_type} · {a.base_station || '—'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Open Discrepancies ({openDiscrepancies.length})</p>
                <Link to="/TechOpsLogbook" className="text-xs text-primary hover:underline">Full Logbook →</Link>
              </div>
              {openDiscrepancies.length === 0 ? (
                <div className="bg-card border border-border rounded-xl py-8 text-center text-muted-foreground text-sm">All clear</div>
              ) : openDiscrepancies.slice(0, 8).map(e => (
                <div key={e.id} className="bg-card border border-red-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-primary">{e.aircraft_tail}</span>
                    {e.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {e.ata_chapter}</span>}
                    {e.log_page && <span className="text-[10px] font-mono text-sky-400">{e.log_page}</span>}
                  </div>
                  <p className="text-sm text-foreground leading-snug">{e.description?.split('\n')[0].slice(0, 100)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{e.technician_name ? `Tech: ${e.technician_name}` : 'Unassigned'} · {new Date(e.created_date).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Open MEL Items ({mels.length})</p>
              {mels.slice(0, 5).map(m => (
                <div key={m.id} className={cn('bg-card border rounded-xl px-4 py-3', melExpiring.find(x => x.id === m.id) ? 'border-red-500/40' : 'border-border')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-600 text-white">Cat {m.mel_category}</span>
                      <span className="text-xs font-mono text-primary">{m.aircraft_tail || m.tail_number || '—'}</span>
                    </div>
                    {melExpiring.find(x => x.id === m.id) && (
                      <span className="text-[10px] font-extrabold text-red-400">⚠ EXPIRING</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground mt-1">{m.mel_reference || m.title || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">{m.deferred_date ? `Deferred: ${m.deferred_date}` : ''}</p>
                </div>
              ))}
              {mels.length > 5 && <Link to="/MEL" className="text-xs text-primary hover:underline block text-center">+ {mels.length - 5} more MEL items</Link>}
            </div>
          </div>
        )}

        {/* CREW & OPS TAB */}
        {tab === 'crew' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-2xl px-4 py-4 text-center">
                <p className="text-3xl font-black text-green-400">{flights.filter(f => f.status === 'airborne').length}</p>
                <p className="text-xs text-muted-foreground">Airborne</p>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-4 text-center">
                <p className="text-3xl font-black text-amber-400">{delayed}</p>
                <p className="text-xs text-muted-foreground">Delayed</p>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-4 text-center">
                <p className={cn('text-3xl font-black', illegalCrew > 0 ? 'text-red-400' : 'text-green-400')}>{illegalCrew}</p>
                <p className="text-xs text-muted-foreground">Illegal Crew</p>
              </div>
            </div>
            {flights.slice(0, 10).map(f => (
              <div key={f.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={cn('w-2 h-10 rounded-full flex-shrink-0',
                  f.status === 'airborne' ? 'bg-green-500' :
                  f.delay_minutes > 0 ? 'bg-amber-500' : 'bg-blue-500')} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{f.flight_number}</p>
                  <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.aircraft_tail || '—'}</p>
                </div>
                <div className="text-right">
                  <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                    f.status === 'airborne' ? 'bg-green-500/15 text-green-400' :
                    f.delay_minutes > 0 ? 'bg-amber-500/15 text-amber-400' :
                    'bg-blue-500/15 text-blue-400')}>
                    {f.status?.toUpperCase()}
                  </span>
                  {f.delay_minutes > 0 && <p className="text-[10px] text-amber-400 mt-0.5">+{f.delay_minutes}m</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALL ALERTS TAB */}
        {tab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold">No active alerts</p>
              </div>
            ) : alerts.map(a => (
              <div key={a.id} className="relative">
                <AlertCard alert={a} />
                <button
                  onClick={() => dismissMutation.mutate(a.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Dismiss">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {tab === 'compliance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-2xl px-4 py-4 text-center">
                <p className={cn('text-3xl font-black', overdueADs > 0 ? 'text-red-400' : 'text-green-400')}>{overdueADs}</p>
                <p className="text-xs text-muted-foreground">Overdue ADs</p>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-4 text-center">
                <p className={cn('text-3xl font-black', pendingCRS.length > 0 ? 'text-amber-400' : 'text-green-400')}>{pendingCRS.length}</p>
                <p className="text-xs text-muted-foreground">Pending CRS</p>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-4 text-center">
                <p className={cn('text-3xl font-black', melExpiring.length > 0 ? 'text-red-400' : 'text-green-400')}>{melExpiring.length}</p>
                <p className="text-xs text-muted-foreground">MEL Expiring</p>
              </div>
            </div>

            {ads.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Open / Overdue ADs</p>
                  <Link to="/ADTracking" className="text-xs text-primary hover:underline">Full AD Register →</Link>
                </div>
                {ads.slice(0, 5).map(ad => (
                  <div key={ad.id} className={cn('bg-card border rounded-xl px-4 py-3', ad.status === 'overdue' ? 'border-red-500/40' : 'border-amber-500/20')}>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', ad.status === 'overdue' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400')}>
                        {ad.status?.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground">{ad.ad_number}</span>
                      <span className="text-xs font-mono text-primary">{ad.aircraft_tail}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{ad.title}</p>
                    {ad.compliance_due_date && <p className="text-[10px] text-muted-foreground">Due: {ad.compliance_due_date}</p>}
                  </div>
                ))}
              </div>
            )}

            {pendingCRS.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Pending CRS Sign-Off</p>
                  <Link to="/CRS" className="text-xs text-primary hover:underline">Full CRS Log →</Link>
                </div>
                {pendingCRS.slice(0, 5).map(crs => (
                  <div key={crs.id} className="bg-card border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{crs.crs_number || `CRS-${crs.id?.slice(-6)}`} · {crs.aircraft_tail}</p>
                      <p className="text-xs text-muted-foreground">{crs.status?.replace(/_/g, ' ').toUpperCase()} · {crs.maintenance_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <Link to="/CRS" className="text-xs font-bold text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10">
                      Sign
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUICK ACCESS TAB */}
        {tab === 'links' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: '🔧 Crew Chief', path: '/CrewChief', color: 'border-orange-500/30 text-orange-400' },
              { label: '📋 E-Logbook', path: '/TechOpsLogbook', color: 'border-primary/30 text-primary' },
              { label: '⚡ MEL Dashboard', path: '/MEL', color: 'border-amber-500/30 text-amber-400' },
              { label: '🛡 AD Tracking', path: '/ADTracking', color: 'border-blue-500/30 text-blue-400' },
              { label: '📄 CRS Documents', path: '/CRS', color: 'border-green-500/30 text-green-400' },
              { label: '🔒 Signature Audit', path: '/SignatureAudit', color: 'border-violet-500/30 text-violet-400' },
              { label: '🏭 Maintenance Control', path: '/MaintenanceControl', color: 'border-orange-500/30 text-orange-400' },
              { label: '📦 Parts Supply', path: '/PartsSupply', color: 'border-purple-500/30 text-purple-400' },
              { label: '🛠 Tooling', path: '/ToolingManagement', color: 'border-cyan-500/30 text-cyan-400' },
              { label: '✈ Fleet Status', path: '/FleetDashboard', color: 'border-primary/30 text-primary' },
              { label: '🔄 Shift Handover', path: '/ShiftHandover', color: 'border-teal-500/30 text-teal-400' },
              { label: '👥 Crew Control', path: '/CrewControl', color: 'border-green-500/30 text-green-400' },
              { label: '🌐 Ops Center', path: '/OpsCenter', color: 'border-primary/30 text-primary' },
              { label: '📡 Comm Center', path: '/CommCenter', color: 'border-blue-500/30 text-blue-400' },
              { label: '🌩 IROPS', path: '/IROPS', color: 'border-red-500/30 text-red-400' },
            ].map(item => (
              <Link key={item.path} to={item.path}
                className={cn('bg-card border rounded-xl px-4 py-3 text-sm font-bold hover:bg-secondary/50 transition-all flex items-center justify-between', item.color)}>
                {item.label}
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <OpsAlertCreationModal open={showAlertModal} onClose={() => setShowAlertModal(false)} />
    </div>
  );
}