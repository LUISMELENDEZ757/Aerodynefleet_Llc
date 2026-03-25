import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, CheckCircle, List, BookOpen, Droplets, Wind, Search, RotateCcw,
  ChevronLeft, X, Send, Wrench, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Shared modal shell ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white tracking-wide text-sm uppercase">{title}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
}

// ── Field helpers ───────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary";

const ATA_CHAPTERS = [
  { code: '05', label: '05 — Time Limits / Maintenance Checks' },
  { code: '06', label: '06 — Dimensions & Areas' },
  { code: '07', label: '07 — Lifting & Shoring' },
  { code: '08', label: '08 — Leveling & Weighing' },
  { code: '09', label: '09 — Towing & Taxiing' },
  { code: '10', label: '10 — Parking, Mooring, Storage & Return to Service' },
  { code: '11', label: '11 — Placards & Markings' },
  { code: '12', label: '12 — Servicing' },
  { code: '18', label: '18 — Vibration & Noise Analysis' },
  { code: '20', label: '20 — Standard Practices — Airframe' },
  { code: '21', label: '21 — Air Conditioning & Pressurization' },
  { code: '22', label: '22 — Auto Flight' },
  { code: '23', label: '23 — Communications' },
  { code: '24', label: '24 — Electrical Power' },
  { code: '25', label: '25 — Equipment / Furnishings' },
  { code: '26', label: '26 — Fire Protection' },
  { code: '27', label: '27 — Flight Controls' },
  { code: '28', label: '28 — Fuel' },
  { code: '29', label: '29 — Hydraulic Power' },
  { code: '30', label: '30 — Ice & Rain Protection' },
  { code: '31', label: '31 — Indicating / Recording Systems' },
  { code: '32', label: '32 — Landing Gear' },
  { code: '33', label: '33 — Lights' },
  { code: '34', label: '34 — Navigation' },
  { code: '35', label: '35 — Oxygen' },
  { code: '36', label: '36 — Pneumatic' },
  { code: '37', label: '37 — Vacuum' },
  { code: '38', label: '38 — Water / Waste' },
  { code: '39', label: '39 — Electrical — Electronic Panels & Multipurpose Components' },
  { code: '44', label: '44 — Cabin Systems' },
  { code: '45', label: '45 — Central Maintenance System' },
  { code: '46', label: '46 — Information Systems' },
  { code: '47', label: '47 — Nitrogen Generation System' },
  { code: '49', label: '49 — Airborne Auxiliary Power (APU)' },
  { code: '51', label: '51 — Standard Practices & Structures — General' },
  { code: '52', label: '52 — Doors' },
  { code: '53', label: '53 — Fuselage' },
  { code: '54', label: '54 — Nacelles / Pylons' },
  { code: '55', label: '55 — Stabilizers' },
  { code: '56', label: '56 — Windows' },
  { code: '57', label: '57 — Wings' },
  { code: '61', label: '61 — Propellers' },
  { code: '71', label: '71 — Power Plant — General' },
  { code: '72', label: '72 — Engine' },
  { code: '73', label: '73 — Engine Fuel & Control' },
  { code: '74', label: '74 — Ignition' },
  { code: '75', label: '75 — Air' },
  { code: '76', label: '76 — Engine Controls' },
  { code: '77', label: '77 — Engine Indicating' },
  { code: '78', label: '78 — Exhaust' },
  { code: '79', label: '79 — Oil' },
  { code: '80', label: '80 — Starting' },
  { code: '82', label: '82 — Water Injection' },
  { code: '91', label: '91 — Charts' },
  { code: '92', label: '92 — Electrical Components' },
];

