import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ChevronLeft, AlertTriangle, CheckCircle, Clock, Users,
  RefreshCw, Plus, Shield, Activity, MapPin, FileCheck, BookOpen,
  ChevronRight, Send, X, Zap, BarChart2, Search, Eye, Lock,
  ClipboardList, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const STATIONS = ['All Stations','KEWR','KJFK','KLAX','KORD','KDFW','KATL','KMIA','KSFO','KBOS','KDEN','KPHX','KIAH','KLAS','KMCO'];

const RII_STATUS_CFG = {
  OPEN:        { label: 'OPEN',         color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/10' },
  IN_PROGRESS: { label: 'IN PROGRESS',  color: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-500/10' },
  PENDING_RII: { label: 'AWAITING RII', color: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-500/15' },
  CLOSED:      { label: 'CLOSED',       color: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-500/10' },
};

function KpiCard({ label, value, color, icon: Icon, alert, sub }) {
  return (
    <div className={cn('bg-card border rounded-2xl px-4 py-4 flex items-center gap-3', alert ? 'border-red-500/40' : 'border-border')}>
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div className="min-w-0">
        <p className={cn('text-2xl font-black', color)}>{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
      {alert && <div className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
    </div>
  );
}

function RIISignoffModal({ entry, onClose, onConfirm, onReject }) {
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorCert, setInspectorCert] = useState('');
  const [mode, setMode] = useState('approve'); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inspectorName) return;
    if (mode === 'approve') {
      onConfirm(entry.id, inspectorName, inspectorCert);
    } else {
      onReject(entry.id, inspectorName, rejectReason);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            <p className="font-extrabold text-foreground text-sm">RII Inspector Action</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-violet-900/20 border border-violet-500/20 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-violet-300">{entry.aircraft_tail} {entry.log_page ? `· ${entry.log_page}` : ''}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.description}</p>
            {entry.corrective_action && (
              <p className="text-xs text-green-400 mt-1">✓ Corrective Action: {entry.corrective_action?.slice(0, 80)}</p>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            <button type="button" onClick={() => setMode('approve')}
              className={cn('flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all',
                mode === 'approve' ? 'bg-green-600 text-white' : 'bg-secondary text-muted-foreground')}>
              <CheckCircle className="w-3.5 h-3.5" /> Approve & Sign Off
            </button>
            <button type="button" onClick={() => setMode('reject')}
              className={cn('flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all',
                mode === 'reject' ? 'bg-red-600 text-white' : 'bg-secondary text-muted-foreground')}>
              <XCircle className="w-3.5 h-3.5" /> Reject / Return
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Inspector Name *</label>
            <input required value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Full name"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Inspector Cert / License #</label>
            <input value={inspectorCert} onChange={e => setInspectorCert(e.target.value)} placeholder="e.g. QC-99999"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>

          {mode === 'reject' && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Rejection Reason *</label>
              <textarea required rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Describe the deficiency or reason for rejection…"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none" />
            </div>
          )}

          <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2 text-[10px] text-amber-400">
            ⚠ As RII Inspector, your signature confirms this work meets airworthiness standards per applicable regulations.
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground">Cancel</button>
            <button type="submit"
              className={cn('flex-1 py-2.5 rounded-xl text-white text-sm font-extrabold flex items-center justify-center gap-2',
                mode === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500')}>
              {mode === 'approve' ? <><CheckCircle className="w-4 h-4" /> Sign Off</> : <><XCircle className="w-4 h-4" /> Reject</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InspectionCard({ entry, onRIIAction, isQC }) {
  const [expanded, setExpanded] = useState(false);
  const status = entry.discrepancy_status || 'OPEN';
  const cfg = RII_STATUS_CFG[status] || RII_STATUS_CFG.OPEN;
  const isPendingRii = status === 'PENDING_RII';
  const isSigned = entry.is_signed || (Array.isArray(entry.digital_signatures) && entry.digital_signatures.length > 0);
  const hoursOpen = ((Date.now() - new Date(entry.created_date)) / 3600000).toFixed(1);

  return (
    <div className={cn('bg-card border rounded-2xl overflow-hidden transition-all', isPendingRii ? 'border-violet-500/50' : cfg.border)}>
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={cn('w-2 h-full min-h-[40px] rounded-full flex-shrink-0 mt-0.5', isPendingRii ? 'bg-violet-500' : status === 'OPEN' ? 'bg-red-500' : status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-green-500')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
            <span className="text-xs font-mono font-bold text-primary">{entry.aircraft_tail}</span>
            {entry.log_page && <span className="text-[10px] font-mono text-sky-400">{entry.log_page}</span>}
            {entry.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {entry.ata_chapter}</span>}
            {entry.station && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{entry.station}</span>}
            {isSigned && <span className="text-[10px] text-green-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Signed</span>}
          </div>
          <p className="text-sm text-foreground leading-snug">{entry.description?.split('\n')[0].slice(0, 100)}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted-foreground">
            {entry.technician_name && <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{entry.technician_name}</span>}
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{hoursOpen}h</span>
            {isPendingRii && <span className="text-violet-400 font-bold animate-pulse">⚡ RII ACTION REQUIRED</span>}
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 flex-shrink-0">
          <ChevronRight className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          {entry.corrective_action && (
            <div className="bg-green-900/15 border border-green-500/20 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Corrective Action</p>
              <p className="text-xs text-foreground">{entry.corrective_action}</p>
              {entry.corrected_by && <p className="text-[10px] text-muted-foreground mt-1">By: {entry.corrected_by} {entry.corrected_by_id ? `· ${entry.corrected_by_id}` : ''}</p>}
            </div>
          )}
          {entry.troubleshooting_notes && (
            <div className="bg-secondary/50 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Troubleshooting Notes</p>
              <p className="text-xs text-foreground">{entry.troubleshooting_notes}</p>
            </div>
          )}
          {entry.parts_used && (
            <div className="bg-secondary/50 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Parts Used</p>
              <p className="text-xs text-foreground">{entry.parts_used}</p>
            </div>
          )}
          {entry.rii_inspector_name && (
            <div className="bg-violet-900/15 border border-violet-500/20 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">RII Inspector</p>
              <p className="text-xs text-foreground">{entry.rii_inspector_name} {entry.rii_inspector_id ? `· ${entry.rii_inspector_id}` : ''}</p>
              {entry.rii_signed_at && <p className="text-[10px] text-muted-foreground">Signed: {new Date(entry.rii_signed_at).toLocaleString()}</p>}
            </div>
          )}
          {entry.rii_rejected && entry.rii_rejection_reason && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">RII Rejection</p>
              <p className="text-xs text-foreground">{entry.rii_rejection_reason}</p>
            </div>
          )}
          {Array.isArray(entry.digital_signatures) && entry.digital_signatures.length > 0 && (
            <div className="bg-green-900/10 border border-green-500/15 rounded-xl px-3 py-2 space-y-1">
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Digital Signatures ({entry.digital_signatures.length})</p>
              {entry.digital_signatures.map((sig, i) => (
                <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-2">
                  <Lock className="w-2.5 h-2.5 text-green-400" />
                  <span>{sig.signer_name} · {sig.signer_role} · {new Date(sig.signed_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* RII Action Button */}
          {isPendingRii && isQC && (
            <button onClick={() => onRIIAction(entry)}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-extrabold hover:bg-violet-500 transition-colors flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" /> RII Inspector Sign-Off / Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CRSReviewCard({ crs, onApprove }) {
  const statusColor = {
    draft: 'text-gray-400', pending_rii: 'text-violet-400',
    pending_supervisor: 'text-amber-400', released: 'text-green-400',
    rejected: 'text-red-400',
  };
  return (
    <div className="bg-card border border-amber-500/20 rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15', statusColor[crs.status] || 'text-muted-foreground')}>
            {crs.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span className="text-xs font-mono font-bold text-primary">{crs.aircraft_tail}</span>
          <span className="text-xs font-mono text-foreground">{crs.crs_number || `CRS-${crs.id?.slice(-6)}`}</span>
        </div>
        <Link to="/CRS" className="text-xs font-bold text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/10">Review</Link>
      </div>
      <p className="text-xs text-muted-foreground">{crs.maintenance_type?.replace(/_/g, ' ')} · RTS: {crs.return_to_service_date}</p>
      <p className="text-xs text-foreground line-clamp-1">{crs.description_of_work}</p>
    </div>
  );
}

const TABS = [
  { id: 'overview',    label: 'QC Overview',      icon: BarChart2 },
  { id: 'rii',         label: 'RII Queue',         icon: Shield },
  { id: 'all_items',   label: 'All Inspections',   icon: ClipboardList },
  { id: 'crs',         label: 'CRS Review',        icon: FileCheck },
  { id: 'signed',      label: 'Signed Records',    icon: Lock },
  { id: 'safety',      label: 'Safety Reports',    icon: AlertTriangle },
];

export default function QCSupervisorDashboard() {
  const [tab, setTab] = useState('overview');
  const [station, setStation] = useState('All Stations');
  const [riiEntry, setRiiEntry] = useState(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const stationFilter = station === 'All Stations' ? null : station;

  const { data: allEntries = [], isLoading, refetch } = useQuery({
    queryKey: ['qcsup-entries'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }),
    refetchInterval: 30000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['qcsup-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: crsList = [] } = useQuery({
    queryKey: ['qcsup-crs'],
    queryFn: () => base44.entities.CertificateOfRelease.list('-created_date', 100),
    refetchInterval: 60000,
  });

  const { data: safetyReports = [] } = useQuery({
    queryKey: ['qcsup-safety'],
    queryFn: () => base44.entities.SafetyReport.list('-created_date', 50),
    refetchInterval: 60000,
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['qcsup-ads'],
    queryFn: () => base44.entities.AirworthinessDirective.list('-effective_date', 200),
    select: d => d.filter(a => a.status === 'open' || a.status === 'overdue'),
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LogbookEntry.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qcsup-entries'] }),
  });

  // Station-scoped filtering
  const stationAircraft = stationFilter ? aircraft.filter(a => a.base_station === stationFilter) : aircraft;
  const stationTails = new Set(stationAircraft.map(a => a.tail_number));

  const entries = allEntries.filter(e =>
    !stationFilter || e.station === stationFilter || stationTails.has(e.aircraft_tail)
  );

  const stationCRS = crsList.filter(c =>
    !stationFilter || stationTails.has(c.aircraft_tail) || c.station === stationFilter
  );

  const stationAds = ads.filter(a => !stationFilter || stationTails.has(a.aircraft_tail));

  // Derived views
  const pendingRii    = entries.filter(e => e.discrepancy_status === 'PENDING_RII');
  const openItems     = entries.filter(e => e.discrepancy_status === 'OPEN');
  const inProgress    = entries.filter(e => e.discrepancy_status === 'IN_PROGRESS');
  const closedItems   = entries.filter(e => e.discrepancy_status === 'CLOSED');
  const signedItems   = entries.filter(e => e.is_signed || (Array.isArray(e.digital_signatures) && e.digital_signatures.length > 0));
  const rejectedItems = entries.filter(e => e.rii_rejected);

  const pendingCRS     = stationCRS.filter(c => c.status !== 'released' && c.status !== 'voided');
  const releasedCRS    = stationCRS.filter(c => c.status === 'released');
  const openSafety     = safetyReports.filter(r => r.status !== 'closed');
  const overdueADs     = stationAds.filter(a => a.status === 'overdue');

  const complianceRate = entries.length > 0
    ? Math.round((closedItems.length / entries.length) * 100)
    : 100;

  const handleRIIApprove = (entryId, inspectorName, inspectorCert) => {
    updateMutation.mutate({
      id: entryId,
      data: {
        discrepancy_status: 'CLOSED',
        rii_inspector_name: inspectorName,
        rii_inspector_id: inspectorCert,
        rii_signed_at: new Date().toISOString(),
        is_cleared: true,
        cleared_by: inspectorName,
        cleared_date: TODAY,
      }
    });
  };

  const handleRIIReject = (entryId, inspectorName, reason) => {
    updateMutation.mutate({
      id: entryId,
      data: {
        discrepancy_status: 'IN_PROGRESS',
        rii_rejected: true,
        rii_rejection_reason: reason,
        rii_inspector_name: inspectorName,
      }
    });
  };

  const filteredAll = entries.filter(e =>
    !search ||
    e.aircraft_tail?.toLowerCase().includes(search.toLowerCase()) ||
    e.log_page?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.technician_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">QC Supervisor Dashboard</h1>
              <p className="text-xs text-green-400 tracking-widest uppercase">Quality Control · RII Inspections · Compliance Oversight</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <Link to="/SignatureAudit" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-xs font-bold hover:bg-secondary/80">
              <Lock className="w-3.5 h-3.5 text-green-400" /> Audit
            </Link>
          </div>
        </div>

        {/* Station Selector */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
          <select value={station} onChange={e => setStation(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary font-bold">
            {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-xl border border-border">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-green-400">LIVE</span>
          </div>
        </div>

        {/* RII Alert Banner */}
        {pendingRii.length > 0 && (
          <div className="bg-violet-900/30 border border-violet-500/40 rounded-xl px-4 py-2.5 flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-violet-400 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-extrabold text-violet-300">
              {pendingRii.length} item{pendingRii.length > 1 ? 's' : ''} awaiting RII sign-off — inspector action required
            </p>
            <button onClick={() => setTab('rii')} className="ml-auto text-xs font-bold text-violet-300 border border-violet-500/40 px-3 py-1.5 rounded-lg hover:bg-violet-500/20">
              Review
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                tab === id ? 'bg-green-600 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'rii' && pendingRii.length > 0 && (
                <span className={cn('text-[9px] font-extrabold px-1.5 py-0.5 rounded-full', tab === id ? 'bg-white/20' : 'bg-violet-600 text-white')}>
                  {pendingRii.length}
                </span>
              )}
              {id === 'crs' && pendingCRS.length > 0 && (
                <span className={cn('text-[9px] font-extrabold px-1.5 py-0.5 rounded-full', tab === id ? 'bg-white/20' : 'bg-amber-600 text-white')}>
                  {pendingCRS.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-5xl mx-auto">

        {/* QC OVERVIEW TAB */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Pending RII"      value={pendingRii.length}    color="text-violet-400"                                          icon={Shield}       alert={pendingRii.length > 0} />
              <KpiCard label="Open Items"        value={openItems.length}     color={openItems.length > 0 ? 'text-red-400' : 'text-green-400'} icon={AlertTriangle} alert={openItems.length > 0} />
              <KpiCard label="In Progress"       value={inProgress.length}    color="text-amber-400"                                          icon={Activity} />
              <KpiCard label="Closed"            value={closedItems.length}   color="text-green-400"                                          icon={CheckCircle} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="RII Rejections"   value={rejectedItems.length} color={rejectedItems.length > 0 ? 'text-red-400' : 'text-green-400'} icon={XCircle} alert={rejectedItems.length > 0} />
              <KpiCard label="Pending CRS"      value={pendingCRS.length}    color={pendingCRS.length > 0 ? 'text-amber-400' : 'text-green-400'}  icon={FileCheck} />
              <KpiCard label="Overdue ADs"      value={overdueADs.length}    color={overdueADs.length > 0 ? 'text-red-400' : 'text-green-400'}    icon={Zap}       alert={overdueADs.length > 0} />
              <KpiCard label="Open Safety RPTs" value={openSafety.length}    color={openSafety.length > 0 ? 'text-orange-400' : 'text-green-400'} icon={AlertTriangle} />
            </div>

            {/* Compliance Rate */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-foreground">Station Compliance Rate</p>
                <span className={cn('text-2xl font-black', complianceRate >= 90 ? 'text-green-400' : complianceRate >= 70 ? 'text-amber-400' : 'text-red-400')}>
                  {complianceRate}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', complianceRate >= 90 ? 'bg-green-500' : complianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                  style={{ width: `${complianceRate}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div><p className="text-sm font-black text-foreground">{entries.length}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
                <div><p className="text-sm font-black text-green-400">{closedItems.length}</p><p className="text-[10px] text-muted-foreground">Closed</p></div>
                <div><p className="text-sm font-black text-violet-400">{signedItems.length}</p><p className="text-[10px] text-muted-foreground">Signed</p></div>
                <div><p className="text-sm font-black text-red-400">{rejectedItems.length}</p><p className="text-[10px] text-muted-foreground">Rejected</p></div>
              </div>
            </div>

            {/* Overdue ADs */}
            {overdueADs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">⚠ Overdue ADs</p>
                  <Link to="/ADTracking" className="text-xs text-primary hover:underline">AD Register →</Link>
                </div>
                {overdueADs.slice(0, 4).map(ad => (
                  <div key={ad.id} className="bg-card border border-red-500/40 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">OVERDUE</span>
                        <span className="text-xs font-mono text-foreground">{ad.ad_number}</span>
                        <span className="text-xs font-mono text-primary">{ad.aircraft_tail}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ad.title}</p>
                    </div>
                    {ad.compliance_due_date && <span className="ml-auto text-xs text-red-400 font-bold flex-shrink-0">Due: {ad.compliance_due_date}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Quick links */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Signature Audit', path: '/SignatureAudit', color: 'text-green-400 border-green-500/30' },
                { label: 'CRS Documents', path: '/CRS', color: 'text-amber-400 border-amber-500/30' },
                { label: 'AD Tracking', path: '/ADTracking', color: 'text-blue-400 border-blue-500/30' },
                { label: 'Safety QA', path: '/SafetyQA', color: 'text-orange-400 border-orange-500/30' },
                { label: 'QAQC Dashboard', path: '/QAQC', color: 'text-primary border-primary/30' },
                { label: 'E-Logbook', path: '/TechOpsLogbook', color: 'text-foreground border-border' },
              ].map(({ label, path, color }) => (
                <Link key={path} to={path} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border text-xs font-bold hover:bg-secondary/50 transition-all', color)}>
                  {label} <ChevronRight className="w-3 h-3 opacity-50" />
                </Link>
              ))}
            </div>
          </>
        )}

        {/* RII QUEUE TAB */}
        {tab === 'rii' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest">
                RII Inspection Queue ({pendingRii.length})
              </p>
              <p className="text-[10px] text-muted-foreground">Click an item to expand and sign off</p>
            </div>
            {pendingRii.length === 0 ? (
              <div className="text-center py-16">
                <ShieldCheck className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold">No items awaiting RII sign-off</p>
              </div>
            ) : pendingRii.map(e => (
              <InspectionCard key={e.id} entry={e} onRIIAction={setRiiEntry} isQC={true} />
            ))}

            {rejectedItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">Recent Rejections ({rejectedItems.length})</p>
                {rejectedItems.slice(0, 5).map(e => (
                  <InspectionCard key={e.id} entry={e} onRIIAction={setRiiEntry} isQC={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALL INSPECTIONS TAB */}
        {tab === 'all_items' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tail, log page, description, technician…"
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              <span>{filteredAll.length} records</span>
              <span>·</span>
              <span className="text-violet-400">{pendingRii.length} pending RII</span>
              <span>·</span>
              <span className="text-green-400">{signedItems.length} signed</span>
            </div>
            {filteredAll.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No records found</div>
            ) : filteredAll.map(e => (
              <InspectionCard key={e.id} entry={e} onRIIAction={setRiiEntry} isQC={true} />
            ))}
          </div>
        )}

        {/* CRS REVIEW TAB */}
        {tab === 'crs' && (
          <div className="space-y-4">
            {pendingCRS.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Pending CRS Sign-Off ({pendingCRS.length})</p>
                  <Link to="/CRS" className="text-xs text-primary hover:underline">Open CRS Module →</Link>
                </div>
                {pendingCRS.map(crs => <CRSReviewCard key={crs.id} crs={crs} />)}
              </div>
            )}
            {releasedCRS.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest">Released Today / Recent ({releasedCRS.length})</p>
                {releasedCRS.slice(0, 8).map(crs => (
                  <div key={crs.id} className="bg-card border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{crs.crs_number || `CRS-${crs.id?.slice(-6)}`} · {crs.aircraft_tail}</p>
                      <p className="text-[10px] text-muted-foreground">{crs.maintenance_type?.replace(/_/g, ' ')} · RTS: {crs.return_to_service_date}</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">RELEASED</span>
                  </div>
                ))}
              </div>
            )}
            {pendingCRS.length === 0 && releasedCRS.length === 0 && (
              <div className="text-center py-16">
                <FileCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">No CRS documents at this station</p>
              </div>
            )}
          </div>
        )}

        {/* SIGNED RECORDS TAB */}
        {tab === 'signed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest">Digitally Signed Records ({signedItems.length})</p>
              <Link to="/SignatureAudit" className="text-xs text-primary hover:underline flex items-center gap-1">
                Verify Integrity <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <Lock className="w-4 h-4 text-green-400" />
              <p className="text-xs text-muted-foreground">Signed entries are cryptographically locked. Use the Signature Audit module to verify SHA-256 hash integrity and detect any tampering.</p>
            </div>
            {signedItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No signed entries at this station</div>
            ) : signedItems.map(e => (
              <InspectionCard key={e.id} entry={e} onRIIAction={setRiiEntry} isQC={false} />
            ))}
          </div>
        )}

        {/* SAFETY REPORTS TAB */}
        {tab === 'safety' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Safety Reports ({safetyReports.length})</p>
              <Link to="/SafetyQA" className="text-xs text-primary hover:underline">Full Safety Module →</Link>
            </div>
            {safetyReports.length === 0 ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">No safety reports filed</p>
              </div>
            ) : safetyReports.map(report => (
              <div key={report.id} className={cn('bg-card border rounded-xl px-4 py-3 space-y-2',
                report.status === 'closed' ? 'border-border' :
                report.severity === 'critical' ? 'border-red-500/40' :
                report.severity === 'high' ? 'border-orange-500/30' : 'border-border')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {report.severity && (
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                        report.severity === 'critical' ? 'bg-red-500/15 text-red-400' :
                        report.severity === 'high' ? 'bg-orange-500/15 text-orange-400' :
                        'bg-amber-500/15 text-amber-400')}>
                        {report.severity?.toUpperCase()}
                      </span>
                    )}
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      report.status === 'closed' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400')}>
                      {report.status?.toUpperCase() || 'OPEN'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(report.created_date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-bold text-foreground">{report.title || report.description?.slice(0, 60)}</p>
                {report.description && report.title && <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>}
                {report.reported_by && <p className="text-[10px] text-muted-foreground">Filed by: {report.reported_by}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {riiEntry && (
        <RIISignoffModal
          entry={riiEntry}
          onClose={() => setRiiEntry(null)}
          onConfirm={handleRIIApprove}
          onReject={handleRIIReject}
        />
      )}
    </div>
  );
}