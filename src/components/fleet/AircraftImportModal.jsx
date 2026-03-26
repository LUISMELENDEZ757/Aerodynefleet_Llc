import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Upload, Plus, Send, AlertTriangle, CheckCircle, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputCls = "w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-sky-500 transition-colors";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const AC_TYPES = [
  'B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9',
  'B757','B767','B777','B787',
  'A320','A321','A350',
  'E190','E175','CRJ700','CRJ900',
];

const ENGINE_MAP = {
  'B737-700': 'CFM56-7B22','B737-800': 'CFM56-7B27','B737-900': 'CFM56-7B27E',
  'B737 MAX 8': 'LEAP-1B27','B737 MAX 9': 'LEAP-1B28',
  'B757': 'RB211-535','B767': 'CF6-80C2','B777': 'GE90-115B','B787': 'GEnx-1B',
  'A320': 'CFM56-5B','A321': 'CFM56-5B','A350': 'Trent XWB','E190': 'CF34-10E',
  'E175': 'CF34-8E','CRJ700': 'CF34-8C','CRJ900': 'CF34-8C5',
};

const PERF_MAP = {
  'B737-700': 'B737_profile','B737-800': 'B737_profile','B737-900': 'B737_profile',
  'B737 MAX 8': 'B737_profile','B737 MAX 9': 'B737_profile',
  'B757': 'B757_profile','B767': 'B767_profile','B777': 'B777_profile','B787': 'B787_profile',
  'A320': 'A320_profile','A321': 'A320_profile','A350': 'A350_profile',
  'E190': 'E190_profile','E175': 'E190_profile',
  'CRJ700': 'CRJ700_profile','CRJ900': 'CRJ700_profile',
};

