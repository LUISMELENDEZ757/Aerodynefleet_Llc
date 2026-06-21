/**
 * NewLogEntryModal — FAA-grade multi-step logbook entry
 *
 * Step 1 · Log Page Header  (LP#, date/time UTC, station, flight #, ATA)
 * Step 2 · Pilot Discrepancy  (write-up, severity, reporter role)
 * Step 3 · Technician Action  (corrective action OR deferral/MEL)
 * Step 4 · Parts Used         (part # / serial # table)
 * Step 5 · Attachments & Sign (photos, docs, tech cert, submit)
 */

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Plane, AlertTriangle, Camera, Image, Upload, ChevronDown,
  Flame, CheckCircle, Plus, Trash2, Package, Wrench, FileText,
  Shield, Tag, User, Clock, MapPin, Hash, ChevronRight, ChevronLeft,
  Bell
} from 'lucide-react';
import ATAChapterSelector from './ATAChapterSelector';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_OPTIONS = [
  { id: 'aog',   label: 'AOG',   desc: 'Aircraft on Ground — cannot dispatch', color: 'border-red-500 bg-red-900/30 text-red-300' },
  { id: 'mel',   label: 'MEL',   desc: 'Minimum Equipment List item',          color: 'border-amber-500 bg-amber-900/30 text-amber-300' },
  { id: 'ops',   label: 'OPS',   desc: 'Operational limitation applies',       color: 'border-orange-500 bg-orange-900/30 text-orange-300' },
  { id: 'cabin', label: 'CABIN', desc: 'Cabin/interior discrepancy',           color: 'border-blue-500 bg-blue-900/30 text-blue-300' },
  { id: 'info',  label: 'INFO',  desc: 'Informational / routine service',      color: 'border-gray-500 bg-gray-900/30 text-gray-300' },
];

const REPORTER_OPTIONS = [
  { id: 'captain',         label: 'Captain' },
  { id: 'first_officer',   label: 'First Officer' },
  { id: 'flight_attendant',label: 'Flight Attendant' },
  { id: 'maintenance',     label: 'Maintenance' },
  { id: 'ground_crew',     label: 'Ground Crew' },
  { id: 'dispatch',        label: 'Dispatch' },
];

const MEL_CATEGORIES = [
  { id: 'A', label: 'CAT A — ASAP (per OEM)' },
  { id: 'B', label: 'CAT B — 3 Calendar Days' },
  { id: 'C', label: 'CAT C — 10 Calendar Days' },
  { id: 'D', label: 'CAT D — 120 Calendar Days' },
];

const STEPS = [
  { id: 1, label: 'Log Page',    icon: Hash },
  { id: 2, label: 'Discrepancy', icon: AlertTriangle },
  { id: 3, label: 'Tech Action', icon: Wrench },
  { id: 4, label: 'Parts',       icon: Package },
  { id: 5, label: 'Sign & Save', icon: Shield },
];

// ── Shared input component ───────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";
const textareaCls = `${inputCls} resize-none`;

// ── Oil Service sub-section ──────────────────────────────────────────────────
const OIL_MAX = 12; // quarts — visual scale max

function OilGauge({ label, before, after, added }) {
  const bVal = parseFloat(before) || 0;
  const aVal = parseFloat(after) || 0;
  const addVal = parseFloat(added) || 0;
  const pctBefore = Math.min((bVal / OIL_MAX) * 100, 100);
  const pctAfter  = Math.min((aVal / OIL_MAX) * 100, 100);
  const low = bVal < 3;
  const ok  = aVal >= 6;

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">{label}</p>

      {/* Vertical tank gauge */}
      <div className="relative w-10 h-24 bg-[#0a0f1a] border border-white/10 rounded-lg overflow-hidden">
        {/* After fill */}
        <div
          className={cn('absolute bottom-0 left-0 right-0 transition-all duration-500', ok ? 'bg-cyan-500/60' : 'bg-amber-500/60')}
          style={{ height: `${pctAfter}%` }}
        />
        {/* Before fill (overlay, slightly darker) */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-500 bg-cyan-800/40"
          style={{ height: `${pctBefore}%` }}
        />
        {/* Level marks */}
        {[25, 50, 75].map(p => (
          <div key={p} className="absolute left-0 right-0 border-t border-white/10" style={{ bottom: `${p}%` }} />
        ))}
        {/* LOW label */}
        {low && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-black text-red-400 tracking-wider rotate-0">LOW</span>
          </div>
        )}
      </div>

      {/* Values */}
      <div className="text-center space-y-0.5">
        <p className="text-[9px] text-gray-600">Before <span className="text-cyan-300 font-bold">{bVal > 0 ? `${bVal}qt` : '—'}</span></p>
        {addVal > 0 && <p className="text-[9px] text-green-400 font-bold">+{addVal}qt</p>}
        <p className="text-[9px] text-gray-600">After <span className={cn('font-bold', ok ? 'text-green-400' : 'text-amber-400')}>{aVal > 0 ? `${aVal}qt` : '—'}</span></p>
      </div>
    </div>
  );
}

