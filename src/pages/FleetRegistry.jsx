import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Layers, Plus, ChevronLeft, Plane, Globe, Edit3, Trash2, X, Send, CheckCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import AircraftImportModal from '@/components/fleet/AircraftImportModal';

const FLEET_COLORS = [
  '#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#84cc16','#6366f1',
  '#14b8a6','#f43f5e','#a3e635','#fb923c','#c084fc',
];

const FLEET_TYPES = ['mainline','regional','cargo','charter','private','wet_lease'];

const inputCls = "w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-sky-500 transition-colors";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function FleetModal({ fleet, onClose, onSave }) {
  const [form, setForm] = useState(fleet || {
    name: '', icao_code: '', iata_code: '', callsign: '',
    hub_station: '', fleet_type: 'mainline', color: '#3b82f6',
    notes: '', status: 'active',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-widest">
            {fleet?.id ? 'Edit Fleet' : 'Add New Fleet'}
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <Field label="Fleet / Airline Name *">
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Aerodyne Express" className={inputCls} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="ICAO Code *">
              <input value={form.icao_code} onChange={e => set('icao_code', e.target.value.toUpperCase())} placeholder="AEX" className={inputCls} maxLength={4} />
            </Field>
            <Field label="IATA Code">
              <input value={form.iata_code || ''} onChange={e => set('iata_code', e.target.value.toUpperCase())} placeholder="AX" className={inputCls} maxLength={2} />
            </Field>
            <Field label="Callsign">
              <input value={form.callsign || ''} onChange={e => set('callsign', e.target.value.toUpperCase())} placeholder="AERODYNE" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hub Station (ICAO)">
              <input value={form.hub_station || ''} onChange={e => set('hub_station', e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
            </Field>
            <Field label="Fleet Type">
              <select value={form.fleet_type} onChange={e => set('fleet_type', e.target.value)} className={inputCls}>
                {FLEET_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Brand Color">
            <div className="flex gap-2 flex-wrap">
              {FLEET_COLORS.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => set('color', col)}
                  className="w-7 h-7 rounded-full border-2 transition-all flex-shrink-0"
                  style={{
                    background: col,
                    borderColor: form.color === col ? 'white' : 'transparent',
                    transform: form.color === col ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color || '#3b82f6'}
                onChange={e => set('color', e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </Field>
          <Field label="Status">
            <select value={form.status || 'active'} onChange={e => set('status', e.target.value)} className={inputCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </Field>
          <Field label="Notes">
            <textarea rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." className={inputCls + " resize-none"} />
          </Field>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button
              disabled={!form.name || !form.icao_code}
              onClick={() => onSave(form)}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              style={{ background: form.color || '#3b82f6' }}
            >
              <Send className="w-4 h-4" /> Save Fleet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FleetCard({ fleet, aircraft, onEdit, onDelete }) {
  const col = fleet.color || '#3b82f6';
  const fleetAircraft = aircraft.filter(a => a.fleet_id === fleet.id || a.airline === fleet.name);
  const activeCount = fleetAircraft.filter(a => a.status === 'active').length;
  const oosCount = fleetAircraft.filter(a => a.status === 'oos' || a.status === 'maintenance').length;
  const visibleTails = fleetAircraft.slice(0, 8);
  const extraCount = fleetAircraft.length - visibleTails.length;

  return (
    <div
      className="bg-[#12161f] rounded-2xl overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-xl"
      style={{ border: `1.5px solid ${col}55`, boxShadow: `0 0 0 0px ${col}00` }}
    >
      {/* Colored top border accent */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${col}, ${col}88)` }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            {/* ICAO badge */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm tracking-wider flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${col}55, ${col}22)`, border: `1.5px solid ${col}70` }}
            >
              {fleet.icao_code?.slice(0,3) || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-white text-[15px] leading-tight truncate">{fleet.name}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{fleet.fleet_type?.replace('_',' ')} · {fleet.callsign || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(fleet)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(fleet.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats row — matches image style */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-3xl font-black leading-none" style={{ color: col }}>{fleetAircraft.length}</p>
            <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mt-1">Aircraft</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black leading-none text-green-400">{activeCount}</p>
            <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mt-1">Active</p>
          </div>
          <div className="text-center">
            <p className={cn('text-3xl font-black leading-none', oosCount > 0 ? 'text-red-400' : 'text-gray-600')}>{oosCount}</p>
            <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mt-1">OOS</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/6 mb-3" />

        {/* Hub + status row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[12px] text-gray-400">
            <Globe className="w-3.5 h-3.5" style={{ color: col }} />
            <span>Hub: <span className="text-white font-bold">{fleet.hub_station || '—'}</span></span>
          </div>
          <span className={cn(
            'text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider',
            fleet.status === 'active'    ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            fleet.status === 'suspended' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                           'bg-gray-500/15 text-gray-400 border border-gray-500/20'
          )}>
            {fleet.status || 'ACTIVE'}
          </span>
        </div>

        {/* Tail chips */}
        {fleetAircraft.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTails.map(a => (
              <span
                key={a.id}
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md"
                style={{ color: col, background: `${col}18`, border: `1px solid ${col}35` }}
              >
                {a.tail_number}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-[10px] text-gray-500 font-bold px-1.5 py-0.5">+{extraCount} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FleetRegistry() {
  const [showModal, setShowModal] = useState(false);
  const [showAircraftModal, setShowAircraftModal] = useState(false);
  const [editFleet, setEditFleet] = useState(null);
  const queryClient = useQueryClient();

  const { data: fleets = [], isLoading } = useQuery({
    queryKey: ['fleets-global'],
    queryFn: () => base44.entities.Fleet.list('name', 100),
  });

  const { data: rawAircraft = [] } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 1000),
    staleTime: 60000,
  });

  const aircraft = Object.values(
    rawAircraft.reduce((acc, a) => {
      if (!acc[a.tail_number] || new Date(a.updated_date) > new Date(acc[a.tail_number].updated_date)) {
        acc[a.tail_number] = a;
      }
      return acc;
    }, {})
  );

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.Fleet.update(data.id, data)
      : base44.entities.Fleet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleets-global'] });
      setShowModal(false);
      setEditFleet(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Fleet.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fleets-global'] }),
  });

  const handleEdit = (fleet) => { setEditFleet(fleet); setShowModal(true); };
  const handleNew  = () => { setEditFleet(null); setShowModal(true); };

  const totalAircraft = aircraft.length;
  const linkedAircraft = aircraft.filter(a => a.fleet_id || a.airline).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0e18] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide">Fleet Registry</p>
            <p className="text-[10px] text-sky-400 tracking-widest uppercase">Multi-Fleet Operator Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAircraftModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors"
          >
            <Upload className="w-4 h-4" /> Add Aircraft
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Fleet
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-5">
        {[
          { label: 'Total Fleets',      value: fleets.length,                                    color: 'text-sky-400',   bg: 'bg-sky-600/15' },
          { label: 'Active Fleets',     value: fleets.filter(f => f.status === 'active').length, color: 'text-green-400', bg: 'bg-green-600/15' },
          { label: 'Total Aircraft',    value: totalAircraft,                                     color: 'text-white',     bg: 'bg-white/5' },
          { label: 'Fleet-Linked AC',   value: linkedAircraft,                                    color: 'text-amber-400', bg: 'bg-amber-600/15' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-2xl border border-white/10 p-4', bg)}>
            <p className={cn('text-3xl font-extrabold', color)}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-bold">{label}</p>
          </div>
        ))}
      </div>

      {/* Fleet grid */}
      <div className="px-5 mt-6">
        {isLoading ? (
          <div className="text-center text-gray-500 py-16">Loading fleets…</div>
        ) : fleets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Layers className="w-16 h-16 text-sky-500/30" />
            <p className="text-xl font-extrabold text-gray-400">No Fleets Configured</p>
            <p className="text-gray-600 text-sm text-center max-w-xs">
              Create your first fleet to enable multi-fleet operations filtering across the entire platform.
            </p>
            <button onClick={handleNew} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors mt-2">
              <Plus className="w-4 h-4" /> Create First Fleet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fleets.map(fleet => (
              <FleetCard
                key={fleet.id}
                fleet={fleet}
                aircraft={aircraft}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <FleetModal
          fleet={editFleet}
          onClose={() => { setShowModal(false); setEditFleet(null); }}
          onSave={(data) => saveMutation.mutate(data)}
        />
      )}

      {showAircraftModal && (
        <AircraftImportModal
          fleets={fleets}
          onClose={() => setShowAircraftModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
          }}
        />
      )}
    </div>
  );
}