// ── Single aircraft add form ──────────────────────────────────────────────
function SingleAddForm({ fleets, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tail_number: '', aircraft_type: 'B737-800', msn: '',
    engine_type: ENGINE_MAP['B737-800'], base_station: '',
    status: 'active', fleet_id: '', airline: '', notes: '',
  });
  const set = (k, v) => setForm(p => {
    const next = { ...p, [k]: v };
    if (k === 'aircraft_type') {
      next.engine_type = ENGINE_MAP[v] || '';
      next.performance_profile = PERF_MAP[v] || '';
    }
    if (k === 'fleet_id') {
      const fleet = fleets.find(f => f.id === v);
      if (fleet) next.airline = fleet.name;
    }
    return next;
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Aircraft.create(data),
    onSuccess: () => { onSuccess(); onClose(); },
  });

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tail Number *">
          <input value={form.tail_number} onChange={e => set('tail_number', e.target.value.toUpperCase())}
            placeholder="N455GJ" className={inputCls} />
        </Field>
        <Field label="Aircraft Type *">
          <select value={form.aircraft_type} onChange={e => set('aircraft_type', e.target.value)} className={inputCls}>
            {AC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="MSN">
          <input value={form.msn} onChange={e => set('msn', e.target.value)} placeholder="MSN 40001" className={inputCls} />
        </Field>
        <Field label="Base Station (ICAO)">
          <input value={form.base_station} onChange={e => set('base_station', e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Engine Type">
          <input value={form.engine_type} onChange={e => set('engine_type', e.target.value)} placeholder="CFM56-7B27" className={inputCls} />
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assign to Fleet">
          <select value={form.fleet_id} onChange={e => set('fleet_id', e.target.value)} className={inputCls}>
            <option value="">— No Fleet —</option>
            {fleets.map(f => <option key={f.id} value={f.id}>{f.name} ({f.icao_code})</option>)}
          </select>
        </Field>
        <Field label="Operator / Airline">
          <input value={form.airline} onChange={e => set('airline', e.target.value)} placeholder="Auto-filled from fleet" className={inputCls} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." className={inputCls + " resize-none"} />
      </Field>
      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
        <button
          disabled={mutation.isPending || !form.tail_number || !form.aircraft_type}
          onClick={() => mutation.mutate(form)}
          className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Add Aircraft
        </button>
      </div>
    </div>
  );
}

// ── Bulk CSV paste form ────────────────────────────────────────────────────
function BulkAddForm({ fleets, onClose, onSuccess }) {
  const [csv, setCsv] = useState('');
  const [fleetId, setFleetId] = useState('');
  const [airline, setAirline] = useState('');
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState(null); // null | 'importing' | 'done' | 'error'
  const [importedCount, setImportedCount] = useState(0);
  const queryClient = useQueryClient();

  const parseCSV = () => {
    const lines = csv.trim().split('\n').filter(Boolean);
    const parsed = lines.map(line => {
      const parts = line.split(',').map(s => s.trim());
      const tail = parts[0];
      const acType = parts[1] || 'B737-800';
      const base = parts[2] || '';
      const msn = parts[3] || '';
      return {
        tail_number: tail.toUpperCase(),
        aircraft_type: acType,
        base_station: base.toUpperCase(),
        msn,
        engine_type: ENGINE_MAP[acType] || '',
        performance_profile: PERF_MAP[acType] || '',
        status: 'active',
        fleet_id: fleetId || undefined,
        airline: airline || fleets.find(f => f.id === fleetId)?.name || '',
      };
    }).filter(r => r.tail_number);
    setPreview(parsed);
  };

  const handleFleetChange = (id) => {
    setFleetId(id);
    const fleet = fleets.find(f => f.id === id);
    if (fleet) setAirline(fleet.name);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setStatus('importing');
    setImportedCount(0);
    // batch in groups of 50
    const BATCH = 50;
    let total = 0;
    for (let i = 0; i < preview.length; i += BATCH) {
      const batch = preview.slice(i, i + BATCH);
      await base44.entities.Aircraft.bulkCreate(batch);
      total += batch.length;
      setImportedCount(total);
    }
    setStatus('done');
    queryClient.invalidateQueries({ queryKey: ['registry-aircraft'] });
    queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="bg-sky-900/20 border border-sky-500/30 rounded-xl px-4 py-3 text-xs text-sky-300">
        <p className="font-bold mb-1">CSV Format (one per line):</p>
        <p className="font-mono text-sky-400">TAIL, TYPE, BASE_ICAO, MSN</p>
        <p className="text-sky-500 mt-1">e.g. <span className="font-mono">N455GJ, B737-800, KEWR, MSN40001</span></p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Assign to Fleet">
          <select value={fleetId} onChange={e => handleFleetChange(e.target.value)} className={inputCls}>
            <option value="">— No Fleet —</option>
            {fleets.map(f => <option key={f.id} value={f.id}>{f.name} ({f.icao_code})</option>)}
          </select>
        </Field>
        <Field label="Operator Name">
          <input value={airline} onChange={e => setAirline(e.target.value)} placeholder="Auto-filled from fleet" className={inputCls} />
        </Field>
      </div>

      <Field label="Paste CSV Data">
        <textarea
          rows={8}
          value={csv}
          onChange={e => { setCsv(e.target.value); setPreview([]); }}
          placeholder={"N100AB, B737-800, KEWR, MSN40001\nN101CD, B737 MAX 8, KLAX, MSN40002\n..."}
          className={inputCls + " resize-none font-mono text-xs"}
        />
      </Field>

      {preview.length === 0 && (
        <button onClick={parseCSV} disabled={!csv.trim()}
          className="w-full py-2.5 rounded-xl border border-sky-500/40 text-sky-400 text-sm font-bold hover:bg-sky-500/10 disabled:opacity-40 transition-colors">
          Preview ({csv.trim().split('\n').filter(Boolean).length} rows)
        </button>
      )}

      {preview.length > 0 && status === null && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-bold">{preview.length} aircraft ready to import:</p>
          <div className="bg-[#0d1117] rounded-xl max-h-36 overflow-y-auto p-3 space-y-1">
            {preview.slice(0, 20).map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono">
                <span className="text-sky-400 w-20">{r.tail_number}</span>
                <span className="text-gray-400">{r.aircraft_type}</span>
                <span className="text-gray-500">{r.base_station}</span>
              </div>
            ))}
            {preview.length > 20 && <p className="text-gray-600 text-xs">…and {preview.length - 20} more</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPreview([])} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Back</button>
            <button onClick={handleImport} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
              <Upload className="w-4 h-4" /> Import {preview.length} Aircraft
            </button>
          </div>
        </div>
      )}

      {status === 'importing' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
          <p className="text-sky-400 font-bold">Importing… {importedCount} / {preview.length}</p>
        </div>
      )}

      {status === 'done' && (
        <div className="flex flex-col items-center gap-2 py-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
          <p className="text-green-400 font-bold">{importedCount} aircraft imported!</p>
        </div>
      )}
    </div>
  );
}

