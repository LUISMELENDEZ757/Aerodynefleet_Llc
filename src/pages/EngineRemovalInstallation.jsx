import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Settings, AlertTriangle, CheckCircle, Zap, Wrench, Shield,
  ChevronLeft, Plus, Activity, X, Send, Clock, ChevronDown, BookOpen, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import WorkflowTimeline from '@/components/engine/WorkflowTimeline';
import TaskWorkflowCards from '@/components/engine/TaskWorkflowCards';
import PartsEngineStatus from '@/components/engine/PartsEngineStatus';
import ToolingReservations from '@/components/engine/ToolingReservations';
import QCRIIInspections from '@/components/engine/QCRIIInspections';
import { PHASES, computeCurrentPhase } from '@/lib/engineWorkflowState';

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <p className="text-3xl font-black font-mono text-primary tracking-widest">
        {String(now.getHours()).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}:{String(now.getSeconds()).padStart(2,'0')}
      </p>
      <p className="text-xs text-gray-400">{format(now, 'EEE, MMM d, yyyy')}</p>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, dotColor }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Icon className={cn('w-5 h-5', color)} />
        <span className={cn('w-2 h-2 rounded-full', dotColor)} />
      </div>
      <p className={cn('text-5xl font-black tracking-tight', color)}>{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{label}</p>
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  active:    { label: 'ACTIVE',     bg: 'bg-green-600',  border: 'border-green-500/40',  ring: 'bg-green-500' },
  on_hold:   { label: 'ON-HOLD',    bg: 'bg-orange-600', border: 'border-orange-500/40', ring: 'bg-orange-500' },
  pending:   { label: 'PENDING',    bg: 'bg-blue-600',   border: 'border-blue-500/40',   ring: 'bg-blue-500' },
  completed: { label: 'COMPLETED',  bg: 'bg-gray-600',   border: 'border-gray-500/40',   ring: 'bg-gray-400' },
};

const REMOVAL_REASONS = [
  'Chip Light Indication', 'Low Oil Pressure', 'High EGT Margin', 'Vibration Exceedance',
  'Foreign Object Damage', 'Scheduled Overhaul', 'LLP Life Limit', 'AD Compliance',
  'Service Bulletin', 'Stall/Surge Event', 'Oil Consumption', 'Other',
];

const ENGINE_POSITIONS = ['#1 (Left)', '#2 (Right)'];

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors';