function OilServiceSection({ oil, setOil }) {
  const [open, setOpen] = useState(false);
  const set = (k, v) => {
    setOil(p => {
      const updated = { ...p, [k]: v };
      // Auto-calculate "after" = before + added for each unit
      for (const prefix of ['e1', 'e2', 'apu']) {
        const b = parseFloat(updated[`${prefix}_before`]) || 0;
        const a = parseFloat(updated[`${prefix}_added`]) || 0;
        if ((k === `${prefix}_before` || k === `${prefix}_added`) && (b > 0 || a > 0)) {
          updated[`${prefix}_after`] = (b + a).toFixed(1);
        }
      }
      return updated;
    });
  };

  const inputNum = (k) => (
    <div className="relative">
      <input type="number" step="0.1" min="0" placeholder="0.0" value={oil[k]}
        onChange={e => set(k, e.target.value)}
        className="w-full bg-[#111827] border border-white/10 rounded-lg px-2 py-2 text-sm text-white placeholder-gray-700 outline-none focus:border-cyan-400 pr-7" />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">qt</span>
    </div>
  );

  return (
    <div className="border border-dashed border-cyan-500/30 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyan-500/5 transition-colors">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest">Engine & APU Oil Service — ATA 79</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-cyan-500/20 bg-[#0d1423] p-4 space-y-4">

          {/* ── Graphical gauges ── */}
          <div className="flex items-start justify-around gap-2 py-2">
            <OilGauge label="ENG 1" before={oil.e1_before} added={oil.e1_added} after={oil.e1_after} />
            <OilGauge label="ENG 2" before={oil.e2_before} added={oil.e2_added} after={oil.e2_after} />
            <OilGauge label="APU"   before={oil.apu_before} added={oil.apu_added} after={oil.apu_after} />
          </div>

          {/* ── Numeric inputs — Before / Added / After (auto) ── */}
          {[
            { title: 'Engine 1', bKey: 'e1_before',  dKey: 'e1_added',  aKey: 'e1_after' },
            { title: 'Engine 2', bKey: 'e2_before',  dKey: 'e2_added',  aKey: 'e2_after' },
            { title: 'APU',      bKey: 'apu_before', dKey: 'apu_added', aKey: 'apu_after' },
          ].map(({ title, bKey, dKey, aKey }) => (
            <div key={title} className="bg-[#0d1117] border border-white/8 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-widest">{title}</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-600 block mb-1">BEFORE</label>
                  {inputNum(bKey)}
                </div>
                <div>
                  <label className="text-[9px] font-bold text-green-500 block mb-1">ADDED</label>
                  {inputNum(dKey)}
                </div>
                <div>
                  <label className="text-[9px] font-bold text-cyan-400 block mb-1">AFTER (auto)</label>
                  <div className="relative">
                    <input readOnly value={oil[aKey]}
                      className="w-full bg-[#0a1020] border border-cyan-500/20 rounded-lg px-2 py-2 text-sm text-cyan-300 font-bold outline-none pr-7 cursor-not-allowed opacity-80" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">qt</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Oil Grade / Spec</label>
            <input value={oil.grade} onChange={e => set('grade', e.target.value)} placeholder="e.g. MIL-PRF-7808"
              className="w-full bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Parts table ──────────────────────────────────────────────────────────────
function PartsTable({ parts, setParts }) {
  const addRow = () => setParts(p => [...p, { id: Date.now(), description: '', part_number: '', serial_number: '', quantity: '1', condition: 'new', on_off: 'installed' }]);
  const update = (id, field, val) => setParts(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));
  const remove = (id) => setParts(p => p.filter(r => r.id !== id));

  const cellCls = "bg-[#0d1423] border border-white/8 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-primary w-full";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <Package className="w-3 h-3" /> Parts Used / Installed
        </p>
        <button type="button" onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/30 transition-colors">
          <Plus className="w-3 h-3" /> Add Part
        </button>
      </div>

      {parts.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-xl py-8 text-center text-gray-600 text-sm">
          No parts added — click "Add Part" if parts were used
        </div>
      ) : (
        <div className="space-y-3">
          {parts.map((part) => (
            <div key={part.id} className="bg-[#0d1117] border border-white/10 rounded-xl p-4 space-y-3">
              {/* Row 1: Description */}
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Part Description *</label>
                  <input value={part.description} onChange={e => update(part.id, 'description', e.target.value)}
                    placeholder="e.g. Fuel Pump, Seat Belt Buckle, IDG Drive Pad..."
                    className={cn(inputCls, 'text-sm')} />
                </div>
                <button type="button" onClick={() => remove(part.id)}
                  className="w-7 h-7 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center hover:bg-red-900/60 transition-colors mt-5 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

              {/* Row 2: P/N, S/N, Qty */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Part Number (P/N) *</label>
                  <input value={part.part_number} onChange={e => update(part.id, 'part_number', e.target.value)}
                    placeholder="e.g. 67890-001" className={cellCls} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Serial Number (S/N)</label>
                  <input value={part.serial_number} onChange={e => update(part.id, 'serial_number', e.target.value)}
                    placeholder="e.g. SN-12345678" className={cellCls} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Qty</label>
                  <input type="number" min="1" value={part.quantity} onChange={e => update(part.id, 'quantity', e.target.value)}
                    className={cellCls} />
                </div>
              </div>

              {/* Row 3: Condition, Installed/Removed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Condition</label>
                  <select value={part.condition} onChange={e => update(part.id, 'condition', e.target.value)} className={cellCls}>
                    <option value="new">New (Serviceable)</option>
                    <option value="overhauled">Overhauled</option>
                    <option value="repaired">Repaired</option>
                    <option value="used_serviceable">Used Serviceable</option>
                    <option value="removed">Removed (Unserviceable)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Action</label>
                  <select value={part.on_off} onChange={e => update(part.id, 'on_off', e.target.value)} className={cellCls}>
                    <option value="installed">Installed (ON)</option>
                    <option value="removed">Removed (OFF)</option>
                    <option value="inspected">Inspected</option>
                    <option value="repaired">Repaired In-Place</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b border-white/10 bg-[#0a0f1a]">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                done   ? 'bg-primary border-primary' :
                active ? 'bg-primary/20 border-primary' :
                         'bg-[#1a2035] border-white/15')}>
                {done
                  ? <CheckCircle className="w-4 h-4 text-white" />
                  : <Icon className={cn('w-3.5 h-3.5', active ? 'text-primary' : 'text-gray-600')} />
                }
              </div>
              <span className={cn('text-[9px] font-bold uppercase tracking-wider whitespace-nowrap',
                active ? 'text-primary' : done ? 'text-gray-400' : 'text-gray-700')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-1 mb-4', done ? 'bg-primary/50' : 'bg-white/10')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function NewLogEntryModal({ aircraftTail, nextLogPage, preset, onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0];
  const nowUtc = new Date().toISOString().slice(11, 16);

  const [step, setStep] = useState(1);

  // Step 1 — Header
  const [header, setHeader] = useState({
    log_page: nextLogPage,
    entry_date: today,
    entry_time: nowUtc,
    station: '',
    flight_number: '',
    ata_chapter: '',
    entry_type: preset?.entry_type || 'discrepancy',
  });

  // Step 2 — Pilot discrepancy
  const [discrepancy, setDiscrepancy] = useState({
    description: preset?.description ? `${preset.description}: ` : '',
    severity: 'info',
    reporter_role: 'captain',
    reporter_name: '',
    reporter_number: '',
  });

  // Step 3 — Tech action
  const [techAction, setTechAction] = useState({
    corrective_action: '',
    technician_name: '',
    technician_id: '',
    is_deferred: false,
    mel_reference: '',
    mel_category: '',
    rii_required: false,
    notes: '',
  });

  // Step 4 — Parts
  const [parts, setParts] = useState([]);

  // Oil service (nested in step 3)
  const [oil, setOil] = useState({
    e1_before: '', e1_added: '', e1_after: '',
    e2_before: '', e2_added: '', e2_after: '',
    apu_before: '', apu_added: '', apu_after: '',
    grade: '',
  });

  // Step 5 — Attachments
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const photoRef = useRef(null);
  const imageRef = useRef(null);
  const docRef = useRef(null);

  const setH = (k, v) => setHeader(p => ({ ...p, [k]: v }));
  const setD = (k, v) => setDiscrepancy(p => ({ ...p, [k]: v }));
  const setT = (k, v) => setTechAction(p => ({ ...p, [k]: v }));

  const handleFiles = async (files) => {
    const arr = Array.from(files);
    setUploading(true);
    for (const f of arr) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setAttachments(prev => [...prev, { name: f.name, url: file_url, type: f.type }]);
    }
    setUploading(false);
  };

  // Build parts summary string
  const buildPartsSummary = () => {
    if (!parts.length) return '';
    return parts.map(p =>
      `${p.on_off?.toUpperCase()} — ${p.description} | P/N: ${p.part_number}${p.serial_number ? ` | S/N: ${p.serial_number}` : ''} | Qty: ${p.quantity} | ${p.condition}`
    ).join('\n');
  };

  const buildPayload = (overrides = {}) => {
    const partsSummary = buildPartsSummary();
    const oilSummary = (() => {
      const lines = [];
      if (oil.e1_before || oil.e1_added || oil.e1_after) lines.push(`E1 Oil: Before ${oil.e1_before}qt / Added ${oil.e1_added}qt / After ${oil.e1_after}qt`);
      if (oil.e2_before || oil.e2_added || oil.e2_after) lines.push(`E2 Oil: Before ${oil.e2_before}qt / Added ${oil.e2_added}qt / After ${oil.e2_after}qt`);
      if (oil.apu_before || oil.apu_added || oil.apu_after) lines.push(`APU Oil: Before ${oil.apu_before}qt / Added ${oil.apu_added}qt / After ${oil.apu_after}qt`);
      if (oil.grade) lines.push(`Oil Grade: ${oil.grade}`);
      return lines.join('\n');
    })();

    return {
      aircraft_tail: aircraftTail,
      log_page: header.log_page,
      entry_type: header.entry_type,
      ata_chapter: header.ata_chapter,
      flight_number: header.flight_number,
      station: header.station,
      description: discrepancy.description,
      corrective_action: techAction.corrective_action || undefined,
      technician_name: techAction.technician_name || undefined,
      technician_id: techAction.technician_id || undefined,
      is_deferred: techAction.is_deferred,
      mel_reference: techAction.mel_reference || undefined,
      mel_category: techAction.mel_category || undefined,
      rii_required: techAction.rii_required,
      discrepancy_status: 'OPEN',
      parts_used: partsSummary || undefined,
      notes: [
        oilSummary,
        techAction.notes,
        attachments.map(a => a.url).join('\n'),
        discrepancy.reporter_role ? `Reporter: ${discrepancy.reporter_role}${discrepancy.reporter_name ? ` — ${discrepancy.reporter_name}` : ''}${discrepancy.reporter_number ? ` | #${discrepancy.reporter_number}` : ''}` : '',
      ].filter(Boolean).join('\n\n') || undefined,
      ...overrides,
    };
  };

  const handleSaveOpen = () => {
    onSave(buildPayload({ discrepancy_status: 'OPEN' }));
  };

  const handleSubmit = () => {
    onSave(buildPayload({
      discrepancy_status: techAction.rii_required ? 'PENDING_RII' : 'OPEN',
    }));
  };

  const canAdvance = () => {
    if (step === 1) return header.ata_chapter && header.station;
    if (step === 2) return discrepancy.description.trim().length > 10;
    // Step 3: require technician name + cert, and either corrective action or a deferral reference
    if (step === 3) {
      const hasIdent = techAction.technician_name.trim() && techAction.technician_id.trim();
      const hasAction = techAction.is_deferred
        ? (techAction.mel_reference.trim() && techAction.mel_category)
        : techAction.corrective_action.trim().length > 5;
      return hasIdent && hasAction;
    }
    return true;
  };

  const canSaveOpen = step >= 2 && discrepancy.description.trim().length > 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3">
      <div className="w-full max-w-2xl bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* ── Top header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0f1a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-extrabold text-white tracking-wide">
                New Log Entry — <span className="text-primary font-black font-mono">{header.log_page}</span>
              </p>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">{aircraftTail} · FAA 14 CFR 43.9</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* ── Step bar ── */}
        <StepBar current={step} total={5} />

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ════ STEP 1: LOG PAGE HEADER ════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-primary" />
                <p className="text-sm font-extrabold text-white uppercase tracking-widest">Log Page Header</p>
              </div>

              {/* LP# (display only — auto-assigned) */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Log Page Number</p>
                  <p className="text-3xl font-black text-primary font-mono tracking-widest">{header.log_page}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-600">Auto-assigned</p>
                  <p className="text-[10px] text-gray-600">Sequential & locked on submit</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date (UTC)">
                  <input type="date" value={header.entry_date} onChange={e => setH('entry_date', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Time (UTC / Zulu)">
                  <input type="time" value={header.entry_time} onChange={e => setH('entry_time', e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Station (ICAO)" required>
                  <input placeholder="e.g. KEWR" value={header.station} onChange={e => setH('station', e.target.value.toUpperCase())} className={inputCls} />
                </Field>
                <Field label="Flight Number">
                  <input placeholder="e.g. FLT 4474" value={header.flight_number} onChange={e => setH('flight_number', e.target.value)} className={inputCls} />
                </Field>
              </div>

              <Field label="ATA Chapter" required>
                <ATAChapterSelector value={header.ata_chapter} onChange={v => setH('ata_chapter', v)} dark={true} />
              </Field>

              {/* Entry type */}
              <Field label="Entry Type">
                <div className="flex gap-2 flex-wrap">
                  {['discrepancy','corrective_action','deferred','cleared','info'].map(t => (
                    <button key={t} type="button" onClick={() => setH('entry_type', t)}
                      className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                        header.entry_type === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20')}>
                      {t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ════ STEP 2: PILOT DISCREPANCY ════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-extrabold text-white uppercase tracking-widest">Pilot / Crew Discrepancy</p>
              </div>

              {/* Reporter */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Reported By">
                  <select value={discrepancy.reporter_role} onChange={e => setD('reporter_role', e.target.value)} className={inputCls}>
                    {REPORTER_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </Field>
                <Field label="Reporter Name">
                  <input placeholder="Crew member name" value={discrepancy.reporter_name} onChange={e => setD('reporter_name', e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="A&P / Employee Number">
                <input placeholder="e.g. AMT-12345 or EMP-67890" value={discrepancy.reporter_number} onChange={e => setD('reporter_number', e.target.value)} className={inputCls} />
              </Field>

              {/* Severity */}
              <Field label="Severity / Impact">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {SEVERITY_OPTIONS.map(s => (
                    <button key={s.id} type="button" onClick={() => setD('severity', s.id)}
                      className={cn('border rounded-xl px-3 py-2.5 text-left transition-all',
                        discrepancy.severity === s.id ? s.color : 'border-white/10 bg-[#1a2035] text-gray-500 hover:text-gray-300')}>
                      <p className="text-xs font-extrabold">{s.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-80">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              {/* Discrepancy write-up */}
              <Field label="Discrepancy Write-Up *" required>
                <textarea required rows={6} value={discrepancy.description} onChange={e => setD('description', e.target.value)}
                  placeholder="Describe the discrepancy as reported by the crew. Be specific — include system, symptom, conditions, and phase of flight..."
                  className={textareaCls} />
              </Field>

              <div className="flex items-start gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Write exactly what was reported. The corrective action is entered in the next step.{' '}
                  <span className="text-blue-400 font-semibold">This becomes the official aircraft record per 14 CFR 43.9.</span>
                </p>
              </div>
            </div>
          )}

          {/* ════ STEP 3: TECHNICIAN ACTION ════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-extrabold text-white uppercase tracking-widest">Technician Corrective Action</p>
              </div>

              {/* Technician identity — both fields required per 14 CFR 43.9(a)(4) */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Technician Name *" required>
                  <input required placeholder="First Last" value={techAction.technician_name} onChange={e => setT('technician_name', e.target.value)} className={inputCls} />
                </Field>
                <Field label="A&P / IA Cert # * (14 CFR 43.9)" required>
                  <input required placeholder="AMT-XXXXX or IA-XXXXX" value={techAction.technician_id} onChange={e => setT('technician_id', e.target.value)} className={inputCls} />
                  {!techAction.technician_id && <p className="text-[10px] text-red-400 mt-1">Required by 14 CFR 43.9(a)(4)</p>}
                </Field>
              </div>

              {/* Corrective Action or Deferral toggle */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setT('is_deferred', false)}
                  className={cn('flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2',
                    !techAction.is_deferred ? 'bg-green-800/40 border-green-600 text-green-300' : 'border-white/15 text-gray-500 hover:text-gray-300')}>
                  <CheckCircle className="w-4 h-4" /> Corrective Action
                </button>
                <button type="button" onClick={() => setT('is_deferred', true)}
                  className={cn('flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2',
                    techAction.is_deferred ? 'bg-amber-800/40 border-amber-600 text-amber-300' : 'border-white/15 text-gray-500 hover:text-gray-300')}>
                  <Tag className="w-4 h-4" /> Defer (MEL/CDL)
                </button>
              </div>

              {/* Corrective action text — required per 14 CFR 43.9(a)(3) */}
              {!techAction.is_deferred && (
                <Field label="Corrective Action Taken * (14 CFR 43.9(a)(3))" required>
                  <textarea required rows={5} value={techAction.corrective_action} onChange={e => setT('corrective_action', e.target.value)}
                    placeholder="Describe exactly what was done: replaced, inspected, adjusted, rigged, tested... Reference AMM chapter/section. e.g. 'Replaced fuel pump P/N 67890-001 per AMM 73-10-01.'"
                    className={textareaCls} />
                  {!techAction.corrective_action.trim() && <p className="text-[10px] text-red-400 mt-1">Corrective action description is mandatory per 14 CFR 43.9(a)(3)</p>}
                </Field>
              )}

              {/* Deferral fields */}
              {techAction.is_deferred && (
                <div className="space-y-4 bg-amber-900/15 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> Deferral / MEL Reference
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="MEL / CDL Reference">
                      <input placeholder="e.g. MEL 32-40-1" value={techAction.mel_reference} onChange={e => setT('mel_reference', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="MEL Category">
                      <select value={techAction.mel_category} onChange={e => setT('mel_category', e.target.value)} className={inputCls}>
                        <option value="">Select category</option>
                        {MEL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Deferral / Placard Notes">
                    <textarea rows={3} value={techAction.corrective_action} onChange={e => setT('corrective_action', e.target.value)}
                      placeholder="Placard installed, crew procedures, maintenance procedures required..."
                      className={textareaCls} />
                  </Field>
                </div>
              )}

              {/* RII toggle */}
              <label className="flex items-center gap-3 bg-violet-900/15 border border-violet-500/25 rounded-xl px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={techAction.rii_required} onChange={e => setT('rii_required', e.target.checked)} className="w-4 h-4 rounded accent-violet-500" />
                <div>
                  <p className="text-sm font-bold text-violet-300 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Requires RII Sign-Off</p>
                  <p className="text-[10px] text-violet-400/70">Required Inspection Item — inspector must verify before return to service</p>
                </div>
              </label>

              {/* Oil service */}
              <OilServiceSection oil={oil} setOil={setOil} />

              {/* Additional notes */}
              <Field label="Additional Notes / Troubleshooting">
                <textarea rows={3} value={techAction.notes} onChange={e => setT('notes', e.target.value)}
                  placeholder="Optional: AMM reference, test results, next steps..." className={textareaCls} />
              </Field>
            </div>
          )}

          {/* ════ STEP 4: PARTS ════ */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-extrabold text-white uppercase tracking-widest">Parts Used / Installed</p>
                <span className="text-[10px] text-gray-600 ml-1">— Required for 14 CFR 43.9 compliance</span>
              </div>
              <PartsTable parts={parts} setParts={setParts} />
            </div>
          )}

          {/* ════ STEP 5: ATTACHMENTS & SIGN ════ */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-green-400" />
                <p className="text-sm font-extrabold text-white uppercase tracking-widest">Attachments & Submit</p>
              </div>

              {/* Summary card */}
              <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4 space-y-2 text-xs text-gray-400">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Entry Summary</p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                  <span className="text-gray-600">Log Page:</span><span className="text-primary font-mono font-bold">{header.log_page}</span>
                  <span className="text-gray-600">Aircraft:</span><span className="text-white font-bold">{aircraftTail}</span>
                  <span className="text-gray-600">Station:</span><span className="text-white">{header.station || '—'}</span>
                  <span className="text-gray-600">ATA:</span><span className="text-white">{header.ata_chapter || '—'}</span>
                  <span className="text-gray-600">Type:</span><span className="text-white capitalize">{header.entry_type.replace('_', ' ')}</span>
                  <span className="text-gray-600">Severity:</span><span className="text-white uppercase">{discrepancy.severity}</span>
                  <span className="text-gray-600">Technician:</span><span className="text-white">{techAction.technician_name || '—'}</span>
                  <span className="text-gray-600">Parts:</span><span className="text-white">{parts.length} item{parts.length !== 1 ? 's' : ''}</span>
                  {techAction.is_deferred && <><span className="text-gray-600">MEL:</span><span className="text-amber-400">{techAction.mel_reference} CAT {techAction.mel_category}</span></>}
                </div>
              </div>

              {/* Attachments */}
              <Field label="Photos / Documents">
                <div
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={cn('border-2 border-dashed rounded-xl p-4 transition-colors',
                    dragOver ? 'border-primary/60 bg-primary/5' : 'border-white/10')}>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => photoRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                    <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFiles(e.target.files)} />
                    <button type="button" onClick={() => imageRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a2035] border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors">
                      <Image className="w-4 h-4 text-purple-400" /> Gallery
                    </button>
                    <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                    <button type="button" onClick={() => docRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a2035] border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors">
                      <Upload className="w-4 h-4 text-blue-400" /> Document
                    </button>
                    <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                  </div>
                  <p className="text-xs text-gray-600 text-center">Or drag &amp; drop images / PDFs here</p>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {attachments.map((a, i) => (
                        <div key={i} className="relative group">
                          {a.type?.startsWith('image/') ? (
                            <img src={a.url} alt={a.name} className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                          ) : (
                            <div className="w-14 h-14 bg-[#1a2035] border border-white/10 rounded-lg flex items-center justify-center">
                              <Upload className="w-5 h-5 text-blue-400" />
                            </div>
                          )}
                          <button type="button" onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploading && <p className="text-xs text-primary text-center mt-2 animate-pulse">Uploading…</p>}
                </div>
              </Field>

              {/* RII notification callout */}
              {techAction.rii_required && (
                <div className="bg-violet-900/25 border border-violet-500/50 rounded-xl px-4 py-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <p className="text-sm font-extrabold text-violet-300">RII Sign-Off Required</p>
                  </div>
                  <p className="text-xs text-violet-300/80 leading-relaxed">
                    This entry will be saved as <span className="font-extrabold text-violet-300">PENDING RII</span>. An inspector must review and sign off before this item is closed. The entry will appear in the Inspector Mode queue immediately after submission.
                  </p>
                  <Link
                    to="/InspectorMode"
                    onClick={() => {}}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-bold hover:bg-violet-600/50 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" /> Open Inspector Mode →
                  </Link>
                </div>
              )}

              {/* 14 CFR 43.9(a)(4) full certification statement */}
              <div className="bg-blue-900/15 border border-blue-500/30 rounded-xl px-4 py-3 space-y-2">
                <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">14 CFR 43.9(a)(4) — Airworthiness Certification</p>
                <p className="text-xs text-blue-200 leading-relaxed italic">
                  "I certify that the work identified in this record was performed in accordance with the requirements of 14 CFR Part 43, and in respect to that work, the aircraft is approved for return to service."
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Certifying Tech</p>
                    <p className="text-xs font-bold text-white">{techAction.technician_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Certificate #</p>
                    <p className="text-xs font-bold text-primary font-mono">{techAction.technician_id || '⚠ REQUIRED'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
                <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Submitting locks log page <span className="text-primary font-mono font-bold">{header.log_page}</span>. False entries in maintenance records are a federal offense under 18 U.S.C. § 1001.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0a0f1a] flex-shrink-0">
          <button type="button" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {/* Save as Open — available once discrepancy is written (steps 2+) */}
            {canSaveOpen && step < STEPS.length && (
              <button type="button" onClick={handleSaveOpen}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/50 text-amber-300 bg-amber-900/20 text-sm font-bold hover:bg-amber-900/40 transition-colors">
                <AlertTriangle className="w-4 h-4" /> Save Open
              </button>
            )}

            {step < STEPS.length ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={uploading || !techAction.technician_name || !techAction.technician_id}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-700 text-white text-sm font-extrabold hover:bg-green-600 disabled:opacity-40 transition-colors">
                <CheckCircle className="w-4 h-4" /> Submit Log Entry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}