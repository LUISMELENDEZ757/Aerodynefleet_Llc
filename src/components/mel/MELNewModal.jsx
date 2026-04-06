import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { X, Plane, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

const CAT_CFG = {
  A: { label: 'Cat A', desc: 'ASAP — requires immediate repair before next flight', days: 0,   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  B: { label: 'Cat B', desc: '3 calendar days from deferral date',                   days: 3,   color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  C: { label: 'Cat C', desc: '10 calendar days from deferral date',                  days: 10,  color: 'text-primary',    bg: 'bg-primary/10 border-primary/30' },
  D: { label: 'Cat D', desc: '120 calendar days from deferral date',                 days: 120, color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/30' },
};

const inputCls = "w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";

function Field({ label, children, required }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function computeExpiry(deferredDate, category) {
  const days = CAT_CFG[category]?.days;
  if (!days) return deferredDate;
  return format(addDays(new Date(deferredDate), days), 'yyyy-MM-dd');
}

export default function MELNewModal({ aircraft = [], onSave, onClose, isPending }) {
  const [form, setForm] = useState({
    aircraft_tail: '',
    aircraft_type: '',
    ata_chapter: '',
    item_number: '',
    description: '',
    category: 'C',
    deferred_date: TODAY,
    ops_procedure: '',
    mx_procedure: '',
    flight_restrictions: '',
    placard_required: false,
    logpage_number: '',
    notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const expiryDate = computeExpiry(form.deferred_date, form.category);
  const cat = CAT_CFG[form.category];

  const handleSave = () => {
    if (!form.aircraft_tail || !form.description || !form.category || !form.deferred_date) return;
    onSave({ ...form, expiry_date: expiryDate, status: 'open' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#141922]">
          <p className="text-sm font-extrabold text-white tracking-wide">NEW MEL DEFERRAL</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Category selector — prominent */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">MEL Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(CAT_CFG).map(([k, v]) => (
                <button key={k} type="button" onClick={() => set('category', k)}
                  className={cn(
                    'rounded-xl border py-3 px-2 text-center transition-all',
                    form.category === k ? v.bg : 'bg-[#141922] border-white/10 hover:border-white/20'
                  )}>
                  <p className={cn('text-sm font-extrabold', form.category === k ? v.color : 'text-gray-400')}>{v.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{v.desc.split(' ')[0]}</p>
                </button>
              ))}
            </div>
            {cat && (
              <p className="text-[10px] text-gray-500 mt-1.5 italic">{cat.desc}</p>
            )}
          </div>

          {/* Aircraft */}
          <Field label="Aircraft Tail" required>
            {aircraft.length > 0 ? (
              <select value={form.aircraft_tail} onChange={e => {
                const ac = aircraft.find(a => a.tail_number === e.target.value);
                set('aircraft_tail', e.target.value);
                if (ac) set('aircraft_type', ac.aircraft_type || '');
              }} className={inputCls}>
                <option value="">Select aircraft…</option>
                {aircraft.filter(a => a.status !== 'retired').map(a => (
                  <option key={a.id} value={a.tail_number}>
                    {a.tail_number} — {a.aircraft_type}{a.base_station ? ` (${a.base_station})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value.toUpperCase())}
                placeholder="e.g. N455GJ" className={inputCls} />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ATA Chapter">
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
                placeholder="e.g. 21-31" className={inputCls} />
            </Field>
            <Field label="Item Number">
              <input value={form.item_number} onChange={e => set('item_number', e.target.value)}
                placeholder="e.g. 01" className={inputCls} />
            </Field>
            <Field label="Deferred Date" required>
              <input type="date" value={form.deferred_date} onChange={e => set('deferred_date', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Logpage #">
              <input value={form.logpage_number} onChange={e => set('logpage_number', e.target.value)}
                placeholder="LP#0001" className={inputCls} />
            </Field>
          </div>

          <Field label="Description" required>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Describe the inoperative item…"
              className={inputCls + ' resize-none'} />
          </Field>

          <Field label="Flight Restrictions / Ops Procedure">
            <input value={form.flight_restrictions} onChange={e => set('flight_restrictions', e.target.value)}
              placeholder="e.g. No ETOPS, CAT I only…" className={inputCls} />
          </Field>

          <Field label="MX Procedure">
            <input value={form.mx_procedure} onChange={e => set('mx_procedure', e.target.value)}
              placeholder="AMM task reference…" className={inputCls} />
          </Field>

          {/* Placard toggle */}
          <label className="flex items-center gap-3 cursor-pointer bg-[#141922] border border-white/10 rounded-xl px-4 py-3">
            <div onClick={() => set('placard_required', !form.placard_required)}
              className={cn('w-10 h-5 rounded-full flex items-center px-0.5 transition-all flex-shrink-0', form.placard_required ? 'bg-primary' : 'bg-white/10')}>
              <div className={cn('w-4 h-4 rounded-full bg-white transition-all', form.placard_required ? 'translate-x-5' : 'translate-x-0')} />
            </div>
            <span className="text-sm font-semibold text-white">Placard Required</span>
          </label>

          {/* Expiry preview */}
          <div className={cn('rounded-xl border px-4 py-3', cat?.bg || 'bg-secondary border-border')}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Calculated Expiry</p>
            <p className={cn('text-lg font-extrabold font-mono', cat?.color || 'text-white')}>{expiryDate}</p>
            <p className="text-[10px] text-gray-500">
              {CAT_CFG[form.category]?.days > 0
                ? `${CAT_CFG[form.category].days} calendar days from ${form.deferred_date}`
                : 'Cat A — must repair before next revenue flight'}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 bg-[#0d1117] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button onClick={handleSave}
            disabled={isPending || !form.aircraft_tail || !form.description}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {isPending ? 'Creating…' : 'Create Deferral'}
          </button>
        </div>
      </div>
    </div>
  );
}