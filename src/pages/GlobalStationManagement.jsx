import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Plus, Search, ChevronLeft, Pencil, Trash2, X,
  CheckCircle, Circle, RefreshCw, RotateCcw, BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const REGIONS = [
  'Alaska','Australia','Canada','Caribbean','Central America','Europe',
  'Mexico','Middle East','Pacific (US)','South America','South Asia',
  'Southeast Asia','USA Continental','Other / Not Specified',
];

const TIMEZONES = [
  'America/Anchorage','America/Los_Angeles','America/Denver','America/Phoenix',
  'America/Chicago','America/New_York','America/Toronto','America/Vancouver',
  'America/Mexico_City','America/Bogota','America/Sao_Paulo','America/Santo_Domingo',
  'Europe/London','Europe/Paris','Europe/Berlin','Europe/Madrid','Europe/Rome',
  'Europe/Amsterdam','Europe/Zurich','Europe/Istanbul',
  'Asia/Dubai','Asia/Riyadh','Asia/Karachi','Asia/Kolkata','Asia/Bangkok',
  'Asia/Singapore','Asia/Hong_Kong','Asia/Tokyo','Asia/Seoul',
  'Australia/Sydney','Australia/Melbourne','Australia/Perth',
  'Pacific/Auckland','Pacific/Honolulu',
  'UTC',
];

const TIMEZONE_LABELS = {
  'America/Anchorage': 'Alaska (America/Anchorage)',
  'America/Los_Angeles': 'Pacific (America/Los_Angeles)',
  'America/Denver': 'Mountain (America/Denver)',
  'America/Phoenix': 'Arizona (America/Phoenix)',
  'America/Chicago': 'Central (America/Chicago)',
  'America/New_York': 'Eastern (America/New_York)',
  'America/Toronto': 'Eastern (America/Toronto)',
  'America/Vancouver': 'Pacific (America/Vancouver)',
  'America/Mexico_City': 'Mexico City (America/Mexico_City)',
  'America/Bogota': 'Colombia (America/Bogota)',
  'America/Sao_Paulo': 'Brazil (America/Sao_Paulo)',
  'America/Santo_Domingo': 'Atlantic (America/Santo_Domingo)',
  'Europe/London': 'London (Europe/London)',
  'Europe/Paris': 'Paris (Europe/Paris)',
  'Europe/Berlin': 'Berlin (Europe/Berlin)',
  'Europe/Madrid': 'Madrid (Europe/Madrid)',
  'Europe/Rome': 'Rome (Europe/Rome)',
  'Europe/Amsterdam': 'Amsterdam (Europe/Amsterdam)',
  'Europe/Zurich': 'Zurich (Europe/Zurich)',
  'Europe/Istanbul': 'Istanbul (Europe/Istanbul)',
  'Asia/Dubai': 'Dubai (Asia/Dubai)',
  'Asia/Riyadh': 'Riyadh (Asia/Riyadh)',
  'Asia/Karachi': 'Pakistan (Asia/Karachi)',
  'Asia/Kolkata': 'India (Asia/Kolkata)',
  'Asia/Bangkok': 'Bangkok (Asia/Bangkok)',
  'Asia/Singapore': 'Singapore (Asia/Singapore)',
  'Asia/Hong_Kong': 'Hong Kong (Asia/Hong_Kong)',
  'Asia/Tokyo': 'Tokyo (Asia/Tokyo)',
  'Asia/Seoul': 'Seoul (Asia/Seoul)',
  'Australia/Sydney': 'Sydney (Australia/Sydney)',
  'Australia/Melbourne': 'Melbourne (Australia/Melbourne)',
  'Australia/Perth': 'Perth (Australia/Perth)',
  'Pacific/Auckland': 'Auckland (Pacific/Auckland)',
  'Pacific/Honolulu': 'Hawaii (Pacific/Honolulu)',
  'UTC': 'UTC',
};

