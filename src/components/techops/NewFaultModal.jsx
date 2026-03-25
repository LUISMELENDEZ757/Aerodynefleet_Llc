import { useState } from 'react';
import { X } from 'lucide-react';

export default function NewFaultModal({ aircraftTail, onClose, onSave }) {
  const [form, setForm] = useState({
    aircraft_tail: aircraftTail,
    fault_code: '',
    ata_chapter: '',
    system: 'avionics',
    severity: 'caution',
    description: '',
    detected_at: new Date().toISOString().slice(0, 16),
    flight_phase: '',
    status: 'active',
    notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, detected_at: new Date(form.detected_at).toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white tracking-wide">LOG FAULT MESSAGE</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Fault Code *</label>
              <input required placeholder="e.g. ENG1 OIL PRESS" value={form.fault_code} onChange={e => set('fault_code', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input placeholder="e.g. 71-00" value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">System</label>
              <select value={form.system} onChange={e => set('system', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary">
                <option value="engine">Engine</option>
                <option value="hydraulics">Hydraulics</option>
                <option value="avionics">Avionics</option>
                <option value="electrical">Electrical</option>
                <option value="fuel">Fuel</option>
                <option value="pneumatics">Pneumatics</option>
                <option value="flight_controls">Flight Controls</option>
                <option value="apu">APU</option>
                <option value="landing_gear">Landing Gear</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary">
                <option value="warning">Warning</option>
                <option value="caution">Caution</option>
                <option value="advisory">Advisory</option>
                <option value="memo">Memo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Fault message details..."
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Detected At</label>
              <input type="datetime-local" value={form.detected_at} onChange={e => set('detected_at', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Flight Phase</label>
              <input placeholder="e.g. cruise" value={form.flight_phase} onChange={e => set('flight_phase', e.target.value)}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">
              CANCEL
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              LOG FAULT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}