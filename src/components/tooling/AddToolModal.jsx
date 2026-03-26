import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Wrench } from 'lucide-react';

const inputCls = "w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500 transition-colors";

export default function AddToolModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    tool_number: '', name: '', manufacturer: '', model: '',
    category: 'hand_tool', status: 'available',
    location: '', value: '', calibration_due: '',
    rfid_tag: '', requires_calibration: false, notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => base44.entities.Tool.create({
      ...form,
      value: form.value ? parseFloat(form.value) : 0,
      usage_count: 0,
      qr_code: form.tool_number,
    }),
    onSuccess: (data) => onSuccess(data),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141922] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-400" />
            <p className="font-extrabold text-white">Add New Tool</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tool Number *</label>
              <input value={form.tool_number} onChange={e => set('tool_number', e.target.value)} placeholder="e.g. TRQ-2450" className={inputCls} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                <option value="torque">Torque</option>
                <option value="pneumatic">Pneumatic</option>
                <option value="electrical">Electrical</option>
                <option value="measuring">Measuring</option>
                <option value="hand_tool">Hand Tool</option>
                <option value="inspection">Inspection</option>
                <option value="cutting">Cutting</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tool Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Digital Torque Wrench 0-250 ft-lbs" className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Snap-on" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Model</label>
              <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. ATECH3FR250B" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Tool Crib A - Bay 3" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Value (USD)</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="1250" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Calibration Due</label>
              <input type="date" value={form.calibration_due} onChange={e => set('calibration_due', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">RFID Tag ID</label>
              <input value={form.rfid_tag} onChange={e => set('rfid_tag', e.target.value)} placeholder="e.g. RFID-00A1B2" className={inputCls} />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#1a1f2e] rounded-xl px-4 py-3">
            <input type="checkbox" id="requires_cal" checked={form.requires_calibration} onChange={e => set('requires_calibration', e.target.checked)} className="w-5 h-5 rounded cursor-pointer" />
            <label htmlFor="requires_cal" className="text-sm font-semibold text-white cursor-pointer">Requires Periodic Calibration</label>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes…" className={inputCls + " resize-none"} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button
              disabled={!form.tool_number || !form.name || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-400 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Adding…' : 'Add Tool'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}