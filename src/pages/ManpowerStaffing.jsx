import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Users, UserCheck, Coffee, Navigation2, GraduationCap,
  AlertTriangle, Plus, Search, MapPin, Pencil, X, RefreshCw, Shield,
  Wrench, Clock, CheckCircle, Zap, MoreHorizontal, Trash2, Plane,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="text-right">
      <p className="text-[9px] font-extrabold text-cyan-400 tracking-widest uppercase">Aerodyne Fleet</p>
      <p className="text-lg font-black text-white font-mono tracking-wider">
        {t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  on_duty:    { label: 'On Duty',     color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   border: 'border-cyan-500/40',   dot: 'bg-cyan-400' },
  assigned:   { label: 'Assigned',    color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40',  dot: 'bg-green-400' },
  available:  { label: 'Available',   color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   dot: 'bg-blue-400' },
  on_break:   { label: 'On Break',    color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/40',  dot: 'bg-amber-400' },
  in_transit: { label: 'In Transit',  color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40', dot: 'bg-purple-400' },
  training:   { label: 'Training',    color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', dot: 'bg-indigo-400' },
  aog:        { label: 'AOG Response',color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/40',    dot: 'bg-red-400 animate-pulse' },
  off_duty:   { label: 'Off Duty',    color: 'text-gray-500',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   dot: 'bg-gray-500' },
};

const KPI_ITEMS = [
  { status: 'on_duty',    label: 'On Duty',      icon: Users,       iconColor: 'text-cyan-400',   bg: 'bg-[#0f2030] border-cyan-500/30' },
  { status: 'assigned',   label: 'Assigned',     icon: UserCheck,   iconColor: 'text-green-400',  bg: 'bg-[#0f2218] border-green-500/30' },
  { status: 'available',  label: 'Available',    icon: Zap,         iconColor: 'text-blue-400',   bg: 'bg-[#0f1828] border-blue-500/30' },
  { status: 'on_break',   label: 'On Break',     icon: Coffee,      iconColor: 'text-amber-400',  bg: 'bg-[#1f1a0a] border-amber-500/30' },
  { status: 'in_transit', label: 'In Transit',   icon: Navigation2, iconColor: 'text-purple-400', bg: 'bg-[#160f28] border-purple-500/30' },
  { status: 'training',   label: 'Training',     icon: GraduationCap, iconColor: 'text-indigo-400', bg: 'bg-[#0f1020] border-indigo-500/30' },
  { status: 'aog',        label: 'AOG Response', icon: AlertTriangle, iconColor: 'text-red-400',  bg: 'bg-[#200a0a] border-red-500/30' },
];

const STATIONS = ['All Stations', 'KEWR', 'KJFK', 'KLAX', 'KORD', 'KATL', 'KSFO', 'KDEN', 'KDFW', 'KMIA', 'KBOS', 'KSEA', 'KIAH'];

const CERT_COLORS = {
  'A&P': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'IA':  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Avionics': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Airframe': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Powerplant': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'NDT': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'RII': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Lead A&P': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};
function certClass(c) { return CERT_COLORS[c] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'; }

// Initials avatar
function Avatar({ name, status }) {
  const initials = name ? name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() : '??';
  const colors = ['bg-cyan-600','bg-blue-600','bg-green-600','bg-purple-600','bg-amber-600','bg-red-600','bg-indigo-600'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 relative', color)}>
      {initials}
      <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d1117]', STATUS_CFG[status]?.dot || 'bg-gray-500')} />
    </div>
  );
}

// ── Add/Edit Technician Modal ─────────────────────────────────────────────────
const CERT_OPTIONS = ['A&P', 'IA', 'Avionics', 'Lead A&P', 'Airframe', 'Powerplant', 'NDT', 'RII'];
const STATUS_OPTIONS = Object.keys(STATUS_CFG);

function TechModal({ tech, onClose, onSave }) {
  const [form, setForm] = useState(tech || {
    name: '', employee_id: '', station: 'KEWR', years_experience: 0,
    certifications: [], specialty: '', status: 'available',
    current_assignment: '', shift_hours_remaining: 8, notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleCert = (c) => set('certifications', form.certifications?.includes(c)
    ? form.certifications.filter(x => x !== c)
    : [...(form.certifications || []), c]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <p className="font-extrabold text-white text-sm uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            {tech?.id ? 'Edit Technician' : 'Add Technician'}
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Employee ID</label>
              <input value={form.employee_id || ''} onChange={e => set('employee_id', e.target.value)}
                placeholder="e.g. KN-5598"
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Station</label>
              <select value={form.station || ''} onChange={e => set('station', e.target.value)}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50">
                {STATIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Years Experience</label>
              <input type="number" value={form.years_experience || 0} onChange={e => set('years_experience', Number(e.target.value))}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Specialty / Title</label>
              <input value={form.specialty || ''} onChange={e => set('specialty', e.target.value)}
                placeholder="e.g. Lead A&P / Avionics"
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Current Assignment</label>
              <input value={form.current_assignment || ''} onChange={e => set('current_assignment', e.target.value)}
                placeholder="e.g. N801EB"
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Shift Hours Remaining</label>
              <input type="number" step="0.5" value={form.shift_hours_remaining ?? 8} onChange={e => set('shift_hours_remaining', Number(e.target.value))}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => toggleCert(c)}
                  className={cn('text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all',
                    form.certifications?.includes(c) ? certClass(c) : 'border-white/10 text-gray-600 hover:text-gray-400')}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
            <textarea rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none focus:border-cyan-500/50" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-white/10 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button disabled={!form.name} onClick={() => onSave(form)}
            className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 disabled:opacity-40 transition-colors">
            {tech?.id ? 'Save Changes' : 'Add Technician'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Actions Dropdown ──────────────────────────────────────────────────────────
function ActionsMenu({ tech, onEdit, onDelete, onChangeStatus, onAssign }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        // Delay so click handlers on menu items fire first
        setTimeout(() => setOpen(false), 100);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(v => !v);
  };

  const statusOptions = Object.entries(STATUS_CFG).filter(([k]) => k !== tech.status);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-blue-400" />
      </button>

      {open && (
        <div
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="bg-[#141922] border border-white/10 rounded-xl shadow-2xl min-w-[210px] py-1 overflow-hidden"
        >
          {/* Edit */}
          <button onClick={() => { onEdit(tech); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            <Pencil className="w-3.5 h-3.5 text-blue-400" /> Edit Details
          </button>

          {/* Assign Aircraft */}
          <button onClick={() => { onAssign(tech); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            <Plane className="w-3.5 h-3.5 text-cyan-400" /> Assign Aircraft
          </button>

          {/* Change Status */}
          <div className="border-t border-white/8 mt-1 pt-1">
            <p className="px-4 py-1 text-[9px] font-extrabold text-gray-600 uppercase tracking-widest">Change Status</p>
            {statusOptions.map(([key, cfg]) => (
              <button key={key} onClick={() => { onChangeStatus(tech, key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Delete */}
          <div className="border-t border-white/8 mt-1 pt-1">
            <button onClick={() => { onDelete(tech); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Remove Technician
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Assign Aircraft Modal ─────────────────────────────────────────────────────
function AssignModal({ tech, aircraft, onClose, onSave }) {
  const [tail, setTail] = useState(tech.current_assignment || '');
  const [task, setTask] = useState('Support');
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-widest flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" /> Assign Aircraft
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
            <Avatar name={tech.name} status={tech.status} />
            <div>
              <p className="text-sm font-extrabold text-white">{tech.name}</p>
              <p className="text-[10px] text-gray-500">{tech.employee_id} · {tech.station}</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Aircraft Tail</label>
            <select value={tail} onChange={e => setTail(e.target.value)}
              className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50">
              <option value="">— Unassign —</option>
              {aircraft.map(a => (
                <option key={a.id} value={a.tail_number}>{a.tail_number} · {a.aircraft_type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Task / Role</label>
            <input value={task} onChange={e => setTask(e.target.value)}
              placeholder="e.g. Support, Line Check, RON"
              className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button onClick={() => onSave(tech, tail, task)}
            className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 transition-colors">
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Technician Row ─────────────────────────────────────────────────────────────
function TechRow({ tech, onEdit, onDelete, onChangeStatus, onAssign }) {
  const sc = STATUS_CFG[tech.status] || STATUS_CFG.off_duty;
  const certs = tech.certifications || [];
  const visibleCerts = certs.slice(0, 3);
  const extraCerts = certs.length - 3;

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors group">
      {/* Technician */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={tech.name} status={tech.status} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-extrabold text-white">{tech.name}</p>
              {tech.status === 'aog' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <p className="text-[10px] text-gray-500 font-mono">{tech.employee_id || '—'}</p>
            <p className="text-[10px] text-gray-600">{tech.years_experience ? `${tech.years_experience} years exp` : ''}</p>
          </div>
        </div>
      </td>

      {/* Station */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
          <MapPin className="w-3.5 h-3.5 text-gray-500" />
          {tech.station || '—'}
        </div>
      </td>

      {/* Certifications */}
      <td className="px-4 py-4">
        <div>
          {tech.specialty && <p className="text-xs font-bold text-cyan-300 mb-1">{tech.specialty}</p>}
          <div className="flex flex-wrap gap-1">
            {visibleCerts.map(c => (
              <span key={c} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border', certClass(c))}>{c}</span>
            ))}
            {extraCerts > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 text-gray-500">+{extraCerts}</span>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <div>
          <span className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full w-fit', sc.bg, sc.color, sc.border, 'border')}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', sc.dot)} />
            {sc.label}
          </span>
          {tech.shift_hours_remaining != null && (
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {tech.shift_hours_remaining}h remaining
            </p>
          )}
        </div>
      </td>

      {/* Current Assignment */}
      <td className="px-4 py-4">
        {tech.current_assignment ? (
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-3 py-2 min-w-[100px]">
            <p className="text-sm font-extrabold text-green-300 font-mono">{tech.current_assignment}</p>
            <p className="text-[9px] text-green-500/70">Support</p>
          </div>
        ) : (
          <span className="text-[10px] text-gray-600">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <ActionsMenu tech={tech} onEdit={onEdit} onDelete={onDelete} onChangeStatus={onChangeStatus} onAssign={onAssign} />
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManpowerStaffing() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTech, setEditTech] = useState(null);
  const [assignTech, setAssignTech] = useState(null);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['manpower-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 300000,
  });

  const { data: technicians = [], isLoading, refetch } = useQuery({
    queryKey: ['manpower-technicians'],
    queryFn: () => base44.entities.TrainingRecord.list('-created_date', 500),
    // Use TrainingRecord as proxy — maps role/name/station fields
    select: (data) => data.map(r => ({
      id: r.id,
      name: r.employee_name || r.crew_name || 'Unknown',
      employee_id: r.employee_id || '',
      station: r.station || 'KEWR',
      years_experience: r.years_experience || 0,
      certifications: r.certifications || [],
      specialty: r.specialty || '',
      status: r.duty_status || 'available',
      current_assignment: r.current_aircraft || '',
      shift_hours_remaining: r.shift_hours_remaining ?? 8,
      notes: r.notes || '',
    })),
    refetchInterval: 60000,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        employee_name: data.name,
        employee_id: data.employee_id,
        station: data.station,
        years_experience: data.years_experience,
        certifications: data.certifications,
        specialty: data.specialty,
        duty_status: data.status,
        current_aircraft: data.current_assignment,
        shift_hours_remaining: data.shift_hours_remaining,
        notes: data.notes,
      };
      return data.id
        ? base44.entities.TrainingRecord.update(data.id, payload)
        : base44.entities.TrainingRecord.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manpower-technicians'] });
      setShowModal(false);
      setEditTech(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingRecord.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manpower-technicians'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.TrainingRecord.update(id, { duty_status: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manpower-technicians'] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, tail }) => base44.entities.TrainingRecord.update(id, {
      current_aircraft: tail,
      duty_status: tail ? 'assigned' : 'available',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manpower-technicians'] });
      setAssignTech(null);
    },
  });

  const handleEdit = (tech) => { setEditTech(tech); setShowModal(true); };
  const handleNew  = () => { setEditTech(null); setShowModal(true); };
  const handleDelete = (tech) => { if (confirm(`Remove ${tech.name} from the roster?`)) deleteMutation.mutate(tech.id); };
  const handleChangeStatus = (tech, newStatus) => statusMutation.mutate({ id: tech.id, status: newStatus });
  const handleAssign = (tech) => setAssignTech(tech);
  const handleAssignSave = (tech, tail) => assignMutation.mutate({ id: tech.id, tail });

  // KPI counts
  const counts = KPI_ITEMS.reduce((acc, k) => {
    acc[k.status] = technicians.filter(t => t.status === k.status).length;
    return acc;
  }, {});
  const totalOnDuty = technicians.filter(t => t.status !== 'off_duty').length;

  // Filtered list
  const filtered = technicians.filter(t => {
    const matchStatus  = statusFilter === 'all' || t.status === statusFilter;
    const matchStation = stationFilter === 'All Stations' || t.station === stationFilter;
    const q = search.toLowerCase();
    const matchSearch  = !search ||
      t.name?.toLowerCase().includes(q) ||
      t.employee_id?.toLowerCase().includes(q) ||
      t.station?.toLowerCase().includes(q) ||
      t.certifications?.some(c => c.toLowerCase().includes(q)) ||
      t.specialty?.toLowerCase().includes(q);
    return matchStatus && matchStation && matchSearch;
  });

  // Filter tab config
  const filterTabs = [
    { id: 'all',       label: `All (${technicians.length})` },
    { id: 'on_duty',   label: `On Duty (${counts.on_duty || 0})` },
    { id: 'assigned',  label: `Assigned (${counts.assigned || 0})` },
    { id: 'available', label: `Available (${counts.available || 0})` },
    { id: 'off_duty',  label: `Off Duty (${technicians.filter(t => t.status === 'off_duty').length})` },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-white pb-24">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-white/8 bg-gradient-to-r from-[#0a1628] via-[#0d1f3c] to-[#081428]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/WorkAssignments"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-wide uppercase">Manpower & Staffing</h1>
              <p className="text-[10px] text-cyan-400/80 tracking-widest uppercase">Technician Management & Assignment Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-extrabold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
              <Plus className="w-4 h-4" /> Add Technician
            </button>
            <button onClick={() => refetch()} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20">
              <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
            </button>
            <LiveClock />
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="px-5 pt-4 pb-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {KPI_ITEMS.map(({ status, label, icon: Icon, iconColor, bg }) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={cn('rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all hover:brightness-110',
              bg, statusFilter === status ? 'ring-2 ring-white/30' : '')}>
            <Icon className={cn('w-5 h-5', iconColor)} />
            <p className={cn('text-2xl font-black leading-none', iconColor)}>{counts[status] || 0}</p>
            <p className="text-[9px] font-bold text-gray-400 text-center leading-tight">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="px-5 py-3 flex items-center gap-2 flex-wrap border-b border-white/8">
        <div className="flex items-center gap-1">
          {filterTabs.map(tab => (
            <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
              className={cn('text-[10px] font-extrabold px-3 py-2 rounded-xl transition-all',
                statusFilter === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-[#141922] border border-white/8 text-gray-400 hover:text-white')}>
              {tab.label}
            </button>
          ))}
        </div>

        <select value={stationFilter} onChange={e => setStationFilter(e.target.value)}
          className="bg-[#141922] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50 min-w-[130px]">
          {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-2 bg-[#141922] border border-white/10 rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, employee #, cert…"
            className="bg-transparent text-xs text-white placeholder-gray-600 outline-none flex-1 min-w-0" />
        </div>

        <span className="text-[10px] text-gray-600 ml-auto">{filtered.length} technicians</span>
      </div>

      {/* ── Table ── */}
      <div className="px-5 pt-3">
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-[#111827]">
                {['TECHNICIAN','STATION / GATE','CERTIFICATION','STATUS','CURRENT ASSIGNMENT','ACTIONS'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-600">Loading technicians…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">No technicians found</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {technicians.length === 0 ? 'Click "+ Add Technician" to get started' : 'Try adjusting your filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(tech => (
                  <TechRow key={tech.id} tech={tech} onEdit={handleEdit}
                    onDelete={handleDelete} onChangeStatus={handleChangeStatus} onAssign={handleAssign} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <p className="text-[10px] text-gray-600 text-center mt-3">
            Showing {filtered.length} of {technicians.length} technicians
          </p>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {showModal && (
        <TechModal
          tech={editTech}
          onClose={() => { setShowModal(false); setEditTech(null); }}
          onSave={(data) => saveMutation.mutate(data)}
        />
      )}

      {/* ── Assign Modal ── */}
      {assignTech && (
        <AssignModal
          tech={assignTech}
          aircraft={aircraft}
          onClose={() => setAssignTech(null)}
          onSave={handleAssignSave}
        />
      )}
    </div>
  );
}