// ── Bulk 737 Seed (backend function) ─────────────────────────────────────
function SeedFleetForm({ fleets, onClose, onSuccess }) {
  const [fleetId, setFleetId] = useState('');
  const [airline, setAirline] = useState('Aerodyne Mainline');
  const [count, setCount] = useState(1000);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(null);
  const queryClient = useQueryClient();

  const handleFleetChange = (id) => {
    setFleetId(id);
    const fleet = fleets.find(f => f.id === id);
    if (fleet) setAirline(fleet.name);
  };

  const handleSeed = async () => {
    setStatus('running');
    setTotal(count);
    setProgress(0);
    const BATCH = 200;
    for (let offset = 0; offset < count; offset += BATCH) {
      const batchCount = Math.min(BATCH, count - offset);
      await base44.functions.invoke('seedFleet737', {
        count: batchCount,
        offset,
        fleet_id: fleetId || null,
        airline,
      });
      setProgress(offset + batchCount);
    }
    setStatus('done');
    queryClient.invalidateQueries({ queryKey: ['registry-aircraft'] });
    queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-300">
        <p className="font-bold mb-1">⚡ Bulk 737 Seeder</p>
        <p>Generates Boeing 737-700/800/900/MAX 8/MAX 9 aircraft records with realistic tail numbers, MSNs, engine types, and base stations via backend function.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Assign to Fleet">
          <select value={fleetId} onChange={e => handleFleetChange(e.target.value)} className={inputCls}>
            <option value="">— No Fleet —</option>
            {fleets.map(f => <option key={f.id} value={f.id}>{f.name} ({f.icao_code})</option>)}
          </select>
        </Field>
        <Field label="Operator Name">
          <input value={airline} onChange={e => setAirline(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label={`Aircraft Count: ${count}`}>
        <input type="range" min={50} max={1000} step={50} value={count}
          onChange={e => setCount(Number(e.target.value))}
          className="w-full accent-amber-400" />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>50</span><span>500</span><span>1000</span>
        </div>
      </Field>

      {status === null && (
        <button onClick={handleSeed} disabled={!airline}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-extrabold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Seed {count} Aircraft
        </button>
      )}

      {status === 'running' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
            <span>Seeding aircraft…</span>
            <span>{progress} / {total}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400 transition-all duration-300" style={{ width: `${(progress / total) * 100}%` }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex flex-col items-center gap-2 py-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
          <p className="text-green-400 font-bold">{total} aircraft seeded successfully!</p>
        </div>
      )}
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'single', label: 'Add Single',   icon: Plus },
  { id: 'bulk',   label: 'Bulk CSV',     icon: Upload },
  { id: 'seed',   label: '737 Seeder',   icon: Download },
];

export default function AircraftImportModal({ fleets = [], onClose, onSuccess }) {
  const [tab, setTab] = useState('single');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-widest">Add Aircraft</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors',
                tab === id ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-400/5' : 'text-gray-500 hover:text-gray-300'
              )}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          {tab === 'single' && <SingleAddForm fleets={fleets} onClose={onClose} onSuccess={onSuccess} />}
          {tab === 'bulk'   && <BulkAddForm   fleets={fleets} onClose={onClose} onSuccess={onSuccess} />}
          {tab === 'seed'   && <SeedFleetForm  fleets={fleets} onClose={onClose} onSuccess={onSuccess} />}
        </div>
      </div>
    </div>
  );
}