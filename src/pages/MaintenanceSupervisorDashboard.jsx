import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Wrench, ChevronLeft, AlertTriangle, CheckCircle, Clock, Users,
  Package, RefreshCw, Plus, Shield, Activity, MapPin,
  FileCheck, BookOpen, ChevronRight, Send, X, Zap,
  BarChart2, RotateCcw, Plane
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import TasksModule from '@/components/mxsup/TasksModule';
import StationComplianceWidget from '@/components/mxsup/StationComplianceWidget';

const TODAY = new Date().toISOString().split('T')[0];

const STATIONS = ['All Stations','KEWR','KJFK','KLAX','KORD','KDFW','KATL','KMIA','KSFO','KBOS','KDEN','KPHX','KIAH','KLAS','KMCO'];

const STATUS_CFG = {
  OPEN:        { label: 'OPEN',         color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/10',    dot: 'bg-red-500' },
  IN_PROGRESS: { label: 'IN PROGRESS',  color: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-500/10',  dot: 'bg-amber-500' },
  PENDING_RII: { label: 'PENDING RII',  color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10', dot: 'bg-violet-500' },
  CLOSED:      { label: 'CLOSED',       color: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-500/10',  dot: 'bg-green-500' },
};

const PRIORITY_CFG = {
  aog:    { label: 'AOG',  bg: 'bg-red-700',    color: 'text-red-300' },
  high:   { label: 'HIGH', bg: 'bg-orange-600', color: 'text-orange-300' },
  medium: { label: 'MED',  bg: 'bg-amber-600',  color: 'text-amber-300' },
  low:    { label: 'LOW',  bg: 'bg-gray-600',   color: 'text-gray-300' },
};

function KpiCard({ label, value, color, icon: Icon, alert, sub }) {
  return (
    <div className={cn('bg-card border rounded-2xl px-4 py-4 flex items-center gap-3', alert ? 'border-red-500/40' : 'border-border')}>
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-black', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
      {alert && <div className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
    </div>
  );
}

function AssignModal({ entry, onClose, onConfirm }) {
  const [tech, setTech] = useState(entry.technician_name || '');
  const [cert, setCert] = useState(entry.technician_id || '');
  const [bay, setBay] = useState('');
  const [eta, setEta] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tech) return;
    onConfirm(entry.id, { tech, cert, bay, eta });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-extrabold text-foreground text-sm">Assign / Reassign Work</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="bg-secondary/50 rounded-xl px-3 py-2 text-xs">
            <p className="font-bold text-primary">{entry.aircraft_tail} {entry.station ? `· ${entry.station}` : ''}</p>
            <p className="text-muted-foreground truncate mt-0.5">{entry.description?.split('\n')[0].slice(0, 80)}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Technician *</label>
            <input required value={tech} onChange={e => setTech(e.target.value)} placeholder="Full name"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">A&P Cert / License #</label>
            <input value={cert} onChange={e => setCert(e.target.value)} placeholder="e.g. AMT-12345"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Bay / Position</label>
              <input value={bay} onChange={e => setBay(e.target.value)} placeholder="e.g. Bay 3"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">ETA (UTC)</label>
              <input value={eta} onChange={e => setEta(e.target.value)} placeholder="e.g. 16:30Z"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReopenModal({ entry, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(entry.id, reason);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-extrabold text-foreground text-sm">Reopen Discrepancy</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Reason *</label>
            <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="State reason for reopening…"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-extrabold hover:bg-orange-500 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reopen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkCard({ entry, onAssign, onClose, onReopen, showReopen }) {
  const status = entry.discrepancy_status || 'OPEN';
  const cfg = STATUS_CFG[status] || STATUS_CFG.OPEN;
  const priority = entry.notes?.match(/Priority: (\w+)/)?.[1]?.toLowerCase() || 'medium';
  const priCfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  const hoursOpen = ((Date.now() - new Date(entry.created_date)) / 3600000).toFixed(1);
  const isStale = parseFloat(hoursOpen) > 4 && status === 'OPEN';

  return (
    <div className={cn('bg-card border rounded-2xl p-4 space-y-2 mb-2', isStale ? 'border-red-500/50' : cfg.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-[9px] font-extrabold px-2 py-0.5 rounded text-white', priCfg.bg)}>{priCfg.label}</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
            <span className="text-xs font-mono font-bold text-primary">{entry.aircraft_tail}</span>
            {entry.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {entry.ata_chapter}</span>}
            {entry.log_page && <span className="text-[10px] font-mono text-sky-400">{entry.log_page}</span>}
            {entry.station && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{entry.station}</span>}
          </div>
          <p className="text-sm text-foreground leading-snug">{entry.description?.replace('[LINE MX]','').split('\n')[0].trim()}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
            {entry.technician_name
              ? <span className="flex items-center gap-1 text-cyan-400"><Users className="w-2.5 h-2.5" />{entry.technician_name} {entry.technician_id ? `· ${entry.technician_id}` : ''}</span>
              : <span className="text-red-400">⚠ Unassigned</span>}
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{hoursOpen}h open</span>
            {isStale && <span className="text-red-400 font-bold">STALE — action needed</span>}
          </div>
        </div>
        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1', cfg.dot)} />
      </div>

      <div className="flex gap-2 pt-1 flex-wrap">
        {(status === 'OPEN' || status === 'IN_PROGRESS') && (
          <button onClick={() => onAssign(entry)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-1">
            <Users className="w-3 h-3" /> {entry.technician_name ? 'Reassign' : 'Assign'}
          </button>
        )}
        {status === 'IN_PROGRESS' && (
          <button onClick={() => onClose(entry.id)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Close
          </button>
        )}
        {showReopen && status === 'CLOSED' && (
          <button onClick={() => onReopen(entry)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Reopen
          </button>
        )}
        <Link to="/TechOpsLogbook" className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Logbook
        </Link>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview',  label: 'Overview',          icon: BarChart2 },
  { id: 'tasks',     label: 'Tasks',             icon: CheckCircle },
  { id: 'active',    label: 'Active Work',       icon: Activity },
  { id: 'closed',    label: 'Closed Today',      icon: CheckCircle },
  { id: 'faults',    label: 'Faults & MEL',     icon: Zap },
  { id: 'parts',     label: 'Parts & Tools',    icon: Package },
  { id: 'handover',  label: 'Shift Turnover',   icon: Users },
];

export default function MaintenanceSupervisorDashboard() {
  const [tab, setTab] = useState('overview');
  const [station, setStation] = useState('All Stations');
  const [assignEntry, setAssignEntry] = useState(null);
  const [reopenEntry, setReopenEntry] = useState(null);
  const qc = useQueryClient();

  const stationFilter = station === 'All Stations' ? null : station;

  const { data: allDiscrepancies = [], isLoading, refetch } = useQuery({
    queryKey: ['mxsup-disc'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }),
    refetchInterval: 30000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['mxsup-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['mxsup-faults'],
    queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }),
    refetchInterval: 30000,
  });

  const { data: mels = [] } = useQuery({
    queryKey: ['mxsup-mels'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 200),
    select: d => d.filter(m => m.status !== 'cleared' && m.status !== 'voided'),
    refetchInterval: 60000,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['mxsup-inventory'],
    queryFn: () => base44.entities.InventoryItem.list('part_number', 300),
    refetchInterval: 60000,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['mxsup-tools'],
    queryFn: () => base44.entities.Tool.list('tool_number', 200),
    refetchInterval: 60000,
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['mxsup-handovers'],
    queryFn: () => base44.entities.ShiftHandover.list('-created_date', 10),
    refetchInterval: 60000,
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['mxsup-ads'],
    queryFn: () => base44.entities.AirworthinessDirective.filter({ status: 'overdue' }),
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LogbookEntry.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mxsup-disc'] }),
  });

  const handoverMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShiftHandover.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mxsup-handovers'] }),
  });

  // Station-scoped data
  const stationAircraft = stationFilter ? aircraft.filter(a => a.base_station === stationFilter) : aircraft;
  const stationTails = new Set(stationAircraft.map(a => a.tail_number));

  const discrepancies = allDiscrepancies.filter(e =>
    !stationFilter || e.station === stationFilter || stationTails.has(e.aircraft_tail)
  );

  const open = discrepancies.filter(d => d.discrepancy_status === 'OPEN');
  const inProgress = discrepancies.filter(d => d.discrepancy_status === 'IN_PROGRESS');
  const pendingRii = discrepancies.filter(d => d.discrepancy_status === 'PENDING_RII');
  const closedToday = discrepancies.filter(d =>
    d.discrepancy_status === 'CLOSED' && d.updated_date?.startsWith(TODAY)
  );
  const activeWork = [...open, ...inProgress, ...pendingRii];

  const stationFaults = faults.filter(f => !stationFilter || stationTails.has(f.aircraft_tail));
  const stationMels = mels.filter(m => !stationFilter || stationTails.has(m.aircraft_tail || m.tail_number));
  const stationInventory = inventory.filter(i => !stationFilter || i.station === stationFilter);
  const stationTools = tools.filter(t => !stationFilter || t.location?.includes(stationFilter));
  const stationAds = ads.filter(a => !stationFilter || stationTails.has(a.aircraft_tail));

  const oosAircraft = stationAircraft.filter(a => a.status === 'oos');
  const inMaintenance = stationAircraft.filter(a => a.status === 'maintenance');
  const lowStock = stationInventory.filter(i => i.quantity_on_hand <= i.min_quantity);
  const outOfStock = stationInventory.filter(i => i.quantity_on_hand === 0);
  const calDue = stationTools.filter(t => t.status === 'calibration_due');
  const toolsOut = stationTools.filter(t => t.status === 'checked_out');
  const unassigned = open.filter(d => !d.technician_name);
  const staleOpen = open.filter(d => (Date.now() - new Date(d.created_date)) > 4 * 3600000);

  const handleAssign = (entryId, { tech, cert, bay, eta }) => {
    updateMutation.mutate({
      id: entryId,
      data: {
        discrepancy_status: 'IN_PROGRESS',
        technician_name: tech,
        technician_id: cert,
        work_started_at: new Date().toISOString(),
        notes: `Bay: ${bay || '—'} | ETA: ${eta || '—'}`,
      }
    });
  };

  const handleClose = (id) => {
    updateMutation.mutate({
      id,
      data: { discrepancy_status: 'CLOSED', is_cleared: true, cleared_date: TODAY, work_completed_at: new Date().toISOString() }
    });
  };

  const handleReopen = (id, reason) => {
    updateMutation.mutate({
      id,
      data: { discrepancy_status: 'OPEN', is_cleared: false, reopen_reason: reason, reopened_at: new Date().toISOString(), reopened_by: 'Maintenance Supervisor' }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Maintenance Supervisor</h1>
              <p className="text-xs text-cyan-400 tracking-widest uppercase">Line & Hangar Ops · Station Control</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LiveClock />
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <Link to="/TechOpsLogbook" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
              <BookOpen className="w-3.5 h-3.5" /> Logbook
            </Link>
          </div>
        </div>

        {/* Station Selector */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <select value={station} onChange={e => setStation(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary font-bold">
            {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-xl border border-border">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-green-400">LIVE</span>
          </div>
        </div>

        {/* Critical banners */}
        {(unassigned.length > 0 || staleOpen.length > 0 || stationAds.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {unassigned.length > 0 && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-1.5 text-xs text-red-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> {unassigned.length} unassigned
              </div>
            )}
            {staleOpen.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" /> {staleOpen.length} stale (&gt;4h open)
              </div>
            )}
            {stationAds.length > 0 && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-1.5 text-xs text-red-400 font-bold">
                <Shield className="w-3.5 h-3.5" /> {stationAds.length} overdue AD{stationAds.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                tab === id ? 'bg-cyan-600 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'active' && activeWork.length > 0 && (
                <span className={cn('text-[9px] font-extrabold px-1.5 py-0.5 rounded-full', tab === id ? 'bg-white/20' : 'bg-red-600 text-white')}>
                  {activeWork.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-5xl mx-auto">

        {/* TASKS TAB */}
        {tab === 'tasks' && (
          <TasksModule 
            allDiscrepancies={discrepancies}
            mels={stationMels}
            ads={stationAds}
            aircraft={stationAircraft}
            stationFilter={stationFilter}
          />
        )}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Open Tasks"    value={open.length}        color={open.length > 0 ? 'text-red-400' : 'text-green-400'}    icon={AlertTriangle} alert={open.length > 0} />
              <KpiCard label="In Progress"   value={inProgress.length}  color="text-amber-400"                                          icon={Activity} />
              <KpiCard label="Pending RII"   value={pendingRii.length}  color="text-violet-400"                                         icon={Shield} />
              <KpiCard label="Closed Today"  value={closedToday.length} color="text-green-400"                                          icon={CheckCircle} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="OOS Aircraft"  value={oosAircraft.length}   color={oosAircraft.length > 0 ? 'text-red-400' : 'text-green-400'} icon={Plane} alert={oosAircraft.length > 0} />
              <KpiCard label="In Maintenance" value={inMaintenance.length} color="text-amber-400"                                              icon={Wrench} />
              <KpiCard label="Active Faults" value={stationFaults.length} color={stationFaults.length > 0 ? 'text-orange-400' : 'text-green-400'} icon={Zap} />
              <KpiCard label="Open MELs"     value={stationMels.length}   color={stationMels.length > 0 ? 'text-amber-400' : 'text-green-400'}   icon={FileCheck} />
            </div>

            {/* Station Compliance Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <StationComplianceWidget 
                title="E-Logbook Compliance" 
                compliancePercent={open.length === 0 ? 100 : Math.round((closedToday.length / (closedToday.length + open.length)) * 100)}
                total={closedToday.length + open.length}
                closed={closedToday.length}
                signed={discrepancies.filter(e => e.is_signed).length}
                rejected={0}
                color={open.length === 0 ? 'text-green-400' : 'text-red-400'}
              />
              <StationComplianceWidget 
                title="MEL/NEF/CDL Compliance" 
                compliancePercent={stationMels.length === 0 ? 100 : Math.round(((stationMels.length - stationMels.filter(m => m.status === 'expired').length) / stationMels.length) * 100)}
                total={stationMels.length}
                closed={stationMels.filter(m => m.status === 'cleared').length}
                signed={stationMels.filter(m => m.status === 'approved').length}
                rejected={stationMels.filter(m => m.status === 'expired').length}
                color={stationMels.filter(m => m.status === 'expired').length === 0 ? 'text-green-400' : 'text-red-400'}
              />
              <StationComplianceWidget 
                title="Workload Distribution" 
                compliancePercent={unassigned.length === 0 ? 100 : Math.round(((activeWork.length - unassigned.length) / activeWork.length) * 100)}
                total={activeWork.length}
                closed={activeWork.filter(w => w.discrepancy_status === 'CLOSED').length}
                signed={activeWork.filter(w => w.technician_name).length}
                rejected={unassigned.length}
                color={unassigned.length === 0 ? 'text-green-400' : 'text-amber-400'}
              />
              <StationComplianceWidget 
                title="AD Compliance" 
                compliancePercent={stationAds.length === 0 ? 100 : Math.round(((stationAds.length - stationAds.filter(a => a.status === 'overdue').length) / stationAds.length) * 100)}
                total={stationAds.length}
                closed={stationAds.filter(a => a.status === 'complied').length}
                signed={stationAds.filter(a => a.status === 'complied').length}
                rejected={stationAds.filter(a => a.status === 'overdue').length}
                color={stationAds.filter(a => a.status === 'overdue').length === 0 ? 'text-green-400' : 'text-red-400'}
              />
            </div>

            {/* Local aircraft grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Aircraft {stationFilter ? `@ ${stationFilter}` : '· All Stations'}
                </p>
                <Link to="/FleetDashboard" className="text-xs text-primary hover:underline">Fleet Dashboard →</Link>
              </div>
              {stationAircraft.length === 0 ? (
                <div className="bg-card border border-border rounded-xl py-8 text-center text-muted-foreground text-sm">No aircraft at this station</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {stationAircraft.slice(0, 16).map(ac => {
                    const acDiscs = discrepancies.filter(d => d.aircraft_tail === ac.tail_number && d.discrepancy_status !== 'CLOSED');
                    return (
                      <div key={ac.id} className={cn('bg-card border rounded-xl px-3 py-3',
                        ac.status === 'oos' ? 'border-red-500/40' :
                        ac.status === 'maintenance' ? 'border-amber-500/30' :
                        acDiscs.length > 0 ? 'border-orange-500/30' : 'border-border')}>
                        <p className="text-sm font-extrabold text-primary font-mono">{ac.tail_number}</p>
                        <p className="text-[10px] text-muted-foreground">{ac.aircraft_type}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={cn('w-2 h-2 rounded-full',
                            ac.status === 'oos' ? 'bg-red-500' :
                            ac.status === 'maintenance' ? 'bg-amber-500' : 'bg-green-500')} />
                          <span className="text-[10px] text-muted-foreground capitalize">{ac.status}</span>
                          {acDiscs.length > 0 && <span className="text-[9px] font-bold text-orange-400 ml-auto">{acDiscs.length} open</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shift summary & quick links */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Shift Summary</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xl font-black text-foreground">{activeWork.length}</p><p className="text-[10px] text-muted-foreground">Active Tasks</p></div>
                <div><p className="text-xl font-black text-green-400">{closedToday.length}</p><p className="text-[10px] text-muted-foreground">Closed Today</p></div>
                <div><p className={cn('text-xl font-black', unassigned.length > 0 ? 'text-red-400' : 'text-green-400')}>{unassigned.length}</p><p className="text-[10px] text-muted-foreground">Unassigned</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: 'Shift Handover', path: '/ShiftHandover', icon: Users },
                  { label: 'AD Tracking', path: '/ADTracking', icon: Shield },
                  { label: 'CRS Documents', path: '/CRS', icon: FileCheck },
                  { label: 'Parts Supply', path: '/PartsSupply', icon: Package },
                  { label: 'Tooling', path: '/ToolingManagement', icon: Wrench },
                  { label: 'MEL Dashboard', path: '/MEL', icon: Zap },
                ].map(({ label, path, icon: Icon }) => (
                  <Link key={path} to={path} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ACTIVE WORK TAB */}
        {tab === 'active' && (
          <div className="space-y-4">
            {activeWork.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold">No active work at this station</p>
              </div>
            ) : (
              <>
                {unassigned.length > 0 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest mb-2">⚠ Unassigned ({unassigned.length})</p>
                    {unassigned.map(e => <WorkCard key={e.id} entry={e} onAssign={setAssignEntry} onClose={handleClose} onReopen={setReopenEntry} showReopen={false} />)}
                  </div>
                )}
                {open.filter(d => d.technician_name).length > 0 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest mb-2">🔴 Open — Assigned ({open.filter(d => d.technician_name).length})</p>
                    {open.filter(d => d.technician_name).map(e => <WorkCard key={e.id} entry={e} onAssign={setAssignEntry} onClose={handleClose} onReopen={setReopenEntry} showReopen={false} />)}
                  </div>
                )}
                {inProgress.length > 0 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest mb-2">🔧 In Progress ({inProgress.length})</p>
                    {inProgress.map(e => <WorkCard key={e.id} entry={e} onAssign={setAssignEntry} onClose={handleClose} onReopen={setReopenEntry} showReopen={false} />)}
                  </div>
                )}
                {pendingRii.length > 0 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest mb-2">🛡 Pending RII ({pendingRii.length})</p>
                    {pendingRii.map(e => <WorkCard key={e.id} entry={e} onAssign={setAssignEntry} onClose={handleClose} onReopen={setReopenEntry} showReopen={false} />)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CLOSED TODAY TAB */}
        {tab === 'closed' && (
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Closed Today ({closedToday.length})</p>
            {closedToday.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No tasks closed today yet</div>
            ) : closedToday.map(e => <WorkCard key={e.id} entry={e} onAssign={setAssignEntry} onClose={handleClose} onReopen={setReopenEntry} showReopen={true} />)}
          </div>
        )}

        {/* FAULTS & MEL TAB */}
        {tab === 'faults' && (
          <div className="space-y-4">
            {stationFaults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Active Faults ({stationFaults.length})</p>
                  <Link to="/TechOpsLogbook" className="text-xs text-primary hover:underline">Log Entry →</Link>
                </div>
                {stationFaults.map(f => (
                  <div key={f.id} className={cn('bg-card border rounded-xl px-4 py-3 mb-2',
                    f.severity === 'warning' ? 'border-red-500/30' : f.severity === 'caution' ? 'border-amber-500/30' : 'border-border')}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded text-white',
                        f.severity === 'warning' ? 'bg-red-700' : f.severity === 'caution' ? 'bg-amber-700' : 'bg-blue-700')}>{f.severity?.toUpperCase()}</span>
                      <span className="text-xs font-mono font-bold text-primary">{f.aircraft_tail}</span>
                      <span className="text-xs font-bold text-foreground">{f.fault_code}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                    {f.ata_chapter && <p className="text-[10px] text-muted-foreground mt-1">ATA {f.ata_chapter}</p>}
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Open MEL Items ({stationMels.length})</p>
                <Link to="/MEL" className="text-xs text-primary hover:underline">MEL Dashboard →</Link>
              </div>
              {stationMels.length === 0 ? (
                <div className="bg-card border border-border rounded-xl py-8 text-center text-muted-foreground text-sm">No open MEL items</div>
              ) : stationMels.map(m => (
                <div key={m.id} className="bg-card border border-border rounded-xl px-4 py-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-700 text-white">Cat {m.mel_category}</span>
                    <span className="text-xs font-mono text-primary">{m.aircraft_tail || m.tail_number || '—'}</span>
                    <span className={cn('text-[10px] font-bold ml-auto', m.status === 'expired' ? 'text-red-400' : m.status === 'expiring_soon' ? 'text-orange-400' : 'text-muted-foreground')}>
                      {m.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{m.mel_reference || m.title || '—'}</p>
                  {m.deferred_date && <p className="text-[10px] text-muted-foreground mt-0.5">Deferred: {m.deferred_date}</p>}
                </div>
              ))}
            </div>

            {stationAds.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">⚠ Overdue ADs ({stationAds.length})</p>
                  <Link to="/ADTracking" className="text-xs text-primary hover:underline">AD Register →</Link>
                </div>
                {stationAds.map(ad => (
                  <div key={ad.id} className="bg-card border border-red-500/40 rounded-xl px-4 py-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-700 text-white">OVERDUE</span>
                      <span className="text-xs font-mono font-bold text-foreground">{ad.ad_number}</span>
                      <span className="text-xs font-mono text-primary">{ad.aircraft_tail}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{ad.title}</p>
                    {ad.compliance_due_date && <p className="text-[10px] text-red-400">Due: {ad.compliance_due_date}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PARTS & TOOLS TAB */}
        {tab === 'parts' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Parts Inventory {stationFilter ? `@ ${stationFilter}` : ''}</p>
                <Link to="/LineMaintenanceDashboard" className="text-xs text-primary hover:underline flex items-center gap-1">Full Inventory <ChevronRight className="w-3 h-3" /></Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-card border border-red-500/30 rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-red-400">{outOfStock.length}</p><p className="text-[10px] text-muted-foreground">Out of Stock</p>
                </div>
                <div className="bg-card border border-amber-500/20 rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-amber-400">{lowStock.length - outOfStock.length}</p><p className="text-[10px] text-muted-foreground">Low Stock</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-green-400">{stationInventory.length - lowStock.length}</p><p className="text-[10px] text-muted-foreground">Adequate</p>
                </div>
              </div>
              {lowStock.length === 0 ? (
                <div className="bg-card border border-border rounded-xl py-6 text-center text-muted-foreground text-sm">All parts adequately stocked</div>
              ) : lowStock.slice(0, 10).map(item => (
                <div key={item.id} className={cn('flex items-center gap-3 bg-card border rounded-xl px-4 py-2.5 mb-1.5',
                  item.quantity_on_hand === 0 ? 'border-red-500/40' : 'border-amber-500/20')}>
                  <div className={cn('w-2 h-8 rounded-full flex-shrink-0', item.quantity_on_hand === 0 ? 'bg-red-500' : 'bg-amber-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.part_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{item.part_number} · ATA {item.ata_chapter || '—'} · {item.location || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-lg font-black', item.quantity_on_hand === 0 ? 'text-red-400' : 'text-amber-400')}>{item.quantity_on_hand}</p>
                    <p className="text-[10px] text-muted-foreground">min {item.min_quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Tooling</p>
                <Link to="/ToolingManagement" className="text-xs text-primary hover:underline flex items-center gap-1">Manage <ChevronRight className="w-3 h-3" /></Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-green-400">{stationTools.filter(t => t.status === 'available').length}</p><p className="text-[10px] text-muted-foreground">Available</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-blue-400">{toolsOut.length}</p><p className="text-[10px] text-muted-foreground">Checked Out</p>
                </div>
                <div className="bg-card border border-amber-500/20 rounded-xl px-3 py-3 text-center">
                  <p className={cn('text-2xl font-black', calDue.length > 0 ? 'text-amber-400' : 'text-green-400')}>{calDue.length}</p><p className="text-[10px] text-muted-foreground">Cal Due</p>
                </div>
              </div>
              {calDue.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-3 bg-card border border-amber-500/20 rounded-xl px-4 py-2.5 mb-1.5">
                  <Wrench className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.tool_number} · Cal due: {t.calibration_due || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHIFT HANDOVER TAB */}
        {tab === 'handover' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Shift Handovers</p>
              <Link to="/ShiftHandover" className="text-xs text-primary hover:underline flex items-center gap-1">Full Log <ChevronRight className="w-3 h-3" /></Link>
            </div>
            {handovers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No handovers recorded</div>
            ) : handovers.map(h => (
              <div key={h.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                      h.status === 'acknowledged' ? 'bg-green-500/15 text-green-400' :
                      h.status === 'submitted' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-gray-500/15 text-gray-400')}>{h.status?.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground capitalize">{h.shift_period} shift</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{h.shift_date}</span>
                </div>
                <p className="text-sm font-bold text-foreground">{h.submitted_by} {h.submitted_by_cert ? `· ${h.submitted_by_cert}` : ''}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.progress_summary}</p>
                {h.safety_critical_notes && (
                  <div className="bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 font-bold">
                    ⚠ SAFETY: {h.safety_critical_notes}
                  </div>
                )}
                {h.pending_issues?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Pending Issues ({h.pending_issues.length})</p>
                    {h.pending_issues.map((issue, i) => (
                      <div key={i} className="bg-secondary/50 rounded-lg px-3 py-2 text-xs">
                        <span className={cn('font-bold', issue.priority === 'critical' ? 'text-red-400' : issue.priority === 'high' ? 'text-orange-400' : 'text-foreground')}>
                          [{issue.priority?.toUpperCase()}]
                        </span>
                        <span className="text-muted-foreground ml-2">{issue.description}</span>
                        {issue.aircraft_tail && <span className="text-primary ml-1">· {issue.aircraft_tail}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {h.status === 'submitted' && (
                  <button
                    onClick={() => handoverMutation.mutate({ id: h.id, data: { status: 'acknowledged', acknowledged_by: 'Maintenance Supervisor', acknowledged_at: new Date().toISOString() } })}
                    className="w-full py-2 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-extrabold hover:bg-green-600/30 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Acknowledge Handover
                  </button>
                )}
              </div>
            ))}
            <Link to="/ShiftHandover" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4" /> New Shift Handover
            </Link>
          </div>
        )}
      </div>

      {assignEntry && <AssignModal entry={assignEntry} onClose={() => setAssignEntry(null)} onConfirm={handleAssign} />}
      {reopenEntry && <ReopenModal entry={reopenEntry} onClose={() => setReopenEntry(null)} onConfirm={handleReopen} />}
    </div>
  );
}