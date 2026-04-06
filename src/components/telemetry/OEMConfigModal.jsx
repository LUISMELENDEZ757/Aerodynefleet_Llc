import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Settings, ExternalLink, Shield, Key, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['active','pending_credentials','pending_contract','inactive','error'];
const AUTH_TYPES = ['api_key','oauth2','basic','certificate','acars'];
const CATEGORY_OPTIONS = ['airframe','engine','avionics','apu','systems'];
const DATA_TYPE_OPTIONS = ['flight_hours','engine_cycles','fault_codes','engine_health','apu_health','structural','avionics','fuel_burn','vibration','egt_margin'];

const inputCls = "w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";

export default function OEMConfigModal({ connector, onClose }) {
  const qc = useQueryClient();
  const isNew = !connector?.id;
  const [form, setForm] = useState({
    oem_id: connector?.oem_id || '',
    name: connector?.name || '',
    category: connector?.category || 'engine',
    base_url: connector?.base_url || '',
    auth_type: connector?.auth_type || 'api_key',
    api_key_ref: connector?.api_key_ref || '',
    client_id: connector?.client_id || '',
    contract_reference: connector?.contract_reference || '',
    contract_expiry: connector?.contract_expiry || '',
    status: connector?.status || 'pending_contract',
    data_types: connector?.data_types || [],
    applicable_aircraft_types: connector?.applicable_aircraft_types || [],
    notes: connector?.notes || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (data) => isNew
      ? base44.entities.OEMIntegration.create(data)
      : base44.entities.OEMIntegration.update(connector.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['oem-integrations'] }); onClose(); },
  });

  const toggleArr = (key, val) => setForm(p => ({
    ...p,
    [key]: p[key].includes(val) ? p[key].filter(v => v !== val) : [...p[key], val],
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#141922]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-white">{isNew ? 'ADD OEM INTEGRATION' : 'CONFIGURE INTEGRATION'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">OEM ID *</label>
              <input value={form.oem_id} onChange={e => set('oem_id', e.target.value.toLowerCase().replace(/\s/g,'_'))} placeholder="e.g. boeing_ahm" className={inputCls} disabled={!isNew} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Display Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Boeing AHM" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">API Base URL</label>
            <input value={form.base_url} onChange={e => set('base_url', e.target.value)} placeholder="https://api.example.com/v1" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Auth Type</label>
              <select value={form.auth_type} onChange={e => set('auth_type', e.target.value)} className={inputCls}>
                {AUTH_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Secret Key Name</label>
              <input value={form.api_key_ref} onChange={e => set('api_key_ref', e.target.value)} placeholder="e.g. BOEING_AHM_API_KEY" className={inputCls} />
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Key className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-400 mb-0.5">API Keys / Credentials</p>
              <p className="text-[10px] text-amber-300/80">Never enter actual keys here. Add them in <strong>Dashboard → Settings → Secrets</strong> using the exact name referenced above.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Contract Reference</label>
              <input value={form.contract_reference} onChange={e => set('contract_reference', e.target.value)} placeholder="Agreement #" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Contract Expiry</label>
              <input type="date" value={form.contract_expiry} onChange={e => set('contract_expiry', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Available Data Streams</label>
            <div className="flex flex-wrap gap-1.5">
              {DATA_TYPE_OPTIONS.map(d => (
                <button key={d} type="button" onClick={() => toggleArr('data_types', d)}
                  className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all',
                    form.data_types.includes(d) ? 'border-primary/60 bg-primary/15 text-primary' : 'border-white/10 text-gray-400 hover:border-white/20')}>
                  {d.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Account manager, support contact, portal URL…" className={inputCls + ' resize-none'} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.oem_id || !form.name}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40">
            {saveMutation.isPending ? 'Saving…' : 'Save Integration'}
          </button>
        </div>
      </div>
    </div>
  );
}