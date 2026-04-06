import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Wrench, Plane, AlertTriangle, CheckCircle, Clock, Plus,
  RefreshCw, ChevronLeft, FileText, Package, Users, Zap,
  BookOpen, Search, Filter, X, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_CFG = {
  open:          { label: 'OPEN',          color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  in_progress:   { label: 'IN PROGRESS',   color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  awaiting_parts:{ label: 'AWAITING PARTS',color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  deferred:      { label: 'DEFERRED',      color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  completed:     { label: 'COMPLETED',     color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
};

const PRIORITY_CFG = {
  aog:    { label: 'AOG',    color: 'text-red-300',    bg: 'bg-red-700' },
  high:   { label: 'HIGH',   color: 'text-orange-400', bg: 'bg-orange-600' },
  medium: { label: 'MED',    color: 'text-amber-400',  bg: 'bg-amber-600' },
  low:    { label: 'LOW',    color: 'text-gray-400',   bg: 'bg-gray-600' },
};

const ATA_CHAPTERS = [
  '21 — Air Conditioning','22 — Auto Flight','23 — Communications','24 — Electrical',
  '25 — Equipment','26 — Fire Protection','27 — Flight Controls','28 — Fuel',
  '29 — Hydraulics','30 — Ice & Rain','31 — Indicating Systems','32 — Landing Gear',
  '33 — Lights','34 — Navigation','35 — Oxygen','36 — Pneumatics',
  '49 — APU','52 — Doors','72 — Engine','73 — Engine Fuel & Control',
  '74 — Ignition','76 — Engine Controls','77 — Engine Indicating','78 — Exhaust','79 — Oil',
];

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

// ── New Task Modal ──────────────────────────────────────────────────────────
function NewTaskModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({
    aircraft_tail: '', station: '', ata_chapter: '', priority: 'medium',
    description: '', technician_name: '', estimated_hours: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.aircraft_tail || !form.description) return;
    onCreate({
      aircraft_tail: form.aircraft_tail,
      station: form.station,
      ata_chapter: form.ata_chapter.split(' —')[0],
      entry_type: 'discrepancy',
      description: `[LINE MX] ${form.description}` +
        (form.priority === 'aog' ? '\n⚠ AOG — AIRCRAFT ON GROUND' : '') +
        (form.estimated_hours ? `\nEst. man-hours: ${form.estimated_hours}h` : ''),
      technician_name: form.technician_name,
      notes: `Priority: ${form.priority.toUpperCase()} | Station: ${form.station}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">New Line Maintenance Task</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft *</label>
              <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required className={inputCls}>
                <option value="">Select tail…</option>
                {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
                <option value="aog">AOG — Aircraft on Ground</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <select value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {ATA_CHAPTERS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Description *</label>
            <textarea required rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the discrepancy or task…" className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Technician</label>
              <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)} placeholder="Name / ID" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Est. Man-Hours</label>
              <input type="number" min="0" value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)} placeholder="e.g. 2.5" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({ entry, onUpdateStatus }) {
  const isPriority = entry.notes?.includes('Priority:');
  const priority = entry.notes?.match(/Priority: (\w+)/)?.[1]?.toLowerCase() || 'medium';
  const priCfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;

  // Derive status from entry_type / is_cleared
  const derivedStatus = entry.is_cleared ? 'completed'
    : entry.entry_type === 'deferred' ? 'deferred'
    : entry.entry_type === 'corrective_action' ? 'in_progress'
    : 'open';
  const stCfg = STATUS_CFG[derivedStatus] || STATUS_CFG.open;

  const isLineMx = entry.description?.includes('[LINE MX]');

  return (
    <div className={cn('bg-[#141922] border rounded-2xl overflow-hidden transition-all', stCfg.border)}>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded text-white', priCfg.bg)}>{priCfg.label}</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', stCfg.bg, stCfg.color)}>{stCfg.label}</span>
            {entry.ata_chapter && <span className="text-[10px] text-gray-500">ATA {entry.ata_chapter}</span>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-mono font-extrabold text-primary">{entry.aircraft_tail}</p>
            {entry.station && <p className="text-[10px] text-gray-600">{entry.station}</p>}
          </div>
        </div>

        <p className="text-sm text-gray-200 leading-snug mb-2">
          {entry.description?.replace('[LINE MX]', '').replace(/\n.*/g, '').trim()}
        </p>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 text-[10px] text-gray-500">
            {entry.technician_name && <span>👤 {entry.technician_name}</span>}
            <span>{new Date(entry.created_date).toLocaleDateString()}</span>
          </div>
          {derivedStatus !== 'completed' && (
            <div className="flex gap-1.5">
              {derivedStatus === 'open' && (
                <button onClick={() => onUpdateStatus(entry.id, 'corrective_action')}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors">
                  Start Work
                </button>
              )}
              <button onClick={() => onUpdateStatus(entry.id, 'cleared')}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">
                Complete
              </button>
            </div>
          )}
          {derivedStatus === 'completed' && (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <CheckCircle className="w-3 h-3" /> Done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'active',    label: 'Active Tasks' },
  { id: 'aog',       label: 'AOG' },
  { id: 'completed', label: 'Completed' },
  { id: 'all',       label: 'All' },
];

export default function LineMaintenanceDashboard() {
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const qc = useQueryClient();

  const { data: aircraft = [] } = useQuery({
    queryKey: ['lmx-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['lmx-entries'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    select: (data) => data.filter(e => e.description?.includes('[LINE MX]')),
    refetchInterval: 30000,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['lmx-faults'],
    queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }),
    refetchInterval: 30000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['lmx-mel'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 200),
    select: data => data.filter(m => m.status !== 'cleared'),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lmx-entries'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, type }) => base44.entities.LogbookEntry.update(id, {
      entry_type: type === 'cleared' ? 'corrective_action' : type,
      is_cleared: type === 'cleared',
      cleared_date: type === 'cleared' ? TODAY : undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lmx-entries'] }),
  });

  // KPIs
  const active    = entries.filter(e => !e.is_cleared);
  const aog       = entries.filter(e => !e.is_cleared && e.notes?.includes('Priority: aog'));
  const completed = entries.filter(e => e.is_cleared);

  const oosAircraft = aircraft.filter(a => a.status === 'oos');
  const activeFaults = faults.length;
  const openMel   = melItems.length;

  // Filter display
  const getDisplayEntries = () => {
    let list = tab === 'active' ? active
      : tab === 'aog' ? aog
      : tab === 'completed' ? completed
      : entries;
    if (search) {
      list = list.filter(e =>
        e.aircraft_tail?.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.station?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  };

  const display = getDisplayEntries();

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0e18] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">LINE MAINTENANCE</p>
            <p className="text-[10px] text-orange-400 font-mono tracking-widest uppercase">Tasks · AOG · Faults · MEL</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-extrabold hover:bg-orange-500 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Task
          </button>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Tasks',   value: active.length,    color: active.length > 0 ? 'text-amber-400' : 'text-green-400', bg: 'bg-amber-600/15',  icon: Wrench },
            { label: 'AOG Aircraft',   value: aog.length + oosAircraft.length, color: (aog.length + oosAircraft.length) > 0 ? 'text-red-400' : 'text-green-400', bg: 'bg-red-600/15', icon: AlertTriangle },
            { label: 'Active Faults',  value: activeFaults,     color: activeFaults > 0 ? 'text-orange-400' : 'text-green-400', bg: 'bg-orange-600/15', icon: Zap },
            { label: 'Open MEL Items', value: openMel,          color: openMel > 0 ? 'text-blue-400' : 'text-green-400',        bg: 'bg-blue-600/15',   icon: FileText },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className={cn('rounded-2xl border border-white/10 p-4 flex items-center gap-3', bg)}>
              <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
              <div>
                <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links row */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: '⚡ Fault Messages', path: '/TechOpsLogbook', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
            { label: '📋 MEL Dashboard',  path: '/MEL',            color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
            { label: '🔧 Technician Mode',path: '/TechnicianMode', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
            { label: '✈ Fleet Status',    path: '/FleetDashboard', color: 'text-primary border-primary/30 bg-primary/10' },
            { label: '📦 Parts / MCC',    path: '/MaintenanceControl', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
          ].map(({ label, path, color }) => (
            <Link key={path} to={path} className={cn('text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors hover:brightness-125', color)}>
              {label}
            </Link>
          ))}
        </div>

        {/* AOG Aircraft Alert */}
        {oosAircraft.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-4 py-3">
            <p className="text-xs font-extrabold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> AOG / OOS Aircraft
            </p>
            <div className="flex flex-wrap gap-2">
              {oosAircraft.map(a => (
                <span key={a.id} className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-red-800/40 border border-red-500/30 text-red-300">
                  {a.tail_number} · {a.aircraft_type} · {a.base_station || '—'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search + Tabs */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tail, ATA, station…"
              className="w-full bg-[#141922] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn('px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex-shrink-0',
                  tab === t.id ? 'bg-orange-600 text-white' : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white')}>
                {t.label}
                {t.id === 'aog' && (aog.length + oosAircraft.length) > 0 && (
                  <span className="ml-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                    {aog.length + oosAircraft.length}
                  </span>
                )}
                {t.id === 'active' && active.length > 0 && (
                  <span className="ml-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                    {active.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="text-center text-gray-600 text-sm py-12">Loading tasks…</div>
        ) : display.length === 0 ? (
          <div className="rounded-2xl bg-[#141922] border border-white/10 py-16 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-green-500/30 mx-auto" />
            <p className="font-extrabold text-gray-500">
              {tab === 'active' ? 'No active tasks — fleet is clear' : 'No tasks found'}
            </p>
            <button onClick={() => setShowNew(true)}
              className="mt-2 px-5 py-2 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-500 transition-colors inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {display.map(entry => (
              <TaskCard
                key={entry.id}
                entry={entry}
                onUpdateStatus={(id, type) => updateStatusMutation.mutate({ id, type })}
              />
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewTaskModal
          aircraft={aircraft}
          onClose={() => setShowNew(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}