const ICAO_GUIDE = [
  { prefix: 'K', desc: 'USA Continental' },
  { prefix: 'P', desc: 'Pacific (US)' },
  { prefix: 'T', desc: 'Caribbean' },
  { prefix: 'C', desc: 'Canada' },
  { prefix: 'M', desc: 'Mexico/C.America' },
  { prefix: 'E', desc: 'Europe' },
  { prefix: 'O', desc: 'Middle East' },
  { prefix: 'R', desc: 'Asia Pacific' },
  { prefix: 'Y', desc: 'Australia' },
  { prefix: 'V', desc: 'South Asia' },
  { prefix: 'L', desc: 'Southern Europe' },
  { prefix: 'S', desc: 'South America' },
];

const EMPTY_FORM = {
  icao_code: '', station_name: '', timezone: 'America/Chicago',
  region: 'Other / Not Specified', hangar_bays: 0, line_bays: 0,
  is_active: true, notes: '',
};

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/60';
const labelCls = 'text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5';

function StationModal({ initial, onClose, onSave, isPending }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isEdit = !!initial?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto" style={{ paddingTop: '96px' }}>
      <div className="w-full max-w-2xl bg-[#141922] border border-white/10 rounded-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-extrabold text-white text-base">{isEdit ? 'Edit Station' : 'Add New Station'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* ICAO Guide */}
          {!isEdit && (
            <div className="bg-[#1a2535] border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs font-extrabold text-blue-400 flex items-center gap-2 mb-3">
                <Globe className="w-3.5 h-3.5" /> ICAO Code Prefix Guide:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1.5 gap-x-4">
                {ICAO_GUIDE.map(({ prefix, desc }) => (
                  <p key={prefix} className="text-[11px] text-gray-400">
                    <span className="font-extrabold text-white">{prefix}</span> = {desc}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ICAO Code *</label>
              <input
                value={form.icao_code}
                onChange={e => set('icao_code', e.target.value.toUpperCase())}
                placeholder="KORD, EGLL, EDDF, RJTT"
                maxLength={4}
                className={inputCls}
              />
              <p className="text-[10px] text-gray-600 mt-1">Worldwide ICAO: 4 letters (US: K+, Pacific: P+, Europe: E+, Asia: R+, etc.)</p>
            </div>
            <div>
              <label className={labelCls}>Station Name *</label>
              <input
                value={form.station_name}
                onChange={e => set('station_name', e.target.value)}
                placeholder="Chicago O'Hare"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Timezone</label>
              <select value={form.timezone} onChange={e => set('timezone', e.target.value)} className={inputCls}>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{TIMEZONE_LABELS[tz] || tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Region</label>
              <select value={form.region} onChange={e => set('region', e.target.value)} className={inputCls}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Hangar Bays</label>
              <input type="number" min="0" value={form.hangar_bays}
                onChange={e => set('hangar_bays', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Line Bays</label>
              <input type="number" min="0" value={form.line_bays}
                onChange={e => set('line_bays', Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm text-white font-semibold">Station is active and operational</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onSave(form)}
              disabled={isPending || !form.icao_code || !form.station_name}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Add Station'}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/15">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ station, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-[#141922] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-extrabold text-white">Delete Station</p>
            <p className="text-xs text-gray-400">{station.icao_code} — {station.station_name}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400">This will permanently remove the station from the registry. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500">Delete</button>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/15">Cancel</button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_STATIONS = [
  { icao_code: 'PAFA', station_name: 'Fairbanks International', region: 'Alaska', timezone: 'America/Anchorage', hangar_bays: 1, line_bays: 1, is_active: true },
  { icao_code: 'PANC', station_name: 'Anchorage International', region: 'Alaska', timezone: 'America/Anchorage', hangar_bays: 3, line_bays: 2, is_active: true },
  { icao_code: 'YSSY', station_name: 'Sydney Kingsford Smith', region: 'Australia', timezone: 'Australia/Sydney', hangar_bays: 2, line_bays: 2, is_active: true },
  { icao_code: 'CYYZ', station_name: 'Toronto Pearson', region: 'Canada', timezone: 'America/Toronto', hangar_bays: 3, line_bays: 3, is_active: true },
  { icao_code: 'MDPC', station_name: 'Punta Cana International', region: 'Caribbean', timezone: 'America/Santo_Domingo', hangar_bays: 1, line_bays: 2, is_active: true },
  { icao_code: 'KEWR', station_name: 'Newark Liberty International', region: 'USA Continental', timezone: 'America/New_York', hangar_bays: 4, line_bays: 6, is_active: true },
  { icao_code: 'KJFK', station_name: 'John F. Kennedy International', region: 'USA Continental', timezone: 'America/New_York', hangar_bays: 3, line_bays: 5, is_active: true },
  { icao_code: 'KLAX', station_name: 'Los Angeles International', region: 'USA Continental', timezone: 'America/Los_Angeles', hangar_bays: 4, line_bays: 8, is_active: true },
  { icao_code: 'KORD', station_name: "Chicago O'Hare International", region: 'USA Continental', timezone: 'America/Chicago', hangar_bays: 5, line_bays: 7, is_active: true },
  { icao_code: 'KDFW', station_name: 'Dallas/Fort Worth International', region: 'USA Continental', timezone: 'America/Chicago', hangar_bays: 4, line_bays: 6, is_active: true },
  { icao_code: 'KATL', station_name: 'Hartsfield-Jackson Atlanta', region: 'USA Continental', timezone: 'America/New_York', hangar_bays: 3, line_bays: 5, is_active: true },
  { icao_code: 'KMIA', station_name: 'Miami International', region: 'USA Continental', timezone: 'America/New_York', hangar_bays: 3, line_bays: 4, is_active: true },
  { icao_code: 'KSFO', station_name: 'San Francisco International', region: 'USA Continental', timezone: 'America/Los_Angeles', hangar_bays: 2, line_bays: 4, is_active: true },
  { icao_code: 'KBOS', station_name: 'Boston Logan International', region: 'USA Continental', timezone: 'America/New_York', hangar_bays: 2, line_bays: 3, is_active: true },
  { icao_code: 'KDEN', station_name: 'Denver International', region: 'USA Continental', timezone: 'America/Denver', hangar_bays: 3, line_bays: 4, is_active: true },
  { icao_code: 'EGLL', station_name: 'London Heathrow', region: 'Europe', timezone: 'Europe/London', hangar_bays: 3, line_bays: 4, is_active: true },
  { icao_code: 'EDDF', station_name: 'Frankfurt Main', region: 'Europe', timezone: 'Europe/Berlin', hangar_bays: 3, line_bays: 4, is_active: true },
  { icao_code: 'LFPG', station_name: 'Paris Charles de Gaulle', region: 'Europe', timezone: 'Europe/Paris', hangar_bays: 2, line_bays: 3, is_active: true },
  { icao_code: 'OMDB', station_name: 'Dubai International', region: 'Middle East', timezone: 'Asia/Dubai', hangar_bays: 2, line_bays: 3, is_active: true },
  { icao_code: 'RJTT', station_name: 'Tokyo Haneda', region: 'Southeast Asia', timezone: 'Asia/Tokyo', hangar_bays: 2, line_bays: 3, is_active: true },
];

export default function GlobalStationManagement() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [deleteStation, setDeleteStation] = useState(null);
  const [filter, setFilter] = useState('all'); // all | active | inactive
  const qc = useQueryClient();

  const { data: stations = [], isLoading, refetch } = useQuery({
    queryKey: ['global-stations'],
    queryFn: () => base44.entities.Station.list('icao_code', 500),
    refetchInterval: 300000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Station.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['global-stations'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Station.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['global-stations'] }); setEditStation(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Station.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['global-stations'] }); setDeleteStation(null); },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: () => base44.entities.Station.bulkCreate(DEFAULT_STATIONS),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['global-stations'] }),
  });

  // Filter & search
  const filtered = stations.filter(s => {
    const matchFilter = filter === 'all' || (filter === 'active' ? s.is_active : !s.is_active);
    const matchSearch = !search ||
      s.icao_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.station_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.region?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Group by region
  const grouped = filtered.reduce((acc, s) => {
    const r = s.region || 'Other / Not Specified';
    if (!acc[r]) acc[r] = [];
    acc[r].push(s);
    return acc;
  }, {});
  const sortedRegions = Object.keys(grouped).sort();

  const activeCount = stations.filter(s => s.is_active).length;
  const inactiveCount = stations.filter(s => !s.is_active).length;

  return (
    <div className="min-h-screen bg-[#0a0d11] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide">Global Station Management</h1>
            <p className="text-xs text-gray-500">Manage worldwide ICAO airport codes · System-wide configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
          </button>
          {stations.length === 0 && (
            <button
              onClick={() => bulkCreateMutation.mutate()}
              disabled={bulkCreateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/15 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
            </button>
          )}
          {stations.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('This will add default stations. Continue?')) bulkCreateMutation.mutate();
              }}
              disabled={bulkCreateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/15 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Station
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4 max-w-5xl mx-auto">
        {/* Active count banner */}
        <div className="flex items-center justify-between bg-[#0d1117] border border-white/10 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <p className="font-extrabold text-white text-sm">
              Active Stations ({activeCount})
            </p>
          </div>
          <p className="text-xs text-gray-500">{activeCount} operational · {inactiveCount} inactive</p>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ICAO, name, region…"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'active', 'inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all',
                  filter === f ? 'bg-primary text-primary-foreground' : 'bg-[#0d1117] border border-white/10 text-gray-400 hover:text-white')}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Station list grouped by region */}
        {isLoading ? (
          <div className="text-center text-gray-600 py-20 text-sm">Loading stations…</div>
        ) : stations.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <Globe className="w-16 h-16 text-gray-700 mx-auto" />
            <p className="text-gray-400 font-extrabold text-lg">No Stations Configured</p>
            <p className="text-gray-600 text-sm">Click "Reset to Defaults" to load pre-built stations or add your own.</p>
            <button onClick={() => bulkCreateMutation.mutate()} disabled={bulkCreateMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
              {bulkCreateMutation.isPending ? 'Loading…' : 'Load Default Stations'}
            </button>
          </div>
        ) : sortedRegions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No stations match your search.</div>
        ) : (
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
            {sortedRegions.map((region, ri) => (
              <div key={region}>
                {/* Region header */}
                <div className="px-5 py-2.5 bg-[#111620]">
                  <p className="text-[11px] font-extrabold text-primary uppercase tracking-widest">{region}</p>
                </div>

                {/* Station rows */}
                {grouped[region].map((station, idx) => (
                  <div key={station.id}
                    className={cn(
                      'flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors',
                      idx < grouped[region].length - 1 ? 'border-b border-white/5' : ''
                    )}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {station.is_active
                          ? <Circle className="w-2.5 h-2.5 text-green-400 fill-green-400" />
                          : <Circle className="w-2.5 h-2.5 text-gray-600 fill-gray-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">
                          <span className="font-mono text-primary mr-2">{station.icao_code}</span>
                          {station.station_name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {station.timezone}
                          {station.hangar_bays > 0 && ` · ${station.hangar_bays} Hangar Bay${station.hangar_bays !== 1 ? 's' : ''}`}
                          {station.line_bays > 0 && ` · ${station.line_bays} Line Bay${station.line_bays !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                     onClick={() => window.location.assign(`/StationDashboard?icao=${station.icao_code}`)}
                     className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                     title="View Dashboard">
                     <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <span className={cn(
                     'text-[10px] font-extrabold px-3 py-1 rounded-lg',
                     station.is_active ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                    )}>
                     {station.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                     onClick={() => setEditStation(station)}
                     className="w-8 h-8 rounded-lg bg-white/5 hover:bg-primary/20 flex items-center justify-center transition-colors"
                     title="Edit">
                     <Pencil className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button
                     onClick={() => setDeleteStation(station)}
                     className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                     title="Delete">
                     <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                    </div>
                    </div>
                    ))}
                    </div>
                    ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <StationModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {editStation && (
        <StationModal
          initial={editStation}
          onClose={() => setEditStation(null)}
          onSave={(data) => updateMutation.mutate({ id: editStation.id, data })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete Confirm */}
      {deleteStation && (
        <ConfirmDelete
          station={deleteStation}
          onConfirm={() => deleteMutation.mutate(deleteStation.id)}
          onCancel={() => setDeleteStation(null)}
        />
      )}
    </div>
  );
}