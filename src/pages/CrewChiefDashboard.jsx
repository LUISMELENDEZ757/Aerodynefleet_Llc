import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TechAssignmentPanel from '@/components/techops/TechAssignmentPanel';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Wrench, ChevronLeft, AlertTriangle, CheckCircle, Clock, Users,
  Package, RefreshCw, Plus, Zap, Shield, BookOpen, FileCheck,
  Play, Send, X, Activity, ChevronRight, MapPin, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const PRIORITY_CFG = {
  aog:    { label: 'AOG',    color: 'text-red-300',    bg: 'bg-red-700' },
  high:   { label: 'HIGH',   color: 'text-orange-400', bg: 'bg-orange-600' },
  medium: { label: 'MED',    color: 'text-amber-400',  bg: 'bg-amber-600' },
  low:    { label: 'LOW',    color: 'text-gray-400',   bg: 'bg-gray-600' },
};

const STATUS_CFG = {
  OPEN:        { label: 'OPEN',         color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/10' },
  IN_PROGRESS: { label: 'IN PROGRESS',  color: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-500/10' },
  PENDING_RII: { label: 'PENDING RII',  color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
  CLOSED:      { label: 'CLOSED',       color: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-500/10' },
};

function KpiCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-black', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
    </div>
  );
}

function DiscrepancyRow({ entry, onBeginWork, onComplete }) {
  const status = entry.discrepancy_status || 'OPEN';
  const cfg = STATUS_CFG[status] || STATUS_CFG.OPEN;
  const notes = entry.notes || '';
  const priority = notes.match(/Priority: (\w+)/)?.[1]?.toLowerCase() || 'medium';
  const priCfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;

  return (
    <div className={cn('bg-card border rounded-xl px-4 py-3 flex items-start gap-3', cfg.border)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded text-white', priCfg.bg)}>{priCfg.label}</span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
          <span className="text-xs font-mono font-bold text-primary">{entry.aircraft_tail}</span>
          {entry.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {entry.ata_chapter}</span>}
          {entry.log_page && <span className="text-[10px] font-mono text-sky-400">{entry.log_page}</span>}
        </div>
        <p className="text-sm text-foreground leading-snug">{entry.description?.replace('[LINE MX]', '').split('\n')[0].trim()}</p>
        {entry.technician_name && (
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Users className="w-2.5 h-2.5" /> {entry.technician_name}
            <span className="ml-2">{new Date(entry.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}Z</span>
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {status === 'OPEN' && (
          <button onClick={() => onBeginWork(entry.id)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-1">
            <Play className="w-2.5 h-2.5" /> Assign
          </button>
        )}
        {status === 'IN_PROGRESS' && (
          <button onClick={() => onComplete(entry.id)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> Close
          </button>
        )}
        <Link to="/TechOpsLogbook" className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors text-center">
          View
        </Link>
      </div>
    </div>
  );
}

function QuickAssignModal({ entry, onClose, onAssign }) {
  const [stationFilter, setStationFilter] = useState('');
  const [selectedTech, setSelectedTech] = useState(null);

  const { data: rawTechs = [] } = useQuery({
    queryKey: ['assign-modal-techs'],
    queryFn: () => base44.entities.TrainingRecord.list('-created_date', 500),
    select: (data) => data
      .filter(r => r.employee_name || r.crew_name)
      .map(r => ({
        id: r.id,
        name: r.employee_name || r.crew_name,
        employee_id: r.employee_id || '',
        station: r.station || '',
        specialty: r.specialty || '',
        certifications: r.certifications || [],
        duty_status: r.duty_status || 'available',
      })),
  });

  const stations = [...new Set(rawTechs.map(t => t.station).filter(Boolean))].sort();
  const filtered = stationFilter ? rawTechs.filter(t => t.station === stationFilter) : rawTechs;
  const available = filtered.filter(t => t.duty_status !== 'off_duty');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTech) return;
    onAssign(entry.id, selectedTech.name, selectedTech.employee_id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-extrabold text-foreground text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" /> Assign Technician
          </p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Task context */}
          <div className="bg-secondary/50 rounded-xl px-3 py-2 text-xs">
            <p className="font-bold text-primary">{entry.aircraft_tail}</p>
            <p className="text-muted-foreground truncate">{entry.description?.slice(0, 80)}</p>
          </div>

          {/* Station / City filter */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Filter by Station / City</label>
            <select
              value={stationFilter}
              onChange={e => { setStationFilter(e.target.value); setSelectedTech(null); }}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">— All Stations —</option>
              {stations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Technician picker */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
              Select Technician {available.length > 0 && <span className="text-primary normal-case font-normal">({available.length} available)</span>}
            </label>
            <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-border bg-background p-2">
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No technicians found{stationFilter ? ` at ${stationFilter}` : ''}</p>
              ) : available.map(t => {
                const isSelected = selectedTech?.id === t.id;
                const statusColors = {
                  on_duty: 'bg-cyan-500', assigned: 'bg-green-500', available: 'bg-blue-500',
                  on_break: 'bg-amber-500', in_transit: 'bg-purple-500', training: 'bg-indigo-500', aog: 'bg-red-500',
                };
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTech(t)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
                      isSelected ? 'bg-primary/20 border border-primary/40' : 'hover:bg-secondary border border-transparent'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColors[t.duty_status] || 'bg-gray-500')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.employee_id && <span className="font-mono mr-1">{t.employee_id}</span>}
                        {t.specialty && <span>{t.specialty}</span>}
                        {t.certifications?.length > 0 && <span className="ml-1 text-primary">· {t.certifications.slice(0,3).join(', ')}</span>}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{t.station}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground">Cancel</button>
            <button type="submit" disabled={!selectedTech}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Assign {selectedTech ? selectedTech.name.split(' ')[0] : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TABS = ['discrepancies', 'faults', 'parts', 'handover', 'work_assignments'];

export default function CrewChiefDashboard() {
  const [tab, setTab] = useState('discrepancies');
  const [assignEntry, setAssignEntry] = useState(null);
  const [stationFilter, setStationFilter] = useState('');
  const qc = useQueryClient();

  const { data: discrepancies = [], isLoading, refetch } = useQuery({
    queryKey: ['cc-discrepancies'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }),
    select: d => d.filter(e => e.discrepancy_status !== 'CLOSED'),
    refetchInterval: 30000,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['cc-faults'],
    queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }),
    refetchInterval: 30000,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['cc-inventory'],
    queryFn: () => base44.entities.InventoryItem.list('part_number', 200),
    refetchInterval: 60000,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['cc-tools'],
    queryFn: () => base44.entities.Tool.list('tool_number', 200),
    refetchInterval: 60000,
  });

  const { data: handovers = [] } = useQuery({
    queryKey: ['cc-handovers'],
    queryFn: () => base44.entities.ShiftHandover.list('-created_date', 10),
    refetchInterval: 60000,
  });

  const { data: requisitions = [] } = useQuery({
    queryKey: ['cc-requisitions'],
    queryFn: () => base44.entities.SupplyRequisition.list('-created_date', 100),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['cc-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: ads = [] } = useQuery({
    queryKey: ['cc-ads'],
    queryFn: () => base44.entities.AirworthinessDirective.filter({ status: 'overdue' }),
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LogbookEntry.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cc-discrepancies'] }),
  });

  const handleBeginWork = (id) => {
    const entry = discrepancies.find(e => e.id === id);
    if (entry) setAssignEntry(entry);
  };

  const handleAssign = (id, tech, techId) => {
    updateMutation.mutate({
      id, data: {
        discrepancy_status: 'IN_PROGRESS',
        technician_name: tech,
        technician_id: techId,
        work_started_at: new Date().toISOString(),
      }
    });
  };

  const handleComplete = (id) => {
    updateMutation.mutate({
      id, data: {
        discrepancy_status: 'CLOSED',
        is_cleared: true,
        cleared_date: TODAY,
        work_completed_at: new Date().toISOString(),
      }
    });
  };

  // Derive station list from aircraft
  const stations = [...new Set(aircraft.map(a => a.base_station).filter(Boolean))].sort();

  // Filter discrepancies by station
  const stationTails = stationFilter
    ? aircraft.filter(a => a.base_station === stationFilter).map(a => a.tail_number)
    : null;
  const filteredDiscrepancies = stationTails
    ? discrepancies.filter(d => stationTails.includes(d.aircraft_tail))
    : discrepancies;
  const filteredFaults = stationTails
    ? faults.filter(f => stationTails.includes(f.aircraft_tail))
    : faults;

  const open = filteredDiscrepancies.filter(d => d.discrepancy_status === 'OPEN');
  const inProgress = filteredDiscrepancies.filter(d => d.discrepancy_status === 'IN_PROGRESS');
  const pendingRii = filteredDiscrepancies.filter(d => d.discrepancy_status === 'PENDING_RII');
  const lowStock = inventory.filter(i => i.quantity_on_hand <= i.min_quantity);
  const outOfStock = inventory.filter(i => i.quantity_on_hand === 0);
  const toolsOut = tools.filter(t => t.status === 'checked_out');
  const calDue = tools.filter(t => t.status === 'calibration_due');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Crew Chief Dashboard</h1>
              <p className="text-xs text-orange-400 tracking-widest uppercase">Line MX · Task Assignment · Tool & Parts Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Station Filter Dropdown */}
            <div className="relative flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2 min-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <select
                value={stationFilter}
                onChange={e => setStationFilter(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground outline-none flex-1 appearance-none cursor-pointer"
              >
                <option value="">All Stations</option>
                {stations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 pointer-events-none" />
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-extrabold text-green-400">LIVE</span>
              </div>
            </div>
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <KpiCard label="Open Discrepancies" value={open.length} color={open.length > 0 ? 'text-red-400' : 'text-green-400'} icon={AlertTriangle} />
          <KpiCard label="In Progress" value={inProgress.length} color="text-amber-400" icon={Activity} />
          <KpiCard label="Pending RII" value={pendingRii.length} color="text-violet-400" icon={Shield} />
          <KpiCard label="Overdue ADs" value={ads.length} color={ads.length > 0 ? 'text-red-400' : 'text-green-400'} icon={Zap} />
        </div>

        {/* Alerts */}
        {(outOfStock.length > 0 || ads.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {outOfStock.length > 0 && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400 font-bold">
                <Package className="w-3.5 h-3.5" /> {outOfStock.length} part{outOfStock.length > 1 ? 's' : ''} out of stock
              </div>
            )}
            {ads.length > 0 && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> {ads.length} overdue AD{ads.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'discrepancies', label: 'Discrepancies', badge: open.length + inProgress.length },
            { id: 'faults', label: 'Faults', badge: filteredFaults.length },
            { id: 'parts', label: 'Parts & Tools', badge: lowStock.length + calDue.length },
            { id: 'handover', label: 'Shift Handover' },
            { id: 'work_assignments', label: 'Work Assignments', badge: requisitions.filter(r => r.status === 'pending_approval').length },
            { id: 'tech_assignment', label: 'Tech Assignment' },


          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {t.label}
              {t.badge > 0 && (
                <span className={cn('text-[9px] font-extrabold px-1.5 py-0.5 rounded-full',
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-red-600 text-white')}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 max-w-4xl mx-auto">
        {/* DISCREPANCIES TAB */}
        {tab === 'discrepancies' && (
          <>
            {discrepancies.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold">All clear — no open discrepancies</p>
              </div>
            ) : (
              <>
                {open.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">🔴 Unassigned ({open.length})</p>
                    {open.map(e => <DiscrepancyRow key={e.id} entry={e} onBeginWork={handleBeginWork} onComplete={handleComplete} />)}
                  </div>
                )}
                {inProgress.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">🔧 In Progress ({inProgress.length})</p>
                    {inProgress.map(e => <DiscrepancyRow key={e.id} entry={e} onBeginWork={handleBeginWork} onComplete={handleComplete} />)}
                  </div>
                )}
                {pendingRii.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest">🛡 Pending RII ({pendingRii.length})</p>
                    {pendingRii.map(e => <DiscrepancyRow key={e.id} entry={e} onBeginWork={handleBeginWork} onComplete={handleComplete} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* FAULTS TAB */}
        {tab === 'faults' && (
          <>
            {filteredFaults.length === 0 ? (
              <div className="text-center py-16">
                <Zap className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold">No active faults{stationFilter ? ` at ${stationFilter}` : ''}</p>
              </div>
            ) : filteredFaults.map(fault => (
              <div key={fault.id} className={cn('bg-card border rounded-xl px-4 py-3 space-y-1',
                fault.severity === 'warning' ? 'border-red-500/30' : fault.severity === 'caution' ? 'border-amber-500/30' : 'border-border')}>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded text-white',
                    fault.severity === 'warning' ? 'bg-red-700' : fault.severity === 'caution' ? 'bg-amber-700' : 'bg-blue-700')}>
                    {fault.severity?.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">{fault.aircraft_tail}</span>
                  <span className="text-xs font-bold text-foreground flex-1 ml-2">{fault.fault_code}</span>
                  <Link to="/TechOpsLogbook" className="text-[10px] font-bold text-primary hover:underline">Log Entry</Link>
                </div>
                <p className="text-xs text-muted-foreground">{fault.description}</p>
                {fault.ata_chapter && <p className="text-[10px] text-muted-foreground">ATA {fault.ata_chapter} · Detected: {fault.detected_at ? new Date(fault.detected_at).toLocaleString() : '—'}</p>}
              </div>
            ))}
          </>
        )}

        {/* PARTS & TOOLS TAB */}
        {tab === 'parts' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Parts Inventory Status</p>
                <Link to="/LineMaintenanceDashboard" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Full Inventory <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-red-400">{outOfStock.length}</p>
                  <p className="text-[10px] text-muted-foreground">Out of Stock</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-amber-400">{lowStock.length}</p>
                  <p className="text-[10px] text-muted-foreground">Low Stock</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-green-400">{inventory.length - lowStock.length}</p>
                  <p className="text-[10px] text-muted-foreground">Adequate</p>
                </div>
              </div>
              {[...outOfStock, ...lowStock.filter(i => !outOfStock.find(o => o.id === i.id))].slice(0, 8).map(item => (
                <div key={item.id} className={cn('flex items-center gap-3 bg-card border rounded-xl px-4 py-2.5 mb-1.5',
                  item.quantity_on_hand === 0 ? 'border-red-500/30' : 'border-amber-500/20')}>
                  <div className={cn('w-2 h-8 rounded-full flex-shrink-0', item.quantity_on_hand === 0 ? 'bg-red-500' : 'bg-amber-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.part_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{item.part_number} · ATA {item.ata_chapter || '—'} · {item.location || '—'}</p>
                  </div>
                  <p className={cn('text-lg font-black', item.quantity_on_hand === 0 ? 'text-red-400' : 'text-amber-400')}>{item.quantity_on_hand}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Tooling Status</p>
                <Link to="/ToolingManagement" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Manage Tools <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-blue-400">{toolsOut.length}</p>
                  <p className="text-[10px] text-muted-foreground">Checked Out</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-amber-400">{calDue.length}</p>
                  <p className="text-[10px] text-muted-foreground">Cal Due</p>
                </div>
                <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className="text-2xl font-black text-green-400">{tools.filter(t => t.status === 'available').length}</p>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                </div>
              </div>
              {toolsOut.slice(0, 5).map(tool => (
                <div key={tool.id} className="flex items-center gap-3 bg-card border border-blue-500/20 rounded-xl px-4 py-2.5 mb-1.5">
                  <Wrench className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{tool.name}</p>
                    <p className="text-[10px] text-muted-foreground">{tool.tool_number} · Assigned: {tool.assigned_to || '—'}</p>
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
              <p className="text-sm font-bold text-foreground">Recent Shift Handovers</p>
              <Link to="/ShiftHandover" className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                Full Handover Log <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {handovers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No handovers recorded</div>
            ) : handovers.map(h => (
              <div key={h.id} className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                      h.status === 'acknowledged' ? 'bg-green-500/15 text-green-400' :
                      h.status === 'submitted' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-gray-500/15 text-gray-400')}>
                      {h.status?.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{h.shift_period} shift</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{h.shift_date}</span>
                </div>
                <p className="text-sm font-bold text-foreground">{h.submitted_by}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{h.progress_summary}</p>
                {h.safety_critical_notes && (
                  <div className="bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 text-[10px] text-red-400 font-bold">
                    ⚠ {h.safety_critical_notes}
                  </div>
                )}
                {h.pending_issues?.length > 0 && (
                  <p className="text-[10px] text-amber-400">{h.pending_issues.length} pending issue{h.pending_issues.length > 1 ? 's' : ''} for next shift</p>
                )}
              </div>
            ))}
            <Link to="/ShiftHandover" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4" /> New Shift Handover
            </Link>
          </div>
        )}

        {/* WORK ASSIGNMENTS TAB */}
        {tab === 'work_assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Supply Requisitions & Work Orders</p>
              <Link to="/WorkAssignments" className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                Full Dashboard <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Pending Approval', value: requisitions.filter(r => r.status === 'pending_approval').length, color: 'text-amber-400' },
                { label: 'AOG Priority', value: requisitions.filter(r => r.priority === 'aog').length, color: 'text-red-400' },
                { label: 'In Transit', value: requisitions.filter(r => r.status === 'in_transit').length, color: 'text-blue-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-card border border-border rounded-xl px-3 py-3 text-center">
                  <p className={cn('text-2xl font-black', color)}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Requisition list */}
            {requisitions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No work requisitions found</div>
            ) : requisitions.slice(0, 10).map(req => {
              const priColor = { aog: 'bg-red-700', critical: 'bg-orange-600', routine: 'bg-gray-600' }[req.priority] || 'bg-gray-600';
              const stColor = {
                pending_approval: 'text-amber-400 bg-amber-500/15',
                approved: 'text-blue-400 bg-blue-500/15',
                ordered: 'text-cyan-400 bg-cyan-500/15',
                in_transit: 'text-purple-400 bg-purple-500/15',
                received: 'text-green-400 bg-green-500/15',
                cancelled: 'text-gray-400 bg-gray-500/10',
              }[req.status] || 'text-gray-400 bg-gray-500/10';
              return (
                <div key={req.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded text-white', priColor)}>{req.priority?.toUpperCase()}</span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', stColor)}>{req.status?.replace(/_/g, ' ').toUpperCase()}</span>
                      {req.aircraft_tail && <span className="text-[10px] font-mono font-bold text-primary">{req.aircraft_tail}</span>}
                    </div>
                    <p className="text-sm font-bold text-foreground">{req.part_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{req.part_number} · Qty: {req.quantity} · {req.station || '—'}</p>
                    {req.reason && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{req.reason}</p>}
                  </div>
                </div>
              );
            })}

            <Link to="/WorkAssignments" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
              View Full Work Assignment Dashboard <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* TECH ASSIGNMENT TAB */}
        {tab === 'tech_assignment' && (
          <TechAssignmentPanel
            aircraft={aircraft}
            discrepancies={discrepancies}
            onAssign={(id) => { const e = discrepancies.find(x => x.id === id); if (e) setAssignEntry(e); }}
          />
        )}
      </div>

      {assignEntry && (
        <QuickAssignModal entry={assignEntry} onClose={() => setAssignEntry(null)} onAssign={handleAssign} />
      )}
    </div>
  );
}