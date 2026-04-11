import { useState } from 'react';
import { X } from 'lucide-react';
import ATAChapterSelector from './ATAChapterSelector';

export default function NewLogEntryModal({ aircraftTail, nextLogPage, preset, onClose, onSave }) {
  const [form, setForm] = useState({
    aircraft_tail: aircraftTail,
    log_page: nextLogPage,
    entry_type: preset?.entry_type || 'discrepancy',
    ata_chapter: '',
    description: preset?.description ? `${preset.description}: ` : '',
    corrective_action: '',
    technician_name: '',
    technician_id: '',
    discrepancy_status: 'OPEN',
    is_deferred: false,
    is_cleared: false,
    mel_reference: '',
    mel_category: '',
    flight_number: '',
    station: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white tracking-wide">NEW LOG ENTRY</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Log Page</label>
              <input value={form.log_page} onChange={e => set('log_page', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Entry Type</label>
              <select value={form.entry_type} onChange={e => set('entry_type', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary">
                <option value="discrepancy">Discrepancy</option>
                <option value="corrective_action">Corrective Action</option>
                <option value="deferred">Deferred</option>
                <option value="cleared">Cleared</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <ATAChapterSelector value={form.ata_chapter} onChange={v => set('ata_chapter', v)} dark={true} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Station</label>
              <input placeholder="e.g. KDAL" value={form.station} onChange={e => set('station', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Discrepancy / Description *</label>
            <textarea required rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the discrepancy or event..."
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Technician Name</label>
              <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Tech ID / License</label>
              <input value={form.technician_id} onChange={e => set('technician_id', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Corrective Action</label>
            <textarea rows={2} value={form.corrective_action} onChange={e => set('corrective_action', e.target.value)}
              placeholder="Corrective action taken (if any)..."
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Corrected By</label>
              <input value={form.corrected_by || ''} onChange={e => set('corrected_by', e.target.value)}
                placeholder="Technician name"
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Tech ID / License</label>
              <input value={form.corrected_by_id || ''} onChange={e => set('corrected_by_id', e.target.value)}
                placeholder="e.g. AMT-12345"
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#1a1f2e] border border-white/10 rounded-lg px-4 py-3">
            <input type="checkbox" id="deferred" checked={form.is_deferred} onChange={e => set('is_deferred', e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer" />
            <label htmlFor="deferred" className="text-sm font-semibold text-white cursor-pointer">Deferred (MEL/CDL)</label>
          </div>

          {form.is_deferred && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">MEL Reference</label>
                <input value={form.mel_reference} onChange={e => set('mel_reference', e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">MEL Category</label>
                <select value={form.mel_category} onChange={e => set('mel_category', e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary">
                  <option value="">Select</option>
                  <option value="A">A — ASAP</option>
                  <option value="B">B — 3 Days</option>
                  <option value="C">C — 10 Days</option>
                  <option value="D">D — 120 Days</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">
              CANCEL
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              SAVE ENTRY
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}