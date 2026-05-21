import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useStations } from '@/hooks/useStations';
import { Link } from 'react-router-dom';
import {
  Users, Plus, Search, X, Trash2, Pencil, ChevronDown,
  ChevronLeft, ChevronRight, Calendar, List, RefreshCw,
  MapPin, Plane, Clock, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  on_duty:    { label: 'On Duty',      color: 'text-cyan-300',   bg: 'bg-cyan-500/20',   border: 'border-cyan-500/40',   dot: 'bg-cyan-400',   icon: '▲' },
  assigned:   { label: 'On Job',       color: 'text-green-300',  bg: 'bg-green-500/20',  border: 'border-green-500/40',  dot: 'bg-green-400',  icon: '▲' },
  available:  { label: 'Available',    color: 'text-blue-300',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   dot: 'bg-blue-400',   icon: '●' },
  on_break:   { label: 'On Break',     color: 'text-amber-300',  bg: 'bg-amber-500/20',  border: 'border-amber-500/40',  dot: 'bg-amber-400',  icon: '■' },
  in_transit: { label: 'In Transit',   color: 'text-purple-300', bg: 'bg-purple-500/20', border: 'border-purple-500/40', dot: 'bg-purple-400', icon: '►' },
  training:   { label: 'Training',     color: 'text-indigo-300', bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', dot: 'bg-indigo-400', icon: '►' },
  aog:        { label: 'AOG Response', color: 'text-red-300',    bg: 'bg-red-500/20',    border: 'border-red-500/40',    dot: 'bg-red-400 animate-pulse', icon: '⚠' },
  off_duty:   { label: 'Day Off',      color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   dot: 'bg-gray-500',   icon: '▼' },
};

const SHIFTS = ['Day', 'Mid', 'Night', 'Swing', 'On-Call'];
const CERT_OPTIONS = ['A&P', 'IA', 'Avionics', 'Lead A&P', 'ETOPS', 'CAT II/III', 'Run/Taxi', 'Fuel Tank', 'Inspector', 'NDT', 'RII', 'Airframe', 'Powerplant'];
const STATUS_OPTIONS = Object.keys(STATUS_CFG);

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 8 }) {
  const initials = name ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '??';
  const colors = ['bg-cyan-600', 'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={cn(`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0`, color)}>
      {initials}
    </div>
  );
}

