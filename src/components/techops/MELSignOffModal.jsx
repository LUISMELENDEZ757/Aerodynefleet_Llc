/**
 * MELSignOffModal — Quick sign-off to clear a restrictive MEL / lift restriction.
 * Creates a 'cleared' logbook entry + marks the MEL item as cleared.
 */
import { useState } from 'react';
import { X, CheckCircle, Shield, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const inputCls = "w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";
const textareaCls = `${inputCls} resize-none`;

export default function MELSignOffModal({ melItem, aircraftTail, nextLogPage, onClose }) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    corrective_action: '',
    technician_name: '',
    technician_id: '',
    station: '',
    notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const canSubmit = form.corrective_action.trim().length > 5
    && form.technician_name.trim()
    && form.technician_id.trim()
    && form.station.trim();

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Create cleared logbook entry
      await base44.entities.LogbookEntry.create({
        aircraft_tail: aircraftTail,
        log_page: nextLogPage,
        entry_type: 'cleared',
        ata_chapter: melItem.ata_chapter || '',
        station: form.station,
        description: `MEL CLEARED — ${melItem.description}`,
        corrective_action: form.corrective_action,
        technician_name: form.technician_name,
        technician_id: form.technician_id,
        is_deferred: false,
        is_cleared: true,
        mel_reference: melItem.item_number || '',
        mel_category: melItem.category || '',
        cleared_by: form.technician_name,
        cleared_date: new Date().toISOString().split('T')[0],
        discrepancy_status: 'CLOSED',
        notes: form.notes || undefined,
      });
      // 2. Mark MEL item as cleared
      await base44.entities.MELItem.update(melItem.id, {
        status: 'cleared',
        cleared_by: form.technician_name,
        cleared_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['logbook-mel'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-all-mel'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-lg bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0f1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-700/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white tracking-wide">MEL Sign-Off / Lift Restriction</p>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">{aircraftTail} · 14 CFR 43.9</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* MEL item summary */}
          <div className="bg-red-950/30 border border-red-500/40 rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-800 text-red-300 uppercase">
                CAT {melItem.category} · {melItem.ata_chapter || 'MEL'}
              </span>
              {melItem.etops_impact === 'NO_ETOPS' && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-900 text-orange-300">NO ETOPS</span>
              )}
              {melItem.placard_required && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-900 text-yellow-300">PLACARD REQ'D</span>
              )}
            </div>
            <p className="text-xs font-semibold text-red-200">{melItem.description}</p>
            {melItem.flight_restrictions && (
              <p className="text-[10px] text-red-400">⚠ {melItem.flight_restrictions}</p>
            )}
          </div>

          {/* Station */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Station (ICAO) *</label>
            <input placeholder="e.g. KEWR" value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} className={inputCls} />
          </div>

          {/* Corrective Action */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Corrective Action / Reason for Clearance *</label>
            <textarea rows={4} value={form.corrective_action} onChange={e => set('corrective_action', e.target.value)}
              placeholder="Describe the repair, component replaced, test performed, or reason restriction is lifted. Reference AMM section."
              className={textareaCls} />
          </div>

          {/* Technician */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Technician Name *</label>
              <input placeholder="First Last" value={form.technician_name} onChange={e => set('technician_name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">A&P Cert # *</label>
              <input placeholder="AMT-XXXXX" value={form.technician_id} onChange={e => set('technician_id', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Additional Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Optional: test flight result, ops check, placard removed..." className={textareaCls} />
          </div>

          {/* Legal notice */}
          <div className="bg-blue-900/15 border border-blue-500/25 rounded-xl px-4 py-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Submitting this sign-off creates a <span className="text-green-400 font-bold">CLEARED</span> logbook entry and lifts the MEL restriction. This record is permanent per 14 CFR 43.9(a)(4).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 bg-[#0a0f1a]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-700 text-white text-sm font-extrabold hover:bg-green-600 disabled:opacity-40 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {mutation.isPending ? 'Saving…' : 'Sign Off & Lift Restriction'}
          </button>
        </div>
      </div>
    </div>
  );
}