// ── 1. New Logbook Entry Modal ──────────────────────────────────────────────
function NewEntryModal({ onClose }) {
  const queryClient = useQueryClient();
  const { data: aircraft = [] } = useQuery({
    queryKey: ['tech-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });
  const [form, setForm] = useState({
    aircraft_tail: '', station: '', ata_chapter: '',
    entry_type: 'discrepancy', description: '',
    technician_name: '', technician_id: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ATA chapters that affect CAT II/III approach authorization
  const CAT_AFFECTED_ATAS = {
    '22': 'ATA 22 — Auto Flight affects CAT II/III autoland capability. Aircraft CAT status may be downgraded.',
    '34': 'ATA 34 — Navigation systems (ILS/GPS/RA) are CAT II/III critical. Aircraft CAT status may be downgraded.',
    '31': 'ATA 31 — Indicating/Recording systems include CAT II/III flight instruments. Aircraft CAT status may be downgraded.',
    '24': 'ATA 24 — Electrical Power is essential for CAT II/III operations. Aircraft CAT status may be downgraded.',
    '30': 'ATA 30 — Ice & Rain Protection (windshield heat, probes) affects CAT II/III minima. Aircraft CAT status may be downgraded.',
    '27': 'ATA 27 — Flight Controls (autopilot servos, spoilers) are required for autoland. Aircraft CAT status may be downgraded.',
    '32': 'ATA 32 — Landing Gear (auto-brakes, antiskid) are CAT II/III approach critical. Aircraft CAT status may be downgraded.',
    '23': 'ATA 23 — Communications systems (marker beacons, radio altimeter) are CAT II/III critical. Aircraft CAT status may be downgraded.',
  };

  const catWarning = CAT_AFFECTED_ATAS[form.ata_chapter] || null;

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.aircraft_tail || !form.description) return;
    mutation.mutate(form);
  };

  return (
    <Modal title="New Logbook Entry" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aircraft Tail *">
            <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required className={inputCls}>
              <option value="">Select tail…</option>
              {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>)}
            </select>
          </Field>
          <Field label="Station">
            <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entry Type">
            <select value={form.entry_type} onChange={e => set('entry_type', e.target.value)} className={inputCls}>
              <option value="discrepancy">Discrepancy</option>
              <option value="corrective_action">Corrective Action</option>
              <option value="deferred">Deferred</option>
              <option value="info">Info</option>
            </select>
          </Field>
          <Field label="ATA Chapter">
            <select value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} className={inputCls}>
              <option value="">Select ATA…</option>
              {ATA_CHAPTERS.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
            </select>
          </Field>
        </div>
        {catWarning && (
          <div className="flex items-start gap-3 bg-amber-500/15 border border-amber-500/40 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest mb-0.5">⚠ CAT Status Warning</p>
              <p className="text-xs text-amber-300 leading-snug">{catWarning}</p>
              <p className="text-[10px] text-amber-500 mt-1">Notify Dispatch & Captain. Update MEL/CAT authorization before next ILS approach.</p>
            </div>
          </div>
        )}

        <Field label="Description *">
          <textarea required rows={4} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe the discrepancy or action…"
            className={inputCls + " resize-none"} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Technician Name">
            <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)} placeholder="Name" className={inputCls} />
          </Field>
          <Field label="Tech ID / License">
            <input value={form.technician_id} onChange={e => set('technician_id', e.target.value)} placeholder="ID#" className={inputCls} />
          </Field>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !form.aircraft_tail || !form.description}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {mutation.isPending ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── 2. Open Discrepancies Modal ─────────────────────────────────────────────
function OpenDiscrepanciesModal({ onClose }) {
  const navigate = useNavigate();
  const [tailFilter, setTailFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('discrepancy');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['tech-open-discrepancies'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 200),
  });

  const filtered = entries.filter(e => {
    const matchType = !typeFilter || e.entry_type === typeFilter;
    const matchTail = !tailFilter || (e.aircraft_tail || '').toLowerCase().includes(tailFilter.toLowerCase());
    return matchType && matchTail && !e.is_cleared;
  });

  return (
    <Modal title="Open Discrepancies" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input value={tailFilter} onChange={e => setTailFilter(e.target.value)}
            placeholder="Filter by tail…" className={inputCls} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={inputCls}>
            <option value="">All Types</option>
            <option value="discrepancy">Discrepancy</option>
            <option value="deferred">Deferred</option>
            <option value="corrective_action">Corrective Action</option>
            <option value="info">Info</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-sm text-center py-6">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No open entries found</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map(e => (
              <div key={e.id} className="bg-[#1a1f2e] border border-white/10 rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-sm">{e.aircraft_tail || '—'}</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                    e.entry_type === 'discrepancy' ? 'bg-red-900/50 text-red-400' :
                    e.entry_type === 'deferred' ? 'bg-amber-900/50 text-amber-400' :
                    'bg-blue-900/50 text-blue-400'
                  )}>{e.entry_type}</span>
                </div>
                <p className="text-xs text-gray-300 leading-snug">{e.description}</p>
                {e.ata_chapter && <p className="text-[10px] text-gray-500">ATA {e.ata_chapter}</p>}
                <p className="text-[10px] text-gray-600">{new Date(e.created_date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { onClose(); navigate('/TechOpsLogbook'); }}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
          Open Full Logbook →
        </button>
      </div>
    </Modal>
  );
}