// ── Status Badge with Dropdown ─────────────────────────────────────────────────
function StatusDropdown({ tech, onChange }) {
  const [open, setOpen] = useState(false);
  const sc = STATUS_CFG[tech.status] || STATUS_CFG.off_duty;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all', sc.bg, sc.border, sc.color)}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', sc.dot)} />
        {sc.label}
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#1a2235] border border-white/10 rounded-xl shadow-2xl min-w-[160px] py-1 overflow-hidden">
          {STATUS_OPTIONS.map(key => {
            const cfg = STATUS_CFG[key];
            return (
              <button key={key} onClick={() => { onChange(tech, key); setOpen(false); }}
                className={cn('w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold hover:bg-white/10 transition-colors', cfg.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Add/Edit Technician Modal ──────────────────────────────────────────────────
function TechModal({ tech, onClose, onSave, stationList = [] }) {
  const [form, setForm] = useState(tech || {
    name: '', employee_id: '', station: '', shift: 'Day',
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
                placeholder="e.g. Luis Martinez"
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Employee ID</label>
              <input value={form.employee_id || ''} onChange={e => set('employee_id', e.target.value)}
                placeholder="e.g. OS-10123"
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Station</label>
              <select value={form.station || ''} onChange={e => set('station', e.target.value)}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50">
                <option value="">— Select Station —</option>
                {stationList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Shift</label>
              <select value={form.shift || 'Day'} onChange={e => set('shift', e.target.value)}
                className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50">
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Qualifications</label>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => toggleCert(c)}
                  className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all',
                    form.certifications?.includes(c)
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'border-white/10 text-gray-600 hover:text-gray-400')}>
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

// ── Technician Row ─────────────────────────────────────────────────────────────
function TechRow({ tech, onEdit, onDelete, onChangeStatus }) {
  const certs = tech.certifications || [];
  const visible = certs.slice(0, 3);
  const extra = certs.length - 3;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      {/* Name */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={tech.name} size={8} />
          <div>
            <p className="text-sm font-bold text-white">{tech.name}</p>
            <p className="text-[10px] text-cyan-400/80 font-mono">{tech.email || `${tech.name?.toLowerCase().replace(/ /g, '.')}@aerodyne.example`}</p>
          </div>
        </div>
      </td>
      {/* Emp ID */}
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-cyan-300">{tech.employee_id || '—'}</span>
      </td>
      {/* Station */}
      <td className="px-4 py-3">
        <span className="text-xs font-bold text-white">{tech.station || '—'}</span>
      </td>
      {/* Shift */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-300">{tech.shift || 'Day'}</span>
      </td>
      {/* Quals */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {visible.map(c => (
            <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">{c}</span>
          ))}
          {extra > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-500/15 text-gray-400 border border-gray-500/20">+{extra}</span>}
          {certs.length === 0 && <span className="text-[10px] text-gray-600">—</span>}
        </div>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <StatusDropdown tech={tech} onChange={onChangeStatus} />
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(tech)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <Pencil className="w-3 h-3" /> Docs
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onDelete(tech); setConfirmDelete(false); }}
                className="px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-500">Yes</button>
              <button onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-[10px] font-bold">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors px-1">
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Assignment Board (Calendar) ────────────────────────────────────────────────
function AssignmentBoard({ technicians, aircraft, onAssign }) {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);

  // Build 7-day week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i + weekOffset * 7);
    return d;
  });

  const [dragging, setDragging] = useState(null); // { techId }
  const [assignments, setAssignments] = useState({}); // { "techId-dateStr": tailNumber }
  const [selectedCell, setSelectedCell] = useState(null); // { techId, dateStr }
  const [cellPickerTail, setCellPickerTail] = useState('');

  const getKey = (techId, dateStr) => `${techId}-${dateStr}`;
  const dateStr = (d) => d.toISOString().split('T')[0];

  const handleDrop = (e, techId, day) => {
    e.preventDefault();
    const tail = e.dataTransfer.getData('tail');
    if (!tail || !techId) return;
    const key = getKey(techId, dateStr(day));
    setAssignments(prev => ({ ...prev, [key]: tail }));
  };

  const handleCellClick = (techId, day) => {
    const key = getKey(techId, dateStr(day));
    setSelectedCell({ techId, dateStr: dateStr(day), key });
    setCellPickerTail(assignments[key] || '');
  };

  const handleAssignCell = () => {
    if (!selectedCell) return;
    setAssignments(prev => ({ ...prev, [selectedCell.key]: cellPickerTail || undefined }));
    setSelectedCell(null);
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = dateStr(today);

  // Group technicians by station for display
  const stations = [...new Set(technicians.map(t => t.station || 'KEWR'))].sort();

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div>
          <h2 className="text-base font-extrabold text-white">Assignment Board</h2>
          <p className="text-xs text-gray-500">Drag aircraft tails onto technician cells to assign workload</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(0)}
            className="text-xs font-bold px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white">Today</button>
          <button onClick={() => setWeekOffset(v => v - 1)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-gray-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white min-w-[180px] text-center">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekOffset(v => v + 1)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-gray-300">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aircraft palette — drag source */}
      <div className="px-5">
        <div className="bg-[#111827] border border-white/8 rounded-xl p-3">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Aircraft — drag onto calendar cells</p>
          <div className="flex flex-wrap gap-2">
            {aircraft.slice(0, 30).map(a => (
              <div
                key={a.id}
                draggable
                onDragStart={e => e.dataTransfer.setData('tail', a.tail_number)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2235] border border-white/10 cursor-grab active:cursor-grabbing hover:border-cyan-500/40 transition-colors select-none"
              >
                <Plane className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-bold text-white font-mono">{a.tail_number}</span>
                <span className="text-[10px] text-gray-500">{a.aircraft_type?.replace('B737-', '737-').replace('B', '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board grid */}
      <div className="px-5 pb-6 overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left px-4 py-2 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest bg-[#0d1117] sticky left-0 z-10 w-52 border-b border-r border-white/8">
                Technician
              </th>
              {weekDays.map((day, i) => {
                const isToday = dateStr(day) === todayStr;
                return (
                  <th key={i} className={cn('px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest border-b border-r border-white/8 min-w-[110px]',
                    isToday ? 'bg-cyan-500/10 text-cyan-300' : 'bg-[#0d1117] text-gray-500')}>
                    <div>{dayLabels[day.getDay()]}</div>
                    <div className={cn('text-base font-black', isToday ? 'text-cyan-300' : 'text-white')}>
                      {day.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {stations.map(station => {
              const stationTechs = technicians.filter(t => (t.station || 'KEWR') === station);
              return [
                // Station header row
                <tr key={`station-${station}`}>
                  <td colSpan={8} className="px-4 py-1.5 bg-[#141922] border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{station}</span>
                      <span className="text-[9px] text-gray-600">({stationTechs.length} techs)</span>
                    </div>
                  </td>
                </tr>,
                // Tech rows
                ...stationTechs.map(tech => {
                  const sc = STATUS_CFG[tech.status] || STATUS_CFG.off_duty;
                  return (
                    <tr key={tech.id} className="group">
                      {/* Tech name cell */}
                      <td className="px-4 py-2 bg-[#0d1117] border-b border-r border-white/5 sticky left-0 z-10">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={tech.name} size={7} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{tech.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border', sc.bg, sc.color, sc.border)}>
                                {sc.label}
                              </span>
                              <span className="text-[9px] text-gray-600">{tech.shift || 'Day'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Day cells */}
                      {weekDays.map((day, i) => {
                        const key = getKey(tech.id, dateStr(day));
                        const assigned = assignments[key];
                        const isToday = dateStr(day) === todayStr;
                        const isSelected = selectedCell?.key === key;
                        return (
                          <td
                            key={i}
                            className={cn('border-b border-r border-white/5 p-1 min-h-[52px] cursor-pointer transition-colors',
                              isToday ? 'bg-cyan-500/5' : 'bg-[#0d1117]',
                              isSelected ? 'ring-2 ring-inset ring-cyan-500' : 'hover:bg-white/5'
                            )}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDrop(e, tech.id, day)}
                            onClick={() => handleCellClick(tech.id, day)}
                          >
                            {assigned ? (
                              <div className="flex items-center justify-between gap-1 bg-cyan-500/15 border border-cyan-500/30 rounded-lg px-2 py-1">
                                <div className="flex items-center gap-1">
                                  <Plane className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                                  <span className="text-[10px] font-extrabold text-cyan-300 font-mono">{assigned}</span>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); setAssignments(prev => { const n = { ...prev }; delete n[key]; return n; }); }}
                                  className="text-gray-500 hover:text-red-400 transition-colors">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-3 h-3 text-gray-600" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* Cell picker popover */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedCell(null)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl shadow-2xl p-5 w-72" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Assign Aircraft
            </p>
            <p className="text-[10px] text-gray-500 mb-3">{selectedCell.dateStr}</p>
            <select value={cellPickerTail} onChange={e => setCellPickerTail(e.target.value)}
              className="w-full bg-[#1a2235] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50 mb-4">
              <option value="">— Unassign —</option>
              {aircraft.map(a => (
                <option key={a.id} value={a.tail_number}>{a.tail_number} · {a.aircraft_type}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setSelectedCell(null)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={handleAssignCell}
                className="flex-1 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 transition-colors">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManpowerStaffing() {
  const qc = useQueryClient();
  const { icaoCodes: stationList } = useStations();
  const [activeTab, setActiveTab] = useState('roster');
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [showModal, setShowModal] = useState(false);
  const [editTech, setEditTech] = useState(null);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['manpower-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 300000,
  });

  const { data: technicians = [], isLoading, refetch } = useQuery({
    queryKey: ['manpower-technicians'],
    queryFn: () => base44.entities.TrainingRecord.list('-created_date', 500),
    select: (data) => data.map(r => ({
      id: r.id,
      name: r.employee_name || r.crew_name || 'Unknown',
      employee_id: r.employee_id || '',
      station: r.station || 'KEWR',
      shift: r.specialty?.includes('Night') ? 'Night' : r.specialty?.includes('Mid') ? 'Mid' : 'Day',
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

  const filtered = technicians.filter(t => {
    const matchStation = stationFilter === 'All Stations' || t.station === stationFilter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      t.name?.toLowerCase().includes(q) ||
      t.employee_id?.toLowerCase().includes(q) ||
      t.station?.toLowerCase().includes(q) ||
      t.certifications?.some(c => c.toLowerCase().includes(q));
    return matchStation && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background text-white pb-24">
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest mb-1">People</p>
            <h1 className="text-3xl font-black text-white">Technicians</h1>
            <p className="text-sm text-gray-400 mt-1">Roster, qualifications, and live status.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()}
              className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
            </button>
            <button onClick={() => { setEditTech(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-extrabold hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20">
              <Plus className="w-4 h-4" /> Add technician
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 pt-4 flex items-center gap-1 border-b border-border">
        {[
          { id: 'roster', label: 'Roster', icon: List },
          { id: 'board', label: 'Assignment Board', icon: Calendar },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-all',
              activeTab === id
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-500 hover:text-white'
            )}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Roster Tab ── */}
      {activeTab === 'roster' && (
        <div className="px-6 pt-4">
          {/* Search + Filter */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 flex-1 max-w-xs">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or employee ID"
                className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1" />
            </div>
            <select value={stationFilter} onChange={e => setStationFilter(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-white outline-none">
              <option value="All Stations">All Stations</option>
              {stationList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-gray-500 ml-auto">{filtered.length} technicians</span>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  {['NAME', 'EMP ID', 'STATION', 'SHIFT', 'QUALS', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-600">Loading technicians…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 font-bold">No technicians found</p>
                      <p className="text-gray-600 text-xs mt-1">
                        {technicians.length === 0 ? 'Click "+ Add technician" to get started' : 'Try adjusting your filters'}
                      </p>
                    </td>
                  </tr>
                ) : filtered.map(tech => (
                  <TechRow
                    key={tech.id}
                    tech={tech}
                    onEdit={(t) => { setEditTech(t); setShowModal(true); }}
                    onDelete={(t) => deleteMutation.mutate(t.id)}
                    onChangeStatus={(t, s) => statusMutation.mutate({ id: t.id, status: s })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Assignment Board Tab ── */}
      {activeTab === 'board' && (
        <AssignmentBoard
          technicians={technicians}
          aircraft={aircraft}
          onAssign={(techId, tail) => statusMutation.mutate({ id: techId, status: tail ? 'assigned' : 'available' })}
        />
      )}

      {/* ── Modals ── */}
      {showModal && (
        <TechModal
          tech={editTech}
          stationList={stationList}
          onClose={() => { setShowModal(false); setEditTech(null); }}
          onSave={(data) => saveMutation.mutate({ ...editTech, ...data })}
        />
      )}
    </div>
  );
}