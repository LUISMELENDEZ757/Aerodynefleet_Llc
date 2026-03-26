import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, CheckCircle, List, BookOpen, Droplets, Wind, Search, RotateCcw,
  ChevronLeft, X, Send, Wrench, AlertTriangle, Printer
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

// ── 4a. Oil Service Modal ────────────────────────────────────────────────────
function OilServiceModal({ onClose }) {
  const queryClient = useQueryClient();
  const { data: aircraft = [] } = useQuery({
    queryKey: ['tech-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });
  const [form, setForm] = useState({ aircraft_tail: '', station: '', technician_name: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create({
      aircraft_tail: data.aircraft_tail,
      station: data.station,
      entry_type: 'info',
      description: `[OIL SERVICE] ${data.notes || 'Oil service performed.'}`,
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
    <Modal title="Oil Service" onClose={onClose}>
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
            placeholder="e.g. Added 2 qts to #1 engine"
            className={inputCls + " resize-none"} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={mutation.isPending || !form.aircraft_tail}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {mutation.isPending ? 'Saving…' : 'Log Oil Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── 4b. Oxygen Service Modal ─────────────────────────────────────────────────
function OxygenServiceModal({ onClose }) {
  const queryClient = useQueryClient();
  const { data: aircraft = [] } = useQuery({
    queryKey: ['tech-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });

  const now = new Date();
  const todayDate = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const utcTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: true });

  const [form, setForm] = useState({
    aircraft_tail: '',
    date: todayDate,
    time_utc: utcTime,
    station: '',
    service_method: 'Cascade',
    initial_pressure: '',
    final_pressure: '',
    bottle_replaced: false,
    technician_name: '',
    ap_cert: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const pressureAdded = form.initial_pressure && form.final_pressure
    ? Math.max(0, Number(form.final_pressure) - Number(form.initial_pressure))
    : null;

  // Generate a pseudo log page number
  const [logPage] = useState(`LP#${String(Math.floor(Math.random() * 9000) + 1000)}`);

  const handlePrint = () => {
    const partsSection = form.bottle_replaced ? `
      <tr><td colspan="2" style="padding:6px 0;font-weight:bold;color:#7c3aed;border-top:1px solid #e5e7eb;">🔩 Parts Removal / Installation</td></tr>
      <tr><td>Part Removed — P/N</td><td>${form.removed_pn || '—'}</td></tr>
      <tr><td>Part Removed — S/N</td><td>${form.removed_sn || '—'}</td></tr>
      <tr><td>Part Installed — P/N</td><td>${form.installed_pn || '—'}</td></tr>
      <tr><td>Part Installed — S/N</td><td>${form.installed_sn || '—'}</td></tr>
      ${form.parts_notes ? `<tr><td>Parts Notes</td><td>${form.parts_notes}</td></tr>` : ''}
    ` : '';

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Oxygen Service — ${logPage}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 40px; }
        h2 { margin: 0 0 4px; font-size: 18px; }
        .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 6px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
        td:first-child { font-weight: bold; width: 40%; color: #444; }
        .section { font-weight: bold; color: #0e7490; padding: 10px 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-top: 2px solid #0e7490; margin-top: 8px; }
        .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #ccc; padding-top: 10px; }
        .sig-line { margin-top: 40px; display: flex; gap: 40px; }
        .sig-block { flex: 1; border-top: 1px solid #000; padding-top: 4px; font-size: 12px; color: #444; }
      </style>
      </head><body>
      <h2>OXYGEN SERVICE — ${logPage}</h2>
      <div class="sub">ATA 35 — Oxygen System Servicing &nbsp;|&nbsp; Aerodyne Fleet LLC</div>
      <table>
        <tr><td class="section" colspan="2">Service Information</td></tr>
        <tr><td>Aircraft Tail</td><td>${form.aircraft_tail || '—'}</td></tr>
        <tr><td>Date</td><td>${form.date}</td></tr>
        <tr><td>Time (UTC)</td><td>${form.time_utc}</td></tr>
        <tr><td>Station</td><td>${form.station || '—'}</td></tr>
        <tr><td>Service Method</td><td>${form.service_method}</td></tr>
        <tr><td class="section" colspan="2">Pressure Data</td></tr>
        <tr><td>Initial Pressure</td><td>${form.initial_pressure || '—'} PSI</td></tr>
        <tr><td>Final Pressure</td><td>${form.final_pressure || '—'} PSI</td></tr>
        <tr><td>Pressure Added</td><td>${pressureAdded != null ? pressureAdded : '—'} PSI</td></tr>
        <tr><td>Bottle Replaced</td><td>${form.bottle_replaced ? 'YES' : 'NO'}</td></tr>
        ${partsSection}
        <tr><td class="section" colspan="2">Technician</td></tr>
        <tr><td>Name</td><td>${form.technician_name || '—'}</td></tr>
        <tr><td>A&P Cert # / Emp #</td><td>${form.ap_cert || '—'}</td></tr>
      </table>
      <div class="sig-line">
        <div class="sig-block">Technician Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
        <div class="sig-block">Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      </div>
      <div class="footer">Printed: ${new Date().toLocaleString()} &nbsp;|&nbsp; Log Page: ${logPage} &nbsp;|&nbsp; ATA 35</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const mutation = useMutation({
    mutationFn: () => base44.entities.LogbookEntry.create({
      aircraft_tail: form.aircraft_tail,
      station: form.station,
      ata_chapter: '35',
      entry_type: 'info',
      log_page: logPage,
      description: [
        `[OXYGEN SERVICE] ATA 35 — Oxygen System Servicing`,
        `Date: ${form.date}  Time (UTC): ${form.time_utc}  Station: ${form.station}`,
        `Service Method: ${form.service_method}`,
        `Initial Pressure: ${form.initial_pressure || '—'} PSI  Final Pressure: ${form.final_pressure || '—'} PSI  Added: ${pressureAdded != null ? pressureAdded : '—'} PSI`,
        form.bottle_replaced ? [
          `Oxygen bottle REPLACED during this service.`,
          `  REMOVED — P/N: ${form.removed_pn || '—'}  S/N: ${form.removed_sn || '—'}`,
          `  INSTALLED — P/N: ${form.installed_pn || '—'}  S/N: ${form.installed_sn || '—'}`,
          form.parts_notes ? `  Notes: ${form.parts_notes}` : '',
        ].filter(Boolean).join('\n') : '',
      ].filter(Boolean).join('\n'),
      technician_name: form.technician_name,
      technician_id: form.ap_cert,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg bg-[#0d1a24] border border-cyan-900/60 rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/60 flex items-center justify-center">
              <Wind className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <p className="font-extrabold text-cyan-400 text-sm tracking-wide">OXYGEN SERVICE — {logPage}</p>
              <p className="text-xs text-gray-400">ATA 35 — Oxygen System Servicing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {form.aircraft_tail && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary text-primary text-xs font-extrabold tracking-wide">
                ✈ {form.aircraft_tail}
              </span>
            )}
            <button onClick={handlePrint} title="Print / Save PDF" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-cyan-500/40 transition-colors">
              <Printer className="w-4 h-4 text-cyan-300" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[75vh] p-5 space-y-5">
          {/* Row 1: Date / Time / Station / Method */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Date">
              <input value={form.date} onChange={e => set('date', e.target.value)}
                className={inputCls} />
            </Field>
            <Field label="Time (UTC)">
              <input value={form.time_utc} onChange={e => set('time_utc', e.target.value)}
                placeholder="HH:MM" className={inputCls} />
            </Field>
            <Field label="Station">
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())}
                placeholder="KDEN" className={inputCls} />
            </Field>
            <Field label="Service Method">
              <select value={form.service_method} onChange={e => set('service_method', e.target.value)} className={inputCls}>
                <option>Cascade</option>
                <option>Cylinder</option>
                <option>Cart</option>
                <option>Other</option>
              </select>
            </Field>
          </div>

          {/* Aircraft Tail */}
          <Field label="Aircraft Tail *">
            <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required className={inputCls}>
              <option value="">Select tail…</option>
              {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
            </select>
          </Field>

          {/* Oxygen Pressure / Quantity */}
          <div className="bg-[#0a1e2a] border border-cyan-800/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-4 h-4 text-cyan-400" />
              <p className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">Oxygen Pressure / Quantity</p>
            </div>
            <div className="grid grid-cols-3 gap-3 items-end">
              <Field label="Initial Pressure">
                <div className="relative">
                  <input type="number" value={form.initial_pressure} onChange={e => set('initial_pressure', e.target.value)}
                    placeholder="1650" className={inputCls + " pr-10"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">PSI</span>
                </div>
              </Field>
              <Field label="Final Pressure">
                <div className="relative">
                  <input type="number" value={form.final_pressure} onChange={e => set('final_pressure', e.target.value)}
                    placeholder="1850" className={inputCls + " pr-10"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">PSI</span>
                </div>
              </Field>
              <Field label="Pressure Added (Auto)">
                <div className="relative">
                  <input readOnly value={pressureAdded != null ? pressureAdded : ''}
                    placeholder="Auto-calculated" className={inputCls + " pr-10 opacity-60 cursor-not-allowed"} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">PSI</span>
                </div>
              </Field>
            </div>

            {/* Pressure visual gauge */}
            {(() => {
              const maxPSI = 3000;
              const initial = Number(form.initial_pressure) || 0;
              const final = Number(form.final_pressure) || 0;
              const added = pressureAdded != null ? pressureAdded : 0;
              const initPct = Math.min(100, (initial / maxPSI) * 100);
              const finalPct = final >= 1850 ? 100 : Math.min(100, (final / maxPSI) * 100);
              const addedPct = Math.min(100, (added / maxPSI) * 100);
              const hasData = initial > 0 || final > 0;
              return (
                <div className="mt-3 space-y-2">
                  {/* Initial */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest w-16 flex-shrink-0">Initial</span>
                    <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                        style={{ width: hasData ? `${initPct}%` : '0%' }} />
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 w-16 text-right">{initial > 0 ? `${initial} PSI` : '—'}</span>
                  </div>
                  {/* Added */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest w-16 flex-shrink-0">Added</span>
                    <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                        style={{ width: hasData && added > 0 ? `${addedPct}%` : '0%' }} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 w-16 text-right">{added > 0 ? `+${added} PSI` : '—'}</span>
                  </div>
                  {/* Final */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest w-16 flex-shrink-0">Final</span>
                    <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                        style={{ width: hasData ? `${finalPct}%` : '0%' }} />
                    </div>
                    <span className="text-[10px] font-bold text-green-400 w-16 text-right">{final > 0 ? `${final} PSI` : '—'}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottle replaced checkbox */}
          <button
            type="button"
            onClick={() => set('bottle_replaced', !form.bottle_replaced)}
            className="w-full flex items-center gap-3 bg-[#1a1f2e] border border-white/10 rounded-2xl px-4 py-4 text-left hover:border-violet-500/40 transition-colors"
          >
            <div className={cn(
              'w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
              form.bottle_replaced ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
            )}>
              {form.bottle_replaced && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <div>
              <p className="text-sm font-bold text-violet-300">Oxygen Bottle Replaced</p>
              <p className="text-xs text-gray-500">Check if the oxygen bottle was replaced during this service</p>
            </div>
          </button>

          {/* Parts Removal / Installation — shown only when bottle replaced */}
          {form.bottle_replaced && (
            <div className="bg-violet-950/40 border border-violet-500/30 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-extrabold text-violet-300 uppercase tracking-widest">🔩 Parts Removal / Installation</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Part Removed — P/N">
                  <input value={form.removed_pn || ''} onChange={e => set('removed_pn', e.target.value)}
                    placeholder="e.g. 65B27040-1" className={inputCls} />
                </Field>
                <Field label="Part Removed — S/N">
                  <input value={form.removed_sn || ''} onChange={e => set('removed_sn', e.target.value)}
                    placeholder="e.g. SN-001234" className={inputCls} />
                </Field>
                <Field label="Part Installed — P/N">
                  <input value={form.installed_pn || ''} onChange={e => set('installed_pn', e.target.value)}
                    placeholder="e.g. 65B27040-1" className={inputCls} />
                </Field>
                <Field label="Part Installed — S/N">
                  <input value={form.installed_sn || ''} onChange={e => set('installed_sn', e.target.value)}
                    placeholder="e.g. SN-005678" className={inputCls} />
                </Field>
              </div>
              <Field label="Removal / Installation Notes">
                <textarea rows={2} value={form.parts_notes || ''} onChange={e => set('parts_notes', e.target.value)}
                  placeholder="e.g. Removed expired O2 bottle, installed new unit per AMM 35-10-01"
                  className={inputCls + " resize-none"} />
              </Field>
            </div>
          )}

          {/* Technician info */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Technician Name *">
              <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)}
                placeholder="First Last" className={inputCls} />
            </Field>
            <Field label="A&P Cert # / Emp #">
              <input value={form.ap_cert} onChange={e => set('ap_cert', e.target.value)}
                placeholder="AMT-XXXXX" className={inputCls} />
            </Field>
          </div>

          {/* FAA Compliance Notice */}
          <div className="bg-blue-950/60 border border-blue-600/30 rounded-2xl px-4 py-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700/40 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-blue-300 uppercase tracking-widest mb-1">📋 E-Logbook Entry — FAA Compliance Notice</p>
              <p className="text-xs text-blue-400/80 leading-relaxed">
                Upon signing and submitting this form, an <span className="font-bold text-blue-300">official E-Logbook entry</span> will be automatically created under ATA 35 for this aircraft.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button
              disabled={mutation.isPending || !form.aircraft_tail || !form.technician_name}
              onClick={() => mutation.mutate()}
              className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" /> {mutation.isPending ? 'Saving…' : 'Sign & Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
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
      {modal === 'oil'           && <OilServiceModal    onClose={() => setModal(null)} />}
      {modal === 'oxygen'        && <OxygenServiceModal onClose={() => setModal(null)} />}
    </div>
  );
}