// ── New Engine Event Modal ────────────────────────────────────────────────────
function NewEngineEventModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({
    aircraft_tail: '',
    aircraft_type: '',
    engine_type: '',
    airline: '',
    engine_position: '#1 (Left)',
    removed_sn: '',
    replacement_sn: '',
    removal_reason: 'Chip Light Indication',
    station: '',
    lead_tech: '',
    rii_inspector: '',
    status: 'active',
    notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // When user picks a tail, auto-fill engine type & aircraft type
  // Only clear airline/type/engine if user explicitly picks the blank option
  const handleTailChange = (tail) => {
    if (!tail) {
      // User selected the placeholder — clear everything
      setForm(p => ({ ...p, aircraft_tail: '', aircraft_type: '', engine_type: '', airline: '' }));
      return;
    }
    const ac = aircraft.find(a => a.tail_number === tail);
    setForm(p => ({
      ...p,
      aircraft_tail: tail,
      // Keep existing values if the aircraft record has no data
      aircraft_type: ac?.aircraft_type || p.aircraft_type,
      engine_type: ac?.engine_type || p.engine_type,
      airline: ac?.airline || p.airline,
    }));
  };

  // Group aircraft by airline for optgroup display (deduplicate by tail_number)
  const uniqueAircraft = Object.values(aircraft.reduce((acc, ac) => {
    if (!acc[ac.tail_number]) acc[ac.tail_number] = ac;
    return acc;
  }, {}));
  
  const groupedAircraft = uniqueAircraft.reduce((acc, ac) => {
    const key = ac.airline || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ac);
    return acc;
  }, {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      aircraft_tail: form.aircraft_tail,
      ata_chapter: '72',
      entry_type: 'info',
      station: form.station,
      description: [
        `[ENGINE REMOVAL] Position: ${form.engine_position}`,
        `Removal Reason: ${form.removal_reason}`,
        `Removed S/N: ${form.removed_sn}`,
        `Replacement S/N: ${form.replacement_sn || 'TBD'}`,
        form.notes ? `Notes: ${form.notes}` : '',
      ].filter(Boolean).join('\n'),
      technician_name: form.lead_tech,
      notes: `Status: ${form.status} | Position: ${form.engine_position} | RII: ${form.rii_inspector} | Station: ${form.station}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto" style={{ paddingTop: '1in' }}>
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <p className="font-extrabold text-white text-sm uppercase tracking-wide">New Engine Removal Event</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <div className="px-5 pt-4 pb-2">
          <div className="border border-orange-500/40 bg-orange-950/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-400 uppercase tracking-widest">⚠ Elogbook Verification Required</p>
                <p className="text-xs text-gray-300 mt-1">Before creating an engine removal event, verify that a discrepancy entry was made in the E-Logbook for this issue. All engine removals must be traceable to a documented discrepancy per 14 CFR Part 121.378.</p>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Aircraft Tail */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Aircraft Tail *</label>
            <select
              value={form.aircraft_tail}
              onChange={e => handleTailChange(e.target.value)}
              required
              className={inputCls}
            >
              <option value="">— Select aircraft tail —</option>
              {Object.entries(groupedAircraft).map(([airline, planes]) => (
                <optgroup key={airline} label={airline}>
                  {planes.map(a => (
                    <option key={a.id} value={a.tail_number}>
                      {a.tail_number} — {a.aircraft_type}{a.engine_type ? ` (${a.engine_type})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Auto-populated aircraft info — stays visible once set */}
            {(form.airline || form.aircraft_type || form.engine_type) && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Airline</p>
                  <p className="text-xs font-bold text-primary truncate">{form.airline || '—'}</p>
                </div>
                <div className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Type</p>
                  <p className="text-xs font-bold text-white truncate">{form.aircraft_type || '—'}</p>
                </div>
                <div className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Engine</p>
                  <p className="text-xs font-bold text-yellow-400 truncate">{form.engine_type || '—'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Engine Position */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Engine Position *</label>
            <select value={form.engine_position} onChange={e => set('engine_position', e.target.value)} className={inputCls}>
              {ENGINE_POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Serial numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Removed Engine S/N *</label>
              <input value={form.removed_sn} onChange={e => set('removed_sn', e.target.value)} placeholder="e.g. CFM56-7B27-908754" required className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Replacement Engine S/N</label>
              <input value={form.replacement_sn} onChange={e => set('replacement_sn', e.target.value)} placeholder="e.g. CFM56-7B27-912445" className={inputCls} />
            </div>
          </div>

          {/* Reason + Station */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Removal Reason *</label>
              <select value={form.removal_reason} onChange={e => set('removal_reason', e.target.value)} className={inputCls}>
                {REMOVAL_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Station *</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="e.g. KDAL Gate 12" required className={inputCls} />
            </div>
          </div>

          {/* Technicians */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Lead Technician</label>
              <input value={form.lead_tech} onChange={e => set('lead_tech', e.target.value)} placeholder="Name / License #" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">RII Inspector</label>
              <input value={form.rii_inspector} onChange={e => set('rii_inspector', e.target.value)} placeholder="Name / Cert #" className={inputCls} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => set('status', key)}
                  className={cn('px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                    form.status === key ? `${cfg.bg} text-white border-transparent` : 'border-white/10 text-gray-400 hover:text-white')}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes…" className={inputCls + ' resize-none'} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Airline Modal ────────────────────────────────────────────────────────
function EditAirlineModal({ fleet, onClose, onSave }) {
  const [name, setName] = useState(fleet?.name || '');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(fleet.id, { name });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">Edit Airline Name</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Airline Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
              placeholder="e.g. Aerodyne Express"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, isSelected, onSelect }) {
  const rawStatus = event.notes?.match(/Status: ([^|]+)/)?.[1]?.trim().toLowerCase().replace('-', '_') || 'active';
  const statusKey = Object.keys(STATUS).find(k => rawStatus.includes(k)) || 'active';
  const cfg = STATUS[statusKey];
  const position = event.notes?.match(/Position: ([^|]+)/)?.[1]?.trim() || '—';
  const riiName  = event.notes?.match(/RII: ([^|]+)/)?.[1]?.trim() || '—';

  return (
    <button onClick={() => onSelect(event)}
      className={cn(
        'rounded-2xl border p-4 text-left transition-all active:scale-95 w-full',
        isSelected ? 'border-primary bg-primary/10' : 'border-white/10 bg-[#141922] hover:border-white/20'
      )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-lg font-black text-primary font-mono leading-none">{event.aircraft_tail}</p>
          <p className="text-xs text-gray-400 mt-0.5">Engine {position}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full text-white flex-shrink-0', cfg.bg)}>
          {cfg.label}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 truncate">
        {event.description?.split('\n')[0]?.replace('[ENGINE REMOVAL]', '').trim()}
      </p>
      <p className="text-[10px] text-gray-600 mt-1">{new Date(event.created_date).toLocaleDateString()}</p>
    </button>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function EventDetail({ event }) {
  const lines = (event.description || '').split('\n');
  const getValue = (prefix) => lines.find(l => l.startsWith(prefix))?.replace(prefix, '').trim() || '—';
  const position    = event.notes?.match(/Position: ([^|]+)/)?.[1]?.trim() || '—';
  const riiInspector = event.notes?.match(/RII: ([^|]+)/)?.[1]?.trim() || '—';
  const station     = event.notes?.match(/Station: ([^|]+)/)?.[1]?.trim() || event.station || '—';
  const removedSN   = getValue('Removed S/N:');
  const replaceSN   = getValue('Replacement S/N:');
  const reason      = getValue('Removal Reason:');

  const INFO = [
    { label: 'Aircraft Tail',      value: event.aircraft_tail,      valueColor: 'text-primary text-2xl font-black' },
    { label: 'Engine Position',    value: position,                  valueColor: 'text-yellow-400 text-2xl font-black' },
    { label: 'Removed Engine S/N', value: removedSN,                 valueColor: 'text-gray-300' },
    { label: 'Replacement S/N',    value: replaceSN,                 valueColor: 'text-green-400' },
    { label: 'Removal Reason',     value: reason,                    valueColor: 'text-gray-300', dot: 'bg-red-500' },
    { label: 'Station',            value: station,                   valueColor: 'text-cyan-400' },
    { label: 'Lead Technician',    value: event.technician_name || '—', valueColor: 'text-gray-300' },
    { label: 'RII Inspector',      value: riiInspector,              valueColor: 'text-gray-300' },
  ];

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-5">
      <p className="text-lg font-extrabold text-primary flex items-center gap-2">
        <Settings className="w-5 h-5" /> Aircraft & Engine Information
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {INFO.map(({ label, value, valueColor, dot }) => (
          <div key={label}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-1.5">
              {dot && <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dot)} />}
              <p className={cn('font-bold', valueColor)}>{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 pt-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date Opened</p>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm">{new Date(event.created_date).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EngineRemovalInstallation() {
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFleetId, setSelectedFleetId] = useState(null);
  const [showFleetMenu, setShowFleetMenu] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [editingAirline, setEditingAirline] = useState(null);
  const qc = useQueryClient();

  // ── Workflow Logic State ──────────────────────────────────────────────────
  const [completedTasks, setCompletedTasks] = useState({});
  const [selectedPhaseId, setSelectedPhaseId] = useState('engine_removal');
  const currentPhaseId = computeCurrentPhase(completedTasks);

  const handleTaskComplete = (taskId, data) => {
    setCompletedTasks(prev => ({ ...prev, [taskId]: data }));
  };

  // Reset workflow state when selecting a different event
  useEffect(() => {
    setCompletedTasks({});
    setSelectedPhaseId('engine_removal');
  }, [selectedEvent?.id]);

  const phaseCompletions = PHASES.reduce((acc, phase) => {
    const allDone = phase.tasks.every(t => completedTasks[t.id]);
    if (allDone && phase.tasks.length > 0) {
      const last = phase.tasks[phase.tasks.length - 1];
      const lastComp = completedTasks[last.id];
      acc[phase.id] = { technician: lastComp?.name, time: lastComp?.dateTime?.split(',')[1]?.trim() };
    }
    return acc;
  }, {});

  const { data: fleets = [] } = useQuery({
    queryKey: ['engine-fleets'],
    queryFn: () => base44.entities.Fleet.list('name', 50),
    refetchInterval: 60000,
  });

  // Auto-select first fleet
  useEffect(() => {
    if (!selectedFleetId && fleets.length > 0) {
      setSelectedFleetId(fleets[0].id);
    }
  }, [fleets]);

  const selectedFleet = fleets.find(f => f.id === selectedFleetId);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['engine-removal-events'],
    queryFn: () => base44.entities.LogbookEntry.filter({ ata_chapter: '72' }, '-created_date', 200),
    refetchInterval: 30000,
  });

  // Real-time subscription for instant sync
  useEffect(() => {
    const unsubscribe = base44.entities.LogbookEntry.subscribe((event) => {
      if (event.data?.ata_chapter === '72' && event.data?.description?.includes('[ENGINE REMOVAL]')) {
        qc.invalidateQueries({ queryKey: ['engine-removal-events'] });
        if (event.type === 'create') {
          setSelectedEvent(event.data);
        }
      }
    });
    return unsubscribe;
  }, []);

  // All aircraft (for modal dropdown — unrestricted)
  const { data: allAircraft = [] } = useQuery({
    queryKey: ['engine-aircraft-all'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 300000,
  });

  // Fleet-filtered aircraft (for event list filtering)
  const { data: aircraft = [] } = useQuery({
    queryKey: ['engine-aircraft', selectedFleetId],
    queryFn: () => selectedFleetId
      ? base44.entities.Aircraft.filter({ fleet_id: selectedFleetId }, 'tail_number', 200)
      : base44.entities.Aircraft.list('tail_number', 200),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: (newEvent) => {
      qc.invalidateQueries({ queryKey: ['engine-removal-events'] });
      qc.invalidateQueries({ queryKey: ['engine-aircraft'] });
      setShowModal(false);
      setSelectedEvent(newEvent);
    },
  });

  const updateFleetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Fleet.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engine-fleets'] });
      setShowAirlineModal(false);
    },
  });

  // Filter events by fleet
  const engineEvents = events.filter(e => {
    if (!e.description?.includes('[ENGINE REMOVAL]')) return false;
    if (!selectedFleetId) return true;
    return aircraft.some(a => a.tail_number === e.aircraft_tail);
  });

  const activeCount    = engineEvents.filter(e => !e.notes?.includes('on_hold') && !e.notes?.includes('completed')).length;
  const onHoldCount    = engineEvents.filter(e => e.notes?.includes('on_hold')).length;
  const completedCount = engineEvents.filter(e => e.is_cleared).length;
  const enginesReady   = aircraft.filter(a => a.status === 'active' && a.engine_type).length;

  // Auto-select first event
  useEffect(() => {
    if (!selectedEvent && engineEvents.length > 0) setSelectedEvent(engineEvents[0]);
  }, [engineEvents, selectedEvent]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* ── HEADER ── */}
      <div className="border-b border-white/10 bg-[#0a0e18] px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mt-0.5">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                <h1 className="text-xl sm:text-2xl font-black text-primary tracking-widest uppercase">Engine Removal & Installation Dashboard</h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedFleet ? selectedFleet.name : 'Multi-Fleet'} • 
                {selectedFleet?.aircraft_types?.join(' • ') || 'All Aircraft'} • 
                Complete End-to-End Workflow
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">Timeline Tracking • Multi-Department Coordination • FAA Part 121.378 & Part 43 Compliant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Fleet Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFleetMenu(!showFleetMenu)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (selectedFleet) {
                    setEditingAirline(selectedFleet);
                    setShowAirlineModal(true);
                    setShowFleetMenu(false);
                  }
                }}
                className="flex items-center gap-2 bg-[#141922] border border-white/10 rounded-xl px-4 py-2 hover:border-white/20 transition-colors"
                title="Right-click to edit airline name"
              >
                <span className="text-xs font-bold text-white">{selectedFleet?.name || 'Select Fleet'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showFleetMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowFleetMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-[#141922] border border-white/10 rounded-xl overflow-hidden z-40 shadow-xl max-h-64 overflow-y-auto">
                    {fleets.map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedFleetId(f.id);
                          setShowFleetMenu(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-xs font-bold transition-colors',
                          selectedFleetId === f.id ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:bg-white/5'
                        )}
                      >
                        <p className="font-bold">{f.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{f.aircraft_types?.join(', ')}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <LiveClock />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Activity}      label="Active Events"    value={isLoading ? '…' : activeCount}    color="text-blue-400"   dotColor="bg-blue-400" />
          <KpiCard icon={AlertTriangle} label="On Hold"          value={isLoading ? '…' : onHoldCount}    color="text-orange-400" dotColor="bg-orange-400" />
          <KpiCard icon={CheckCircle}   label="Phases Complete"  value={isLoading ? '…' : completedCount} color="text-green-400"  dotColor="bg-green-400" />
          <KpiCard icon={Zap}           label="Engines Ready"    value={isLoading ? '…' : enginesReady}   color="text-cyan-400"   dotColor="bg-cyan-400" />
          <KpiCard icon={Wrench}        label="Tooling Avail"    value="100%"                             color="text-yellow-400" dotColor="bg-yellow-400" />
          <KpiCard icon={Shield}        label="RII Inspectors"   value="3"                                color="text-purple-400" dotColor="bg-purple-400" />
        </div>

        {/* ── EVENT CARDS ROW ── */}
        <div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {isLoading ? (
              <div className="text-gray-500 text-sm py-4">Loading events…</div>
            ) : engineEvents.length === 0 ? (
              <div className="bg-[#141922] border border-white/10 rounded-2xl px-6 py-8 text-center text-gray-500 text-sm flex-shrink-0 w-64">
                No engine events yet
              </div>
            ) : (
              engineEvents.map(ev => (
                <div key={ev.id} className="flex-shrink-0 w-52">
                  <EventCard event={ev} isSelected={selectedEvent?.id === ev.id} onSelect={setSelectedEvent} />
                </div>
              ))
            )}
            {/* New Engine Event Button */}
            <Link to="/PartInventory"
              className="flex-shrink-0 w-52 rounded-2xl bg-[#1a1f2e] border border-primary/30 hover:border-primary/60 transition-colors flex flex-col items-center justify-center gap-2 py-6 px-4">
              <Package className="w-8 h-8 text-primary" />
              <p className="text-sm font-extrabold text-primary text-center">Part Inventory</p>
            </Link>
            <button onClick={() => setShowModal(true)}
              className="flex-shrink-0 w-52 rounded-2xl bg-green-600 hover:bg-green-500 transition-colors flex flex-col items-center justify-center gap-2 py-6 px-4">
              <Plus className="w-8 h-8 text-white" />
              <p className="text-sm font-extrabold text-white text-center">New Engine Event</p>
            </button>
          </div>
        </div>

        {/* ── WORKFLOW TIMELINE ── */}
        {selectedEvent ? (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <Settings className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Workflow for</p>
                <p className="text-sm font-extrabold text-white">{selectedEvent.aircraft_tail} · Engine {selectedEvent.notes?.match(/Position: ([^|]+)/)?.[1]?.trim() || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500">Opened</p>
                <p className="text-xs font-bold text-white">{new Date(selectedEvent.created_date).toLocaleDateString()}</p>
              </div>
            </div>
            <WorkflowTimeline
              currentPhaseId={currentPhaseId}
              completedTasks={completedTasks}
              phaseCompletions={phaseCompletions}
              onSelectPhase={setSelectedPhaseId}
            />
          </div>
        ) : (
          <WorkflowTimeline
            currentPhaseId={currentPhaseId}
            completedTasks={completedTasks}
            phaseCompletions={phaseCompletions}
            onSelectPhase={setSelectedPhaseId}
          />
        )}

        {/* ── TASK WORKFLOW CARDS ── */}
        <TaskWorkflowCards
          selectedPhaseId={selectedPhaseId}
          completedTasks={completedTasks}
          onTaskComplete={handleTaskComplete}
        />

        {/* ── PARTS & TOOLING ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PartsEngineStatus />
          <ToolingReservations />
        </div>

        {/* ── QC/RII INSPECTIONS ── */}
        <QCRIIInspections
          completedTasks={completedTasks}
          currentPhaseId={currentPhaseId}
        />

        {/* ── DETAIL PANEL ── */}
        {selectedEvent && selectedEvent.description?.includes('[ENGINE REMOVAL]') && (
          <EventDetail event={selectedEvent} />
        )}

        {/* ── ALL EVENTS TABLE ── */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="font-extrabold text-white">Engine Event Log — ATA 72</p>
            <span className="text-xs text-gray-500">{engineEvents.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Aircraft Tail','Engine Position','Removed S/N','Replacement S/N','Removal Reason','Station','Lead Tech','Status','Date'].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {engineEvents.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-8 text-gray-500">No engine events — click "New Engine Event" to create one</td></tr>
                ) : engineEvents.map(ev => {
                  const lines = (ev.description || '').split('\n');
                  const getValue = (prefix) => lines.find(l => l.startsWith(prefix))?.replace(prefix, '').trim() || '—';
                  const rawStatus = ev.notes?.match(/Status: ([^|]+)/)?.[1]?.trim() || 'active';
                  const statusKey = Object.keys(STATUS).find(k => rawStatus.toLowerCase().includes(k)) || 'active';
                  const cfg = STATUS[statusKey];
                  return (
                    <tr key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={cn('hover:bg-white/5 transition-colors cursor-pointer', selectedEvent?.id === ev.id && 'bg-primary/5')}>
                      <td className="py-3 px-4 font-bold text-primary font-mono">{ev.aircraft_tail}</td>
                      <td className="py-3 px-4 text-yellow-400 font-bold">{ev.notes?.match(/Position: ([^|]+)/)?.[1]?.trim() || '—'}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-xs">{getValue('Removed S/N:')}</td>
                      <td className="py-3 px-4 text-green-400 font-mono text-xs">{getValue('Replacement S/N:')}</td>
                      <td className="py-3 px-4 text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          {getValue('Removal Reason:')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cyan-400">{ev.station || '—'}</td>
                      <td className="py-3 px-4 text-gray-400">{ev.technician_name || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full text-white', cfg.bg)}>{cfg.label}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs whitespace-nowrap">{new Date(ev.created_date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <NewEngineEventModal
          aircraft={allAircraft}
          onClose={() => setShowModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}

      {showAirlineModal && editingAirline && (
        <EditAirlineModal
          fleet={editingAirline}
          onClose={() => {
            setShowAirlineModal(false);
            setEditingAirline(null);
          }}
          onSave={(id, data) => updateFleetMutation.mutate({ id, data })}
        />
      )}
    </div>
  );
}