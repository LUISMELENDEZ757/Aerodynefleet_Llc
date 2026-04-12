import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  BookOpen, Plane, AlertTriangle, ChevronDown, Plus,
  Printer, Clock, CheckCircle, Wrench, Zap, Shield,
  FilePlus, QrCode, X, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  active:      { label: 'IN SERVICE',     bg: 'bg-green-600',  dot: 'bg-green-400' },
  oos:         { label: 'OUT OF SERVICE', bg: 'bg-red-700',    dot: 'bg-red-400' },
  maintenance: { label: 'MAINTENANCE',   bg: 'bg-orange-600', dot: 'bg-orange-400' },
  retired:     { label: 'RETIRED',        bg: 'bg-gray-600',   dot: 'bg-gray-400' },
};

const SEVERITY_STYLES = {
  warning:  { label: 'WARNING',  bg: 'bg-red-700',    text: 'text-red-300',    border: 'border-red-600' },
  caution:  { label: 'CAUTION',  bg: 'bg-amber-700',  text: 'text-amber-300',  border: 'border-amber-600' },
  advisory: { label: 'ADVISORY', bg: 'bg-blue-700',   text: 'text-blue-300',   border: 'border-blue-600' },
  memo:     { label: 'MEMO',     bg: 'bg-gray-700',   text: 'text-gray-300',   border: 'border-gray-600' },
};

const ENTRY_STYLES = {
  discrepancy:       { label: 'DISCREPANCY',       color: 'text-red-400',    border: 'border-red-500/30' },
  corrective_action: { label: 'CORRECTIVE ACTION', color: 'text-green-400',  border: 'border-green-500/30' },
  deferred:          { label: 'DEFERRED',           color: 'text-amber-400',  border: 'border-amber-500/30' },
  cleared:           { label: 'CLEARED',            color: 'text-blue-400',   border: 'border-blue-500/30' },
  info:              { label: 'INFO',               color: 'text-gray-400',   border: 'border-gray-500/30' },
};

function useElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ── New Entry Form ────────────────────────────────────────────────────────────
function NewEntryForm({ aircraftTail, nextLogPage, preset, onClose, onSave }) {
  const [form, setForm] = useState({
    entry_type: preset?.entry_type || 'discrepancy',
    description: preset?.description || '',
    ata_chapter: '',
    corrective_action: '',
    technician_name: '',
    station: '',
    log_page: nextLogPage,
    is_deferred: false,
    mel_category: 'C',
    mel_reference: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white">New Log Entry — {nextLogPage}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Entry Type</label>
              <select value={form.entry_type} onChange={e => set('entry_type', e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
                {Object.entries(ENTRY_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
                placeholder="e.g. 79" className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Description *</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the discrepancy or action…"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Technician Name</label>
              <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)}
                placeholder="A&P Name" className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value)}
                placeholder="e.g. KEWR" className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>
          {form.entry_type === 'corrective_action' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Corrective Action</label>
              <textarea rows={2} value={form.corrective_action} onChange={e => set('corrective_action', e.target.value)}
                placeholder="Work performed…"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('is_deferred', !form.is_deferred)}
              className={cn('w-10 h-5 rounded-full transition-all flex items-center px-0.5', form.is_deferred ? 'bg-primary' : 'bg-white/10')}>
              <div className={cn('w-4 h-4 rounded-full bg-white transition-all', form.is_deferred ? 'translate-x-5' : 'translate-x-0')} />
            </div>
            <span className="text-sm text-gray-300">Deferred under MEL</span>
          </label>
          {form.is_deferred && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MEL Category</label>
                <select value={form.mel_category} onChange={e => set('mel_category', e.target.value)}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
                  {['A','B','C','D'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MEL Reference</label>
                <input value={form.mel_reference} onChange={e => set('mel_reference', e.target.value)}
                  placeholder="e.g. 29-11-1" className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none" />
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button
            disabled={!form.description}
            onClick={() => onSave({ ...form, aircraft_tail: aircraftTail })}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Fault Form ────────────────────────────────────────────────────────────
function NewFaultForm({ aircraftTail, onClose, onSave }) {
  const [form, setForm] = useState({
    fault_code: '', severity: 'caution', system: 'engine',
    ata_chapter: '', description: '', flight_phase: '',
    detected_at: new Date().toISOString().slice(0, 16),
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white">Log Fault Message</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fault Code *</label>
              <input value={form.fault_code} onChange={e => set('fault_code', e.target.value)}
                placeholder="e.g. ENG L OIL PRESS" className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
                {['warning','caution','advisory','memo'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">System</label>
              <select value={form.system} onChange={e => set('system', e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none">
                {['engine','hydraulics','avionics','electrical','fuel','pneumatics','flight_controls','apu','landing_gear','other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
                placeholder="e.g. 79" className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button
            disabled={!form.fault_code}
            onClick={() => onSave({ ...form, aircraft_tail: aircraftTail, status: 'active', detected_at: new Date(form.detected_at).toISOString() })}
            className="px-5 py-2 rounded-xl bg-red-700 text-white text-sm font-bold disabled:opacity-40 hover:bg-red-600"
          >
            Log Fault
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry Card (clickable for corrective action) ────────────────────────────
function EntryCard({ entry, style, onUpdate }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [correction, setCorrection] = useState('');
  const [techName, setTechName] = useState('');

  const correctMutation = useMutation({
    mutationFn: () => base44.entities.LogbookEntry.update(entry.id, {
      corrective_action: correction,
      technician_name: techName || entry.technician_name,
      discrepancy_status: 'CLOSED',
      is_cleared: true,
      work_completed_at: new Date().toISOString(),
    }),
    onSuccess: () => { setOpen(false); onUpdate(); },
  });

  const canCorrect = entry.entry_type === 'discrepancy' && !entry.is_cleared;

  return (
    <div className={cn('border-l-2 rounded-xl bg-black/20 transition-colors', style.border, canCorrect && 'cursor-pointer hover:bg-white/5')}>
      <div onClick={() => canCorrect && setOpen(v => !v)} className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn('text-[10px] font-bold tracking-widest', style.color)}>{style.label}</span>
              {entry.log_page && (
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded">{entry.log_page}</span>
              )}
              {entry.ata_chapter && <span className="text-[10px] text-gray-600">ATA {entry.ata_chapter}</span>}
              {canCorrect && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded ml-auto">
                  {open ? '▲ Close' : '▼ Correct'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-200">{entry.description}</p>
            {entry.corrective_action && <p className="text-xs text-green-400 mt-1">✓ {entry.corrective_action}</p>}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {entry.technician_name && <span className="text-[10px] text-gray-600 flex items-center gap-1"><Wrench className="w-2.5 h-2.5" />{entry.technician_name}</span>}
              {entry.is_deferred && !entry.is_cleared && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">MEL {entry.mel_category} — {entry.mel_reference}</span>
              )}
              {entry.is_cleared && <span className="text-[10px] font-bold text-green-400 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" />CLOSED</span>}
              {entry.is_signed && <span className="text-[10px] font-bold text-primary flex items-center gap-1"><Shield className="w-2.5 h-2.5" />SIGNED</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-mono text-gray-600">{new Date(entry.created_date).toLocaleDateString()}</p>
            <p className="text-[10px] font-mono text-gray-600">{new Date(entry.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
          </div>
        </div>
      </div>
      {open && canCorrect && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3 bg-green-950/20">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Corrective Action Sign-Off</p>
          <textarea rows={3} value={correction} onChange={e => setCorrection(e.target.value)}
            placeholder="Describe corrective action performed…"
            className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
          <div className="flex items-center gap-2">
            <input value={techName} onChange={e => setTechName(e.target.value)}
              placeholder={entry.technician_name || 'Technician name / cert'}
              className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button disabled={!correction || correctMutation.isPending} onClick={() => correctMutation.mutate()}
              className="px-4 py-2 rounded-xl bg-green-700 text-white text-xs font-bold disabled:opacity-40 hover:bg-green-600">
              {correctMutation.isPending ? 'Saving…' : 'Sign Off'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TechOpsLogbook() {
  const urlParams = new URLSearchParams(window.location.search);
  const tailParam = urlParams.get('tail');

  const [selectedTail, setSelectedTail] = useState(tailParam || null);
  const [tailDropdown, setTailDropdown] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showNewFault, setShowNewFault] = useState(false);
  const [entryPreset, setEntryPreset] = useState(null);
  const [faultTab, setFaultTab] = useState('active');
  const elapsed = useElapsedTime();
  const queryClient = useQueryClient();

  const { data: aircraft = [] } = useQuery({
    queryKey: ['logbook-aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
  });

  useEffect(() => {
    if (!selectedTail && aircraft.length > 0) setSelectedTail(aircraft[0].tail_number);
  }, [aircraft, selectedTail]);

  const selectedAc = aircraft.find(a => a.tail_number === selectedTail) || aircraft[0];

  const { data: entries = [] } = useQuery({
    queryKey: ['logbook-entries', selectedTail],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: selectedTail }),
    enabled: !!selectedTail,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['logbook-faults', selectedTail],
    queryFn: () => base44.entities.FaultMessage.filter({ aircraft_tail: selectedTail }),
    enabled: !!selectedTail,
  });

  const createEntry = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }); setShowNewEntry(false); setEntryPreset(null); },
  });

  const createFault = useMutation({
    mutationFn: (data) => base44.entities.FaultMessage.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-faults'] }); setShowNewFault(false); },
  });

  const clearFault = useMutation({
    mutationFn: (id) => base44.entities.FaultMessage.update(id, { status: 'cleared', cleared_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logbook-faults'] }),
  });

  const wireToLogbook = useMutation({
    mutationFn: (fault) => {
      const nextPage = `LP#${String(entries.length + 1).padStart(4, '0')}`;
      return base44.entities.LogbookEntry.create({
        aircraft_tail: fault.aircraft_tail,
        log_page: nextPage,
        entry_type: 'discrepancy',
        ata_chapter: fault.ata_chapter || '',
        station: selectedAc?.base_station || '',
        description: `[FAULT → LOGBOOK] ${fault.fault_code}${fault.description ? ` — ${fault.description}` : ''}\nSeverity: ${fault.severity?.toUpperCase()} | System: ${fault.system?.toUpperCase()}`,
        notes: `Auto-wired from FaultMessage ID: ${fault.id}`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }),
  });

  const openItems = entries.filter(e => e.is_deferred && !e.is_cleared).length;
  const activeFaults = faults.filter(f => f.status === 'active');
  const clearedFaults = faults.filter(f => f.status === 'cleared');
  const nextLogPage = `LP#${String(entries.length + 1).padStart(4, '0')}`;
  const statusCfg = STATUS_STYLES[selectedAc?.status] || STATUS_STYLES.active;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    const rows = entries.map(e => {
      const style = ENTRY_STYLES[e.entry_type] || ENTRY_STYLES.discrepancy;
      return `<tr><td>${e.log_page || '—'}</td><td>${style.label}</td><td>${e.ata_chapter || '—'}</td><td>${e.description || '—'}</td><td>${e.technician_name || '—'}</td><td>${new Date(e.created_date).toLocaleDateString()}</td></tr>`;
    }).join('');
    win.document.write(`<html><head><title>E-Logbook ${selectedAc?.tail_number}</title>
    <style>body{font-family:Arial;font-size:12px;margin:32px}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#f3f4f6;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase}td{padding:6px 8px;border-bottom:1px solid #eee}</style>
    </head><body><h1>E-LOGBOOK — ${selectedAc?.tail_number || '—'}</h1>
    <p>${selectedAc?.aircraft_type || '—'} | ${selectedAc?.base_station || '—'} | ${statusCfg.label}</p>
    <p>Entries: ${entries.length} | Open Items: ${openItems} | Active Faults: ${activeFaults.length}</p>
    <table><thead><tr><th>Page</th><th>Type</th><th>ATA</th><th>Description</th><th>Tech</th><th>Date</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center">No entries</td></tr>'}</tbody></table>
    <p style="margin-top:24px;font-size:10px;color:#aaa">Printed: ${new Date().toLocaleString()}</p>
    </body></html>`);
    win.document.close(); win.print(); win.close();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0d1117] border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">E-Logbook</p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Records System</p>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-3 py-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-mono text-amber-400">{elapsed}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Aircraft selector */}
          <div className="relative">
            <button onClick={() => setTailDropdown(v => !v)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:border-white/20 transition-all">
              <Plane className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-sm">{selectedAc?.tail_number || '—'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {tailDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTailDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl max-h-64 overflow-y-auto">
                  {aircraft.map(a => (
                    <button key={a.id} onClick={() => { setSelectedTail(a.tail_number); setTailDropdown(false); }}
                      className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left',
                        a.tail_number === selectedTail && 'bg-primary/10 text-primary')}>
                      <span className="font-bold">{a.tail_number}</span>
                      <span className="text-xs text-gray-400">{a.aircraft_type}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={handlePrint} title="Print" className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-primary/20">
            <Printer className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-w-4xl mx-auto">
        {/* Aircraft Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1 bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-4xl font-black tracking-wide">{selectedAc?.tail_number || '—'}</p>
            <p className="text-sm text-gray-400">{selectedAc?.aircraft_type || '—'}</p>
            <p className="text-2xl font-black">{selectedAc?.base_station || '—'}</p>
            <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-white', statusCfg.bg)}>
              <span className={cn('w-2 h-2 rounded-full', statusCfg.dot)} />
              {statusCfg.label}
            </span>
          </div>
          {[
            { label: 'Log Entries', value: entries.length, color: 'text-white', icon: BookOpen },
            { label: 'Open Items', value: openItems, color: openItems > 0 ? 'text-amber-400' : 'text-white', icon: AlertTriangle },
            { label: 'Active Faults', value: activeFaults.length, color: activeFaults.length > 0 ? 'text-red-400' : 'text-white', icon: Zap },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Icon className="w-3 h-3" /> {label}
              </p>
              <p className={cn('text-5xl font-black', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Quick Entry Buttons */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Entry</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Pilot Discrepancy',    type: 'discrepancy',       border: 'border-red-700',    text: 'text-red-400',    bg: 'bg-red-950/40' },
              { label: 'Tech Discrepancy',     type: 'discrepancy',       border: 'border-amber-800',  text: 'text-amber-400',  bg: 'bg-amber-950/40' },
              { label: 'Corrective Action',    type: 'corrective_action', border: 'border-green-700',  text: 'text-green-400',  bg: 'bg-green-950/40' },
              { label: 'MEL Deferral',         type: 'deferred',          border: 'border-yellow-700', text: 'text-yellow-400', bg: 'bg-yellow-950/40' },
              { label: 'Oil Service',          type: 'info',              border: 'border-blue-800',   text: 'text-blue-300',   bg: 'bg-blue-950/40' },
              { label: 'Oxygen Service',       type: 'info',              border: 'border-cyan-700',   text: 'text-cyan-400',   bg: 'bg-cyan-950/40' },
              { label: 'Parts Installation',   type: 'corrective_action', border: 'border-purple-700', text: 'text-purple-400', bg: 'bg-purple-950/40' },
              { label: 'Parts Ordering',       type: 'info',              border: 'border-amber-900',  text: 'text-amber-600',  bg: 'bg-amber-950/30' },
            ].map(({ label, type, border, text, bg }) => (
              <button key={label}
                onClick={() => { setEntryPreset({ entry_type: type, description: label }); setShowNewEntry(true); }}
                className={cn('px-3 py-2.5 rounded-xl border font-bold text-xs tracking-wide transition-all hover:brightness-125', border, text, bg)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Fault Messages */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-base font-extrabold">FAULT MESSAGES (EICAS/BITE)</p>
              <p className="text-xs text-gray-500 mt-0.5">System-generated fault codes</p>
            </div>
            <div className="flex items-center gap-2">
              {['active','cleared'].map(tab => (
                <button key={tab} onClick={() => setFaultTab(tab)}
                  className={cn('px-4 py-1.5 rounded-lg text-xs font-bold border transition-all',
                    faultTab === tab ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-gray-500 hover:text-gray-300')}>
                  {tab.toUpperCase()} {tab === 'active' ? activeFaults.length : clearedFaults.length}
                </button>
              ))}
              <button onClick={() => setShowNewFault(true)}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> LOG FAULT
              </button>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {(faultTab === 'active' ? activeFaults : clearedFaults).length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-600 text-sm">
                {faultTab === 'active' ? 'No active fault messages' : 'No cleared faults'}
              </div>
            ) : (faultTab === 'active' ? activeFaults : clearedFaults).map(fault => {
              const sev = SEVERITY_STYLES[fault.severity] || SEVERITY_STYLES.caution;
              const alreadyLogged = entries.some(e => e.description?.includes(`[FAULT → LOGBOOK] ${fault.fault_code}`));
              return (
                <div key={fault.id} className={cn('flex items-start justify-between px-5 py-4 hover:bg-white/5 transition-colors border-l-2', sev.border)}>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 text-white mt-0.5', sev.bg)}>{sev.label}</span>
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-sm">{fault.fault_code}</p>
                      {fault.description && <p className="text-xs text-gray-400 truncate">{fault.description}</p>}
                      {fault.ata_chapter && <p className="text-xs text-gray-600 mt-0.5">ATA {fault.ata_chapter}</p>}
                    </div>
                  </div>
                  {fault.status === 'active' && (
                    <div className="flex gap-1.5 flex-shrink-0 ml-3">
                      <button onClick={() => !alreadyLogged && wireToLogbook.mutate(fault)} disabled={alreadyLogged || wireToLogbook.isPending}
                        className={cn('text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1',
                          alreadyLogged ? 'border-primary/20 text-primary/40 cursor-default' : 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30')}>
                        <FilePlus className="w-3 h-3" /> {alreadyLogged ? 'LOGGED' : 'LOG'}
                      </button>
                      <button onClick={() => clearFault.mutate(fault.id)}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-green-800/50 text-green-400 border border-green-700 hover:bg-green-700/50 transition-colors">
                        CLEAR
                      </button>
                    </div>
                  )}
                  {fault.status === 'cleared' && (
                    <span className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0 ml-3">
                      <CheckCircle className="w-3.5 h-3.5" /> Cleared
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Log Entries */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-base font-extrabold">LOG ENTRIES</p>
              <p className="text-xs text-gray-500 mt-0.5">Discrepancies, corrective actions, deferrals</p>
            </div>
            <button onClick={() => { setEntryPreset(null); setShowNewEntry(true); }}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5" /> NEW ENTRY
            </button>
          </div>
          {entries.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-600 text-sm">
              No log entries yet — tap "NEW ENTRY" to create the first record
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {entries.map(entry => {
                const style = ENTRY_STYLES[entry.entry_type] || ENTRY_STYLES.discrepancy;
                return (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    style={style}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['logbook-entries', selectedTail] })}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showNewEntry && (
        <NewEntryForm
          aircraftTail={selectedTail}
          nextLogPage={nextLogPage}
          preset={entryPreset}
          onClose={() => { setShowNewEntry(false); setEntryPreset(null); }}
          onSave={(data) => createEntry.mutate(data)}
        />
      )}

      {showNewFault && (
        <NewFaultForm
          aircraftTail={selectedTail}
          onClose={() => setShowNewFault(false)}
          onSave={(data) => createFault.mutate(data)}
        />
      )}
    </div>
  );
}