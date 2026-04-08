import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  X, ChevronRight, ChevronLeft, CheckCircle, Plane,
  Shield, Globe, Settings, FileText, Eye, Plus
} from 'lucide-react';

// ── Known type presets ────────────────────────────────────────────────────────
const TYPE_PRESETS = {
  'B777': { max_etops: 370, max_cat: 'CAT IIIc', polar: true,  rnp: 'RNP AR 0.1', rvsm: true, perf: 'B777_profile' },
  'B787': { max_etops: 370, max_cat: 'CAT IIIb', polar: true,  rnp: 'RNP AR 0.1', rvsm: true, perf: 'B787_profile' },
  'A350': { max_etops: 370, max_cat: 'CAT IIIb', polar: true,  rnp: 'RNP AR 0.1', rvsm: true, perf: 'A350_profile' },
  'B767': { max_etops: 180, max_cat: 'CAT IIIa', polar: false, rnp: 'RNP 0.3',    rvsm: true, perf: 'B767_profile' },
  'B757': { max_etops: 120, max_cat: 'CAT IIIa', polar: false, rnp: 'RNP 0.3',    rvsm: true, perf: 'B757_profile' },
  'B737 MAX': { max_etops: 180, max_cat: 'CAT IIIb', polar: false, rnp: 'RNP AR 0.3', rvsm: true, perf: 'B737_profile' },
  'B737-800': { max_etops: 120, max_cat: 'CAT IIIa', polar: false, rnp: 'RNP 0.3', rvsm: true, perf: 'B737_profile' },
  'B737-900': { max_etops: 120, max_cat: 'CAT IIIa', polar: false, rnp: 'RNP 0.3', rvsm: true, perf: 'B737_profile' },
  'B737-700': { max_etops: 0,   max_cat: 'CAT II',   polar: false, rnp: 'RNP 0.3', rvsm: true, perf: 'B737_profile' },
  'A320':     { max_etops: 180, max_cat: 'CAT IIIb', polar: false, rnp: 'RNP AR 0.3', rvsm: true, perf: 'A320_profile' },
  'A321':     { max_etops: 180, max_cat: 'CAT IIIb', polar: false, rnp: 'RNP AR 0.3', rvsm: true, perf: 'A320_profile' },
  'E190':     { max_etops: 0,   max_cat: 'CAT II',   polar: false, rnp: 'RNP 0.3', rvsm: true, perf: 'E190_profile' },
  'E175':     { max_etops: 0,   max_cat: 'CAT II',   polar: false, rnp: 'RNP 0.3', rvsm: true, perf: 'E190_profile' },
  'CRJ700':   { max_etops: 0,   max_cat: 'CAT II',   polar: false, rnp: 'RNP 1.0', rvsm: false, perf: 'CRJ700_profile' },
  'CRJ900':   { max_etops: 0,   max_cat: 'CAT II',   polar: false, rnp: 'RNP 1.0', rvsm: false, perf: 'CRJ700_profile' },
};

const AIRCRAFT_TYPES = ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','B757','B767','B777','B787','A320','A321','A350','E190','E175','CRJ700','CRJ900'];
const CAT_OPTIONS = ['CAT I','CAT II','CAT IIIa','CAT IIIb','CAT IIIc'];
const RNP_OPTIONS = ['None','RNP 1.0','RNP 0.3','RNP AR 0.3','RNP AR 0.1'];
const ETOPS_STEPS = [0, 60, 90, 120, 138, 180, 207, 240, 330, 370];

const STEPS = [
  { id: 1, label: 'Fleet',       icon: Plane },
  { id: 2, label: 'Type',        icon: Settings },
  { id: 3, label: 'Identity',    icon: FileText },
  { id: 4, label: 'Capabilities',icon: Shield },
  { id: 5, label: 'Config',      icon: Settings },
  { id: 6, label: 'Review',      icon: Eye },
];