// ── 3. Close Task Modal ─────────────────────────────────────────────────────
function CloseTaskModal({ onClose }) {
  const queryClient = useQueryClient();
  const [tailFilter, setTailFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [clearedBy, setClearedBy] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['tech-open-for-close'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 200),
    select: (data) => data.filter(e => !e.is_cleared),
  });

  const mutation = useMutation({
    mutationFn: ({ id }) => base44.entities.LogbookEntry.update(id, {
      is_cleared: true,
      cleared_by: clearedBy,
      cleared_date: new Date().toISOString().split('T')[0],
      entry_type: 'cleared',
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }); onClose(); },
  });

  const filtered = entries.filter(e =>
    !tailFilter || (e.aircraft_tail || '').toLowerCase().includes(tailFilter.toLowerCase())
  );

  return (
    <Modal title="Close Task" onClose={onClose}>
      <div className="p-5 space-y-4">
        {!selected ? (
          <>
            <input value={tailFilter} onChange={e => setTailFilter(e.target.value)}
              placeholder="Filter by tail number…" className={inputCls} />
            {isLoading ? (
              <p className="text-gray-500 text-sm text-center py-6">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No open tasks found</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filtered.map(e => (
                  <button key={e.id} onClick={() => setSelected(e)}
                    className="w-full text-left bg-[#1a1f2e] border border-white/10 rounded-xl p-4 hover:border-teal-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-white text-sm">{e.aircraft_tail || '—'}</span>
                      <span className="text-[10px] text-gray-500">{e.station || ''}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-snug line-clamp-2">{e.description}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-[#1a1f2e] border border-teal-500/30 rounded-xl p-4 space-y-1">
              <span className="font-mono font-bold text-teal-300 text-sm">{selected.aircraft_tail}</span>
              <p className="text-xs text-gray-300">{selected.description}</p>
            </div>
            <Field label="Cleared By (Technician Name) *">
              <input value={clearedBy} onChange={e => setClearedBy(e.target.value)}
                placeholder="Your name / license #" className={inputCls} />
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">← Back</button>
              <button disabled={!clearedBy || mutation.isPending}
                onClick={() => mutation.mutate({ id: selected.id })}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-500 disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> {mutation.isPending ? 'Closing…' : 'Close Task'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── 4. Quick Service Modal (Oil / Oxygen) ───────────────────────────────────
function ServiceModal({ serviceType, onClose }) {
  const queryClient = useQueryClient();
  const { data: aircraft = [] } = useQuery({
    queryKey: ['tech-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });
  const [form, setForm] = useState({ aircraft_tail: '', station: '', technician_name: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const isOil = serviceType === 'oil';
  const label = isOil ? 'Oil Service' : 'Oxygen Service';
  const color = isOil ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500';

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create({
      aircraft_tail: data.aircraft_tail,
      station: data.station,
      entry_type: 'info',
      description: `[${label.toUpperCase()}] ${data.notes || label + ' performed.'}`,
      technician_name: data.technician_name,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.aircraft_tail) return;
    mutation.mutate(form);
  };

  return (
    <Modal title={label} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aircraft Tail *">
            <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required className={inputCls}>
              <option value="">Select tail…</option>
              {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
            </select>
          </Field>
          <Field label="Station">
            <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
          </Field>
        </div>
        <Field label="Technician Name">
          <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)} placeholder="Name / License #" className={inputCls} />
        </Field>
        <Field label="Notes">
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder={`e.g. Added 2 qts to ${isOil ? '#1 engine' : 'O2 cylinder recharged'}`}
            className={inputCls + " resize-none"} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !form.aircraft_tail}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${color}`}>
            <Send className="w-4 h-4" /> {mutation.isPending ? 'Saving…' : `Log ${label}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function OOSDashboard() {
  const [modal, setModal] = useState(null); // 'new' | 'discrepancies' | 'close' | 'oil' | 'oxygen'

  const ACTIONS = [
    { icon: Plus,        label: 'New Logbook Entry',    bg: 'bg-amber-500',    modal: 'new' },
    { icon: CheckCircle, label: 'Close Task',           bg: 'bg-teal-600',     modal: 'close' },
    { icon: List,        label: 'Open Discrepancies',   bg: 'bg-[#1a1f2e]',   modal: 'discrepancies', border: true },
    { icon: BookOpen,    label: 'Manuals',              bg: 'bg-[#1a1f2e]',   link: '/Documents', border: true },
    { icon: Droplets,    label: 'Oil Service',          bg: 'bg-violet-600',   modal: 'oil' },
    { icon: Wind,        label: 'Oxygen Service',       bg: 'bg-cyan-600',     modal: 'oxygen' },
    { icon: Search,      label: 'MEL Lookup',           bg: 'bg-[#1a1f2e]',   link: '/MEL', border: true },
    { icon: RotateCcw,   label: 'RTS Aircraft',         bg: 'bg-blue-600',     link: '/FleetDashboard' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10">
        <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-xl font-extrabold tracking-wide flex-1 text-center">Technician Mode</h1>
        <div className="w-9" />
      </div>

      {/* Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          {ACTIONS.map(({ icon: Icon, label, bg, border, modal: m, link }) => {
            const cls = cn(
              'flex flex-col items-center justify-center gap-2.5 py-8 px-4 rounded-2xl text-white active:scale-95 transition-all hover:brightness-110',
              bg, border && 'border border-white/15'
            );
            return link ? (
              <Link key={label} to={link} className={cls}>
                <Icon className="w-6 h-6" strokeWidth={1.8} />
                <span className="text-sm font-bold text-center leading-tight">{label}</span>
              </Link>
            ) : (
              <button key={label} onClick={() => setModal(m)} className={cls}>
                <Icon className="w-6 h-6" strokeWidth={1.8} />
                <span className="text-sm font-bold text-center leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {modal === 'new'           && <NewEntryModal           onClose={() => setModal(null)} />}
      {modal === 'discrepancies' && <OpenDiscrepanciesModal  onClose={() => setModal(null)} />}
      {modal === 'close'         && <CloseTaskModal          onClose={() => setModal(null)} />}
      {modal === 'oil'           && <ServiceModal serviceType="oil"    onClose={() => setModal(null)} />}
      {modal === 'oxygen'        && <ServiceModal serviceType="oxygen" onClose={() => setModal(null)} />}
    </div>
  );
}