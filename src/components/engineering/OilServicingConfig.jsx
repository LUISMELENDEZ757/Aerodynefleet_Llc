import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, ChevronRight, Droplets, Cpu, Plane, Save, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', step }) {
  return (
    <input
      type={type}
      step={step}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0d1423] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0d1423] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Powerplant Type CRUD ────────────────────────────────────────────────────

function PowerplantTypePanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null); // null = hidden, {} = new, {id,...} = edit

  const { data: types = [] } = useQuery({
    queryKey: ['powerplant-types'],
    queryFn: () => base44.entities.PowerplantType.list('name'),
  });

  const save = useMutation({
    mutationFn: (d) => d.id
      ? base44.entities.PowerplantType.update(d.id, d)
      : base44.entities.PowerplantType.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['powerplant-types'] }); setForm(null); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.PowerplantType.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['powerplant-types'] }),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const engines = types.filter(t => t.component_type === 'ENGINE');
  const apus    = types.filter(t => t.component_type === 'APU');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-extrabold text-white">Powerplant Models</p>
          <p className="text-xs text-gray-500 mt-0.5">Engine and APU type registry</p>
        </div>
        <button
          onClick={() => setForm({ component_type: 'ENGINE' })}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Model
        </button>
      </div>

      {/* Inline form */}
      {form !== null && (
        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-extrabold text-emerald-400">{form.id ? 'Edit Model' : 'New Powerplant Model'}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Model Name *">
              <Input value={form.name} onChange={v => set('name', v)} placeholder="e.g. CFM56-7B27" />
            </Field>
            <Field label="OEM *">
              <Input value={form.oem} onChange={v => set('oem', v)} placeholder="e.g. CFM International" />
            </Field>
            <Field label="Type *">
              <Select value={form.component_type} onChange={v => set('component_type', v)}
                options={[{ value: 'ENGINE', label: 'Engine' }, { value: 'APU', label: 'APU' }]} />
            </Field>
            <Field label="Notes">
              <Input value={form.notes} onChange={v => set('notes', v)} placeholder="Optional notes" />
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save.mutate(form)} disabled={!form.name || !form.oem}
              className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-500 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button onClick={() => setForm(null)} className="flex items-center gap-2 border border-white/10 text-gray-400 text-xs font-bold px-4 py-2 rounded-xl hover:bg-white/5">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Engine list */}
      {[{ label: 'Engines', items: engines, icon: Cpu }, { label: 'APUs', items: apus, icon: Zap }].map(({ label, items, icon: Icon }) => (
        <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">{label}</p>
            <span className="text-xs text-gray-600 ml-auto">{items.length} models</span>
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-6">No {label.toLowerCase()} added yet</p>
          ) : items.map(t => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5">
              <div>
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-xs text-gray-500">{t.oem}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm(t)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15">
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button onClick={() => del.mutate(t.id)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Oil Servicing Profiles ───────────────────────────────────────────────────

function OilProfilesPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data: types = [] } = useQuery({
    queryKey: ['powerplant-types'],
    queryFn: () => base44.entities.PowerplantType.list('name'),
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ['oil-profiles'],
    queryFn: () => base44.entities.OilServicingProfile.list(),
  });

  const save = useMutation({
    mutationFn: (d) => {
      const payload = { ...d, capacity_value: +d.capacity_value, min_service_level: +d.min_service_level, max_service_level: +d.max_service_level, max_single_addition: d.max_single_addition ? +d.max_single_addition : undefined, max_consumption_rate_value: d.max_consumption_rate_value ? +d.max_consumption_rate_value : undefined };
      return d.id ? base44.entities.OilServicingProfile.update(d.id, payload) : base44.entities.OilServicingProfile.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['oil-profiles'] }); setForm(null); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.OilServicingProfile.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oil-profiles'] }),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const typeOptions = types.map(t => ({ value: t.id, label: `${t.name} (${t.component_type})` }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-extrabold text-white">Oil Servicing Profiles</p>
          <p className="text-xs text-gray-500 mt-0.5">Capacity, limits, and consumption rates per powerplant model</p>
        </div>
        <button onClick={() => setForm({ component_type: 'ENGINE', capacity_unit: 'QUARTS', max_consumption_rate_unit: 'QT_PER_HR' })}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Profile
        </button>
      </div>

      {form !== null && (
        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-extrabold text-emerald-400">{form.id ? 'Edit Profile' : 'New Oil Servicing Profile'}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Powerplant Model *">
              <Select value={form.powerplant_type_id} onChange={v => {
                const t = types.find(x => x.id === v);
                set('powerplant_type_id', v);
                set('powerplant_name', t?.name || '');
                set('component_type', t?.component_type || 'ENGINE');
              }} options={typeOptions} />
            </Field>
            <Field label="Component Type">
              <Select value={form.component_type} onChange={v => set('component_type', v)}
                options={[{ value: 'ENGINE', label: 'Engine' }, { value: 'APU', label: 'APU' }]} />
            </Field>
            <Field label="Capacity *">
              <Input type="number" step="0.1" value={form.capacity_value} onChange={v => set('capacity_value', v)} placeholder="e.g. 12" />
            </Field>
            <Field label="Unit">
              <Select value={form.capacity_unit} onChange={v => set('capacity_unit', v)}
                options={[{ value: 'QUARTS', label: 'Quarts (qt)' }, { value: 'LITERS', label: 'Liters (L)' }]} />
            </Field>
            <Field label="Min Service Level *">
              <Input type="number" step="0.1" value={form.min_service_level} onChange={v => set('min_service_level', v)} placeholder="e.g. 8" />
            </Field>
            <Field label="Max Service Level *">
              <Input type="number" step="0.1" value={form.max_service_level} onChange={v => set('max_service_level', v)} placeholder="e.g. 12" />
            </Field>
            <Field label="Max Single Addition (qt)">
              <Input type="number" step="0.1" value={form.max_single_addition} onChange={v => set('max_single_addition', v)} placeholder="e.g. 2.5" />
            </Field>
            <Field label="Max Consumption Rate">
              <Input type="number" step="0.01" value={form.max_consumption_rate_value} onChange={v => set('max_consumption_rate_value', v)} placeholder="e.g. 0.8" />
            </Field>
            <Field label="Consumption Unit">
              <Select value={form.max_consumption_rate_unit} onChange={v => set('max_consumption_rate_unit', v)}
                options={[{ value: 'QT_PER_HR', label: 'qt/hr' }, { value: 'L_PER_HR', label: 'L/hr' }]} />
            </Field>
            <Field label="AMM Reference">
              <Input value={form.amm_reference} onChange={v => set('amm_reference', v)} placeholder="e.g. 79-00-00" />
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save.mutate(form)} disabled={!form.powerplant_type_id || !form.capacity_value}
              className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-500 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> Save Profile
            </button>
            <button onClick={() => setForm(null)} className="flex items-center gap-2 border border-white/10 text-gray-400 text-xs font-bold px-4 py-2 rounded-xl hover:bg-white/5">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">All Profiles ({profiles.length})</p>
        </div>
        {profiles.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">No profiles configured yet</p>
        ) : profiles.map(p => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5">
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', p.component_type === 'ENGINE' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400')}>
                  {p.component_type}
                </span>
                <p className="text-sm font-bold text-white">{p.powerplant_name}</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Capacity: {p.capacity_value} {p.capacity_unit} · Min: {p.min_service_level} · Max: {p.max_service_level}
                {p.max_consumption_rate_value ? ` · Max consumption: ${p.max_consumption_rate_value} ${p.max_consumption_rate_unit}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm(p)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15">
                <Pencil className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button onClick={() => del.mutate(p.id)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aircraft Config ──────────────────────────────────────────────────────────

function AircraftConfigPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['eng-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });
  const { data: types = [] } = useQuery({
    queryKey: ['powerplant-types'],
    queryFn: () => base44.entities.PowerplantType.list('name'),
  });
  const { data: configs = [] } = useQuery({
    queryKey: ['aircraft-pl-configs'],
    queryFn: () => base44.entities.AircraftPowerplantConfig.list(),
  });

  const save = useMutation({
    mutationFn: (d) => {
      const payload = { ...d, engine_count: d.engine_count ? +d.engine_count : 2 };
      ['override_engine_min','override_engine_max','override_apu_min','override_apu_max','override_max_consumption'].forEach(k => {
        if (payload[k] !== '' && payload[k] !== undefined) payload[k] = +payload[k];
        else delete payload[k];
      });
      return d.id ? base44.entities.AircraftPowerplantConfig.update(d.id, payload) : base44.entities.AircraftPowerplantConfig.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['aircraft-pl-configs'] }); setForm(null); },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.AircraftPowerplantConfig.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aircraft-pl-configs'] }),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const engines = types.filter(t => t.component_type === 'ENGINE');
  const apus    = types.filter(t => t.component_type === 'APU');

  const configuredTails = new Set(configs.map(c => c.aircraft_tail));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-extrabold text-white">Aircraft Powerplant Assignments</p>
          <p className="text-xs text-gray-500 mt-0.5">Link each tail to its engine and APU types with optional limit overrides</p>
        </div>
        <button onClick={() => setForm({ engine_count: 2 })}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> Assign Config
        </button>
      </div>

      {form !== null && (
        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-extrabold text-emerald-400">{form.id ? 'Edit Config' : 'Assign Powerplant Config'}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Aircraft Tail *">
              <Select value={form.aircraft_tail} onChange={v => {
                const ac = aircraft.find(a => a.tail_number === v);
                set('aircraft_tail', v);
                set('aircraft_type', ac?.aircraft_type || '');
              }} options={aircraft.map(a => ({ value: a.tail_number, label: `${a.tail_number} — ${a.aircraft_type}` }))} />
            </Field>
            <Field label="Engine Count">
              <Select value={form.engine_count} onChange={v => set('engine_count', v)}
                options={[1,2,3,4].map(n => ({ value: n, label: `${n} Engine${n>1?'s':''}` }))} />
            </Field>
            <Field label="Engine Type">
              <Select value={form.engine_type_id} onChange={v => {
                const t = engines.find(e => e.id === v);
                set('engine_type_id', v);
                set('engine_type_name', t?.name || '');
              }} options={engines.map(e => ({ value: e.id, label: e.name }))} />
            </Field>
            <Field label="APU Type">
              <Select value={form.apu_type_id} onChange={v => {
                const t = apus.find(a => a.id === v);
                set('apu_type_id', v);
                set('apu_type_name', t?.name || '');
              }} options={apus.map(a => ({ value: a.id, label: a.name }))} />
            </Field>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Per-Tail Overrides (optional — leave blank to use profile defaults)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Engine Min Override"><Input type="number" step="0.1" value={form.override_engine_min} onChange={v => set('override_engine_min', v)} placeholder="—" /></Field>
              <Field label="Engine Max Override"><Input type="number" step="0.1" value={form.override_engine_max} onChange={v => set('override_engine_max', v)} placeholder="—" /></Field>
              <Field label="Max Consumption Override"><Input type="number" step="0.01" value={form.override_max_consumption} onChange={v => set('override_max_consumption', v)} placeholder="—" /></Field>
              <Field label="APU Min Override"><Input type="number" step="0.1" value={form.override_apu_min} onChange={v => set('override_apu_min', v)} placeholder="—" /></Field>
              <Field label="APU Max Override"><Input type="number" step="0.1" value={form.override_apu_max} onChange={v => set('override_apu_max', v)} placeholder="—" /></Field>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => save.mutate(form)} disabled={!form.aircraft_tail}
              className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-500 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> Save Config
            </button>
            <button onClick={() => setForm(null)} className="flex items-center gap-2 border border-white/10 text-gray-400 text-xs font-bold px-4 py-2 rounded-xl hover:bg-white/5">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Unconfigured warning */}
      {aircraft.filter(a => !configuredTails.has(a.tail_number)).length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-400">Unconfigured tails</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {aircraft.filter(a => !configuredTails.has(a.tail_number)).map(a => a.tail_number).join(', ')} — no oil profile will resolve for these aircraft.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Configured Aircraft ({configs.length})</p>
        </div>
        {configs.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">No aircraft configured yet</p>
        ) : configs.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5">
            <div className="flex items-center gap-3">
              <Plane className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-white">{c.aircraft_tail}</p>
                <p className="text-xs text-gray-500">
                  {c.engine_type_name ? `Engine: ${c.engine_type_name}` : 'No engine assigned'}
                  {c.apu_type_name ? ` · APU: ${c.apu_type_name}` : ''}
                  {(c.override_engine_min || c.override_engine_max) ? ' · ⚠ Overrides active' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm(c)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15">
                <Pencil className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button onClick={() => del.mutate(c.id)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Tabbed Config Component ────────────────────────────────────────────

const CONFIG_TABS = [
  { id: 'models',   label: 'Powerplant Models', icon: Cpu },
  { id: 'profiles', label: 'Oil Profiles',       icon: Droplets },
  { id: 'aircraft', label: 'Aircraft Configs',   icon: Plane },
];

export default function OilServicingConfig() {
  const [tab, setTab] = useState('models');

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {CONFIG_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all',
              tab === id
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[#141922] border-white/10 text-gray-400 hover:text-white'
            )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'models'   && <PowerplantTypePanel />}
      {tab === 'profiles' && <OilProfilesPanel />}
      {tab === 'aircraft' && <AircraftConfigPanel />}
    </div>
  );
}