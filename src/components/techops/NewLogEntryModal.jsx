import { useState, useRef } from 'react';
import { X, Plane, AlertTriangle, Camera, Image, Upload, Info, ChevronDown, Flame } from 'lucide-react';
import ATAChapterSelector from './ATAChapterSelector';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

function OilInput({ value, onChange }) {
  return (
    <div className="relative">
      <input
        type="number"
        step="0.1"
        min="0"
        placeholder="0.0"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#111827] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400 transition-colors pr-8"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">qt</span>
    </div>
  );
}

function OilServiceSection() {
  const [expanded, setExpanded] = useState(false);
  const [oil, setOil] = useState({
    e1_before: '', e1_added: '', e1_after: '',
    e2_before: '', e2_added: '', e2_after: '',
    apu_before: '', apu_added: '', apu_after: '',
    grade: '',
  });
  const set = (k, v) => setOil(p => ({ ...p, [k]: v }));

  return (
    <div className="border border-dashed border-cyan-500/30 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setExpanded(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyan-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest">Engine &amp; APU Oil Service — ATA 79</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-500/70 italic">Leave blank if not serviced this entry</span>
          <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-cyan-500/20 bg-[#0d1423] p-4 space-y-4">
          {/* Inner card */}
          <div className="bg-[#111827] border border-white/8 rounded-xl p-4 space-y-4">
            {/* Sub-header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest">Engine &amp; APU Oil Service — ATA 79</span>
              </div>
              <span className="text-[10px] text-cyan-500/60 italic">Before &amp; After required when adding oil</span>
            </div>

            {/* ENGINE 1 */}
            <div className="bg-[#0d1423] border border-white/8 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Engine 1</p>
              <div className="grid grid-cols-3 gap-2">
                {[['BEFORE', 'e1_before'], ['ADDED', 'e1_added'], ['AFTER', 'e1_after']].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">{label}</label>
                    <OilInput value={oil[key]} onChange={v => set(key, v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* ENGINE 2 */}
            <div className="bg-[#0d1423] border border-white/8 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Engine 2</p>
              <div className="grid grid-cols-3 gap-2">
                {[['BEFORE', 'e2_before'], ['ADDED', 'e2_added'], ['AFTER', 'e2_after']].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">{label}</label>
                    <OilInput value={oil[key]} onChange={v => set(key, v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* APU */}
            <div className="bg-[#0d1423] border border-white/8 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">APU</p>
              <div className="grid grid-cols-3 gap-2">
                {[['BEFORE', 'apu_before'], ['ADDED', 'apu_added'], ['AFTER', 'apu_after']].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mb-1">{label}</label>
                    <OilInput value={oil[key]} onChange={v => set(key, v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Oil Grade */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Oil Grade / Specification</label>
              <input
                value={oil.grade}
                onChange={e => set('grade', e.target.value)}
                placeholder="e.g. MIL-PRF-7808"
                className="w-full bg-[#0d1423] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewLogEntryModal({ aircraftTail, nextLogPage, preset, onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
    entry_date: today,
    entry_time: now,
  });

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const photoInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFiles = async (files) => {
    const fileArr = Array.from(files);
    if (attachments.length + fileArr.length > 10) return;
    setUploading(true);
    for (const file of fileArr) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments(prev => [...prev, { name: file.name, url: file_url, type: file.type }]);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, notes: attachments.map(a => a.url).join('\n') });
  };

  const entryLabel = {
    discrepancy: 'Discrepancy',
    corrective_action: 'Corrective Action',
    deferred: 'Deferred',
    cleared: 'Cleared',
    info: 'Info',
  }[form.entry_type] || 'Entry';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {entryLabel} — {nextLogPage}
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-primary bg-primary/10">
              <Plane className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-extrabold text-primary tracking-widest">{aircraftTail}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
          <div className="px-6 py-5 space-y-5">

            {/* Row 1: Date | Time | ATA Chapter | Station */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.entry_date}
                  onChange={e => set('entry_date', e.target.value)}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Time</label>
                <input
                  type="time"
                  value={form.entry_time}
                  onChange={e => set('entry_time', e.target.value)}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">ATA Chapter</label>
                <ATAChapterSelector value={form.ata_chapter} onChange={v => set('ata_chapter', v)} dark={true} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Station</label>
                <input
                  placeholder="KDEN"
                  value={form.station}
                  onChange={e => set('station', e.target.value)}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Entry type selector (small row) */}
            <div className="flex gap-2 flex-wrap">
              {['discrepancy','corrective_action','deferred','cleared','info'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('entry_type', t)}
                  className={cn(
                    'px-3 py-1 rounded-full text-[11px] font-bold border transition-all',
                    form.entry_type === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  )}
                >
                  {t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                Technician Discrepancy / Write-Up *
              </label>
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe the discrepancy found during maintenance inspection or operation..."
                className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Deferred toggle */}
            <button
              type="button"
              onClick={() => set('is_deferred', !form.is_deferred)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all',
                form.is_deferred
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'border-white/15 text-gray-400 hover:text-white hover:border-white/25'
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              Deferred Item
            </button>

            {/* MEL fields (shown when deferred) */}
            {form.is_deferred && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">MEL Reference</label>
                  <input
                    value={form.mel_reference}
                    onChange={e => set('mel_reference', e.target.value)}
                    placeholder="e.g. MEL 32-40-1"
                    className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">MEL Category</label>
                  <select
                    value={form.mel_category}
                    onChange={e => set('mel_category', e.target.value)}
                    className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="A">A — ASAP</option>
                    <option value="B">B — 3 Days</option>
                    <option value="C">C — 10 Days</option>
                    <option value="D">D — 120 Days</option>
                  </select>
                </div>
              </div>
            )}

            {/* Photo / Document Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera className="w-3 h-3" />
                  Photo / Document Attachments — Damage, Work Area, Supporting Docs
                </label>
                <span className="text-[10px] text-gray-600">{attachments.length}/10</span>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={cn(
                  'border-2 border-dashed rounded-xl p-4 transition-colors',
                  dragOver ? 'border-primary/60 bg-primary/5' : 'border-white/10'
                )}
              >
                <div className="flex gap-2 mb-3">
                  {/* Take Photo (camera capture) */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" /> Take Photo
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFiles(e.target.files)} />

                  {/* Photo/Image from library */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a2035] border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
                  >
                    <Image className="w-4 h-4 text-purple-400" /> Photo/Image
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

                  {/* Document */}
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a2035] border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-400" /> Document
                  </button>
                  <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                </div>

                <p className="text-xs text-gray-600 text-center">Or drag &amp; drop images / PDFs here</p>

                {/* Preview thumbnails */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {attachments.map((att, i) => (
                      <div key={i} className="relative group">
                        {att.type?.startsWith('image/') ? (
                          <img src={att.url} alt={att.name} className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                        ) : (
                          <div className="w-14 h-14 bg-[#1a2035] border border-white/10 rounded-lg flex items-center justify-center">
                            <Upload className="w-5 h-5 text-blue-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploading && <p className="text-xs text-primary text-center mt-2 animate-pulse">Uploading…</p>}
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-3 mt-2 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
                <Camera className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Attach photos of damage, work area, or supporting documents for FAA record keeping.{' '}
                  <span className="text-blue-400 font-semibold">Works with smartphone &amp; tablet camera.</span>
                </p>
              </div>
            </div>

            {/* Technician Name + Cert */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Technician Name *</label>
                <input
                  required
                  placeholder="First Last"
                  value={form.technician_name}
                  onChange={e => set('technician_name', e.target.value)}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">A&amp;P / IA Cert # / Emp #</label>
                <input
                  placeholder="AMT-XXXXX"
                  value={form.technician_id}
                  onChange={e => set('technician_id', e.target.value)}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Engine & APU Oil Service Tracking */}
            <OilServiceSection />

            {/* Corrective Action (optional) */}
            {(form.entry_type === 'corrective_action' || form.entry_type === 'cleared') && (
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Corrective Action</label>
                <textarea
                  rows={3}
                  value={form.corrective_action}
                  onChange={e => set('corrective_action', e.target.value)}
                  placeholder="Corrective action taken..."
                  className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Upload className="w-4 h-4" /> Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}