function getPreset(acType) {
  if (!acType) return null;
  for (const [key, val] of Object.entries(TYPE_PRESETS)) {
    if (acType.includes(key)) return val;
  }
  return null;
}

const inputCls = "w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";
const labelCls = "text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5";

function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export default function AddAircraftWizard({ onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [useDefaultProfile, setUseDefaultProfile] = useState(true);

  const { data: fleets = [] } = useQuery({
    queryKey: ['wizard-fleets'],
    queryFn: () => base44.entities.Fleet.list('name', 100),
  });

  const [form, setForm] = useState({
    // Step 1
    fleet_id: '',
    airline: '',
    // Step 2
    aircraft_type: '',
    // Step 3
    tail_number: '',
    msn: '',
    line_number: '',
    delivery_date: '',
    status: 'active',
    // Step 4
    etops_approval: 0,
    cat_approval: 'CAT I',
    rvsm_approved: true,
    rnp_capability: 'RNP 0.3',
    polar_approved: false,
    // Step 5
    cabin_config_ref: '',
    mtow_variant: '',
    engine_type: '',
    engine_variant: '',
    base_station: '',
    notes: '',
    performance_profile: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const applyTypePreset = (acType) => {
    const preset = getPreset(acType);
    if (preset && useDefaultProfile) {
      setForm(p => ({
        ...p,
        aircraft_type: acType,
        etops_approval: preset.max_etops,
        cat_approval: preset.max_cat,
        rvsm_approved: preset.rvsm,
        rnp_capability: preset.rnp,
        polar_approved: preset.polar,
        performance_profile: preset.perf,
      }));
    } else {
      set('aircraft_type', acType);
    }
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Aircraft.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!form.tail_number || !form.aircraft_type) return;
    mutation.mutate(form);
  };

  const preset = getPreset(form.aircraft_type);
  const maxEtops = preset?.max_etops ?? 370;
  const etopsOptions = ETOPS_STEPS.filter(e => e <= maxEtops);
  const catIndex = CAT_OPTIONS.indexOf(preset?.max_cat ?? 'CAT IIIc');
  const catOptions = catIndex >= 0 ? CAT_OPTIONS.slice(0, catIndex + 1) : CAT_OPTIONS;

  const canNext = () => {
    if (step === 1) return !!form.airline;
    if (step === 2) return !!form.aircraft_type;
    if (step === 3) return !!form.tail_number;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex justify-center p-4 overflow-y-auto pt-[96px]">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-fit">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141922]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white tracking-wide">ADD AIRCRAFT</p>
              <p className="text-xs text-gray-500">Step {step} of 6</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 py-3 bg-[#111620] border-b border-white/10 overflow-x-auto gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = s.id < step;
            const active = s.id === step;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => done && setStep(s.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                    active ? 'bg-primary text-primary-foreground' :
                    done  ? 'bg-green-900/40 text-green-400 cursor-pointer hover:bg-green-900/60' :
                    'text-gray-600'
                  )}
                >
                  {done ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <span className="text-gray-700 text-xs">›</span>}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">

          {/* ── Step 1: Fleet ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Select the operator fleet this aircraft will belong to.</p>
              <Field label="Fleet / Operator *">
                <input
                  list="fleet-options"
                  value={form.airline}
                  onChange={e => {
                    set('airline', e.target.value);
                    const fleet = fleets.find(f => f.name === e.target.value);
                    if (fleet) set('fleet_id', fleet.id);
                    else set('fleet_id', '');
                  }}
                  placeholder="Type or select a fleet…"
                  className={inputCls}
                />
                <datalist id="fleet-options">
                  {fleets.map(f => (
                    <option key={f.id} value={f.name}>{f.name} ({f.icao_code})</option>
                  ))}
                </datalist>
              </Field>
              {fleets.length === 0 && (
                <div className="rounded-xl bg-amber-900/20 border border-amber-500/30 px-4 py-3 text-xs text-amber-300">
                  No fleets found. Create a fleet in Fleet Registry first, then return here.
                </div>
              )}
              {form.fleet_id && (
                <div className="rounded-xl bg-green-900/20 border border-green-500/30 px-4 py-2 text-xs text-green-400 font-bold">
                  ✓ Fleet: {form.airline}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Aircraft Type ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Select aircraft type. Capability defaults will be auto-filled from the type profile.</p>
              <Field label="Aircraft Type *">
                <input
                  list="type-options"
                  value={form.aircraft_type}
                  onChange={e => applyTypePreset(e.target.value)}
                  placeholder="Type or select aircraft type…"
                  className={inputCls}
                />
                <datalist id="type-options">
                  {AIRCRAFT_TYPES.map(t => <option key={t} value={t} />)}
                </datalist>
              </Field>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setUseDefaultProfile(v => !v)}
                  className={cn('w-10 h-5 rounded-full transition-all flex items-center px-0.5', useDefaultProfile ? 'bg-primary' : 'bg-white/10')}>
                  <div className={cn('w-4 h-4 rounded-full bg-white transition-all', useDefaultProfile ? 'translate-x-5' : 'translate-x-0')} />
                </div>
                <span className="text-xs text-gray-300">Use default capability profile for this type</span>
              </label>

              {form.aircraft_type && preset && (
                <div className="rounded-xl bg-blue-900/20 border border-blue-500/30 px-4 py-3 space-y-2">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Type Defaults Applied</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Max ETOPS:</span> <span className="text-white font-bold">{preset.max_etops > 0 ? `ETOPS-${preset.max_etops}` : 'NON-ETOPS'}</span></div>
                    <div><span className="text-gray-500">Max CAT:</span> <span className="text-white font-bold">{preset.max_cat}</span></div>
                    <div><span className="text-gray-500">RNP:</span> <span className="text-white font-bold">{preset.rnp}</span></div>
                    <div><span className="text-gray-500">Polar:</span> <span className="text-white font-bold">{preset.polar ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Identity ── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Enter the tail identity details. Registration format varies by region (N-, EC-, G-, etc.).</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registration / Tail * ">
                  <input value={form.tail_number} onChange={e => set('tail_number', e.target.value.toUpperCase())}
                    placeholder="e.g. N455GJ" className={inputCls} />
                </Field>
                <Field label="Serial Number (MSN)">
                  <input value={form.msn} onChange={e => set('msn', e.target.value)}
                    placeholder="e.g. 43421" className={inputCls} />
                </Field>
                <Field label="Line Number">
                  <input value={form.line_number} onChange={e => set('line_number', e.target.value)}
                    placeholder="e.g. 1547" className={inputCls} />
                </Field>
                <Field label="Delivery Date">
                  <input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)}
                    className={inputCls} />
                </Field>
                <Field label="Home Base (ICAO)">
                  <input value={form.base_station} onChange={e => set('base_station', e.target.value.toUpperCase())}
                    placeholder="e.g. KEWR" className={inputCls} />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="oos">Out of Service</option>
                    <option value="retired">Retired</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 4: Capabilities ── */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Set tail-specific approvals. Values are constrained by aircraft type maximums.</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="ETOPS Approval (minutes)">
                  <select value={form.etops_approval} onChange={e => set('etops_approval', Number(e.target.value))} className={inputCls}>
                    {etopsOptions.map(e => (
                      <option key={e} value={e}>{e === 0 ? 'NON-ETOPS' : `ETOPS-${e}`}</option>
                    ))}
                  </select>
                </Field>
                <Field label="CAT Approval">
                  <select value={form.cat_approval} onChange={e => set('cat_approval', e.target.value)} className={inputCls}>
                    {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="RNP Capability">
                  <select value={form.rnp_capability} onChange={e => set('rnp_capability', e.target.value)} className={inputCls}>
                    {RNP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { key: 'rvsm_approved',  label: 'RVSM Approved',         desc: 'Reduced Vertical Separation Minima' },
                  { key: 'polar_approved', label: 'Polar Ops Approved',     desc: `${preset?.polar ? 'Type-eligible' : 'Not standard for this type'} — requires specific Ops Specs` },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer bg-[#141922] border border-white/10 rounded-xl px-4 py-3">
                    <div onClick={() => set(key, !form[key])}
                      className={cn('w-10 h-5 rounded-full transition-all flex items-center px-0.5 flex-shrink-0', form[key] ? 'bg-primary' : 'bg-white/10')}>
                      <div className={cn('w-4 h-4 rounded-full bg-white transition-all', form[key] ? 'translate-x-5' : 'translate-x-0')} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-[10px] text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: Config & Documents ── */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Optional configuration details. These help with W&B, dispatch, and maintenance workflows.</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cabin Config">
                  <input value={form.cabin_config_ref} onChange={e => set('cabin_config_ref', e.target.value)}
                    placeholder="e.g. 28J/324Y" className={inputCls} />
                </Field>
                <Field label="MTOW Variant">
                  <input value={form.mtow_variant} onChange={e => set('mtow_variant', e.target.value)}
                    placeholder="e.g. 79.0t / HGW" className={inputCls} />
                </Field>
                <Field label="Engine Type">
                  <input value={form.engine_type} onChange={e => set('engine_type', e.target.value)}
                    placeholder="e.g. GE90-115B" className={inputCls} />
                </Field>
                <Field label="Engine Variant">
                  <input value={form.engine_variant} onChange={e => set('engine_variant', e.target.value)}
                    placeholder="e.g. -B1 / thrust derate" className={inputCls} />
                </Field>
              </div>
              <Field label="Notes">
                <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Additional operational notes…"
                  className={inputCls + ' resize-none'} />
              </Field>
            </div>
          )}

          {/* ── Step 6: Review ── */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Review all details before committing the aircraft to the registry.</p>
              <div className="rounded-xl bg-[#141922] border border-white/10 divide-y divide-white/10">
                {[
                  { label: 'Fleet / Operator', value: form.airline || '—' },
                  { label: 'Type', value: form.aircraft_type || '—' },
                  { label: 'Registration', value: form.tail_number || '—' },
                  { label: 'MSN', value: form.msn || '—' },
                  { label: 'Home Base', value: form.base_station || '—' },
                  { label: 'Status', value: form.status },
                  { label: 'ETOPS', value: form.etops_approval > 0 ? `ETOPS-${form.etops_approval}` : 'NON-ETOPS' },
                  { label: 'CAT Approval', value: form.cat_approval },
                  { label: 'RNP', value: form.rnp_capability },
                  { label: 'RVSM', value: form.rvsm_approved ? 'Approved' : 'Not Approved' },
                  { label: 'Polar', value: form.polar_approved ? 'Approved' : 'Not Approved' },
                  { label: 'Cabin Config', value: form.cabin_config_ref || '—' },
                  { label: 'MTOW Variant', value: form.mtow_variant || '—' },
                  { label: 'Engines', value: [form.engine_type, form.engine_variant].filter(Boolean).join(' / ') || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">{label}</span>
                    <span className="text-xs text-white font-bold text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-blue-900/20 border border-blue-500/30 px-4 py-3 text-xs text-blue-300">
                On confirm: Aircraft will be created, linked to fleet, and capability approvals stored for MEL/ETOPS/Dispatch resolution.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0d1117] flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex gap-1">
            {STEPS.map(s => (
              <span key={s.id} className={cn('w-2 h-2 rounded-full transition-all', s.id <= step ? 'bg-primary' : 'bg-gray-700')} />
            ))}
          </div>

          {step < 6 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending || !form.tail_number || !form.aircraft_type}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-40 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {mutation.isPending ? 'Adding…' : 'Add Aircraft'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}