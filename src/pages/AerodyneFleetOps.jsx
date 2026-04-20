import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Plane, ChevronLeft, RefreshCw, AlertTriangle, CheckCircle,
  Search, Radio, Database, MapPin, Building2, Filter, X,
  ChevronDown, ChevronUp, SlidersHorizontal, Bookmark, Layers, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Airport timezone map (ICAO → IANA) ────────────────────────────────────────
const AIRPORT_TZ = {
  KEWR:'America/New_York', KJFK:'America/New_York', KLGA:'America/New_York',
  KBOS:'America/New_York', KMIA:'America/New_York', KATL:'America/New_York',
  KDCA:'America/New_York', KIAD:'America/New_York', KPHL:'America/New_York',
  KORD:'America/Chicago',  KMDW:'America/Chicago',  KDFW:'America/Chicago',
  KIAH:'America/Chicago',  KMSP:'America/Chicago',  KSTL:'America/Chicago',
  KDEN:'America/Denver',   KSLC:'America/Denver',
  KLAX:'America/Los_Angeles', KSFO:'America/Los_Angeles', KSEA:'America/Los_Angeles',
  KLAS:'America/Los_Angeles', KPDX:'America/Los_Angeles', KPHX:'America/Phoenix',
  PANC:'America/Anchorage', PHNL:'Pacific/Honolulu',
  EGLL:'Europe/London', EGKK:'Europe/London', EDDF:'Europe/Berlin',
  LFPG:'Europe/Paris', LEMD:'Europe/Madrid', LIRF:'Europe/Rome',
  EHAM:'Europe/Amsterdam', LSZH:'Europe/Zurich',
  OMDB:'Asia/Dubai', OERK:'Asia/Riyadh', VABB:'Asia/Kolkata', VIDP:'Asia/Kolkata',
  RJTT:'Asia/Tokyo', RKSI:'Asia/Seoul', ZGGG:'Asia/Shanghai', ZBAA:'Asia/Shanghai',
  YSSY:'Australia/Sydney', YMML:'Australia/Melbourne',
};

function localTime(isoOrShort) {
  if (!isoOrShort || isoOrShort === '—') return null;
  try {
    const d = new Date(isoOrShort);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return null; }
}

// ── Zulu clock ───────────────────────────────────────────────────────────────
function ZuluClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = n => String(n).padStart(2, '0');
  return <span className="font-mono text-xs font-extrabold text-primary tracking-widest">{p(t.getUTCHours())}:{p(t.getUTCMinutes())}:{p(t.getUTCSeconds())} Z</span>;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  // FlightAware statuses (with spaces)
  'Scheduled':    { label: 'SCH',      color: 'text-gray-400',   bg: 'bg-gray-500/15',  dot: 'bg-gray-400' },
  'En Route':     { label: 'EN ROUTE', color: 'text-green-400',  bg: 'bg-green-500/15', dot: 'bg-green-400 animate-pulse' },
  'Departed':     { label: 'DEP',      color: 'text-amber-400',  bg: 'bg-amber-500/15', dot: 'bg-amber-400' },
  'Arrived':      { label: 'ARR',      color: 'text-green-400',  bg: 'bg-green-500/15', dot: 'bg-green-400' },
  'Landed':       { label: 'LANDED',   color: 'text-green-400',  bg: 'bg-green-500/15', dot: 'bg-green-400' },
  'Cancelled':    { label: 'CXL',      color: 'text-red-400',    bg: 'bg-red-500/15',   dot: 'bg-red-500' },
  // entity statuses
  'scheduled':    { label: 'SCH',      color: 'text-gray-400',   bg: 'bg-gray-500/15',  dot: 'bg-gray-400' },
  'boarding':     { label: 'BOARDING', color: 'text-blue-400',   bg: 'bg-blue-500/15',  dot: 'bg-blue-400 animate-pulse' },
  'departed':     { label: 'DEP',      color: 'text-amber-400',  bg: 'bg-amber-500/15', dot: 'bg-amber-400' },
  'airborne':     { label: 'AIRBORNE', color: 'text-green-400',  bg: 'bg-green-500/15', dot: 'bg-green-400 animate-pulse' },
  'arrived':      { label: 'ARR',      color: 'text-green-400',  bg: 'bg-green-500/15', dot: 'bg-green-400' },
  'landed':       { label: 'LANDED',   color: 'text-green-400',  bg: 'bg-green-500/15', dot: 'bg-green-400' },
  'delayed':      { label: 'DELAY',    color: 'text-red-400',    bg: 'bg-red-500/15',   dot: 'bg-red-400 animate-pulse' },
  'cancelled':    { label: 'CXL',      color: 'text-red-400',    bg: 'bg-red-500/15',   dot: 'bg-red-500' },
  'on_time':      { label: 'ON TIME',  color: 'text-green-400',  bg: 'bg-green-500/15', dot: 'bg-green-400' },
};
const isAirborne  = s => ['En Route', 'airborne'].includes(s);
const isActive    = s => ['En Route', 'airborne', 'boarding', 'Departed', 'departed'].includes(s);
const isArrived   = s => ['Arrived', 'Landed', 'arrived', 'landed'].includes(s);
const isCancelled = s => ['Cancelled', 'cancelled'].includes(s);
const getCfg = s => STATUS_CFG[s] || STATUS_CFG['Scheduled'];

// ── Fleet type → ICAO aircraft type code map ─────────────────────────────────
const FLEET_ICAO_MAP = {
  'B737-700': ['B737','B733','B734','B735','B736','B73G'],
  'B737-800': ['B738','B738'],
  'B737-900': ['B739'],
  'B737 MAX 8': ['B38M','B7M8'],
  'B737 MAX 9': ['B39M','B7M9'],
  'B757': ['B752','B753','B757'],
  'B767': ['B762','B763','B764','B767'],
  'B777': ['B772','B773','B77L','B77W','B778','B779'],
  'B787': ['B788','B789','B78X'],
  'A320': ['A320','A319','A20N','A19N'],
  'A321': ['A321','A21N'],
  'A350': ['A359','A35K'],
  'E190': ['E190','E195','E19N'],
  'CRJ900': ['CRJ9','CL30'],
};

// ── FA data normalizer ────────────────────────────────────────────────────────
function normalizeFAFlight(fa) {
  // AeroAPI v4 uses scheduled_out/in, actual_out/in, gate_origin, departure_delay etc.
  // Also handle older field names for compatibility
  const schedDep = fa.scheduled_out || fa.scheduled_departure_time || fa.filed_departure_time;
  const schedArr = fa.scheduled_in || fa.scheduled_arrival_time || fa.filed_arrival_time;
  const actDep = fa.actual_out || fa.actual_departure_time;
  const actArr = fa.actual_in || fa.actual_arrival_time;
  const depDelay = fa.departure_delay ?? (fa.dep_delay != null ? fa.dep_delay : 0);

  return {
    id: fa.fa_flight_id || fa.ident,
    flight_number: fa.ident_iata || fa.ident || '—',
    origin: fa.origin?.code_iata || fa.origin?.code_icao || fa.origin?.code || (typeof fa.origin === 'string' ? fa.origin : '—'),
    destination: fa.destination?.code_iata || fa.destination?.code_icao || fa.destination?.code || (typeof fa.destination === 'string' ? fa.destination : '—'),
    aircraft_tail: fa.registration || '—',
    aircraft_type: fa.aircraft_type || '—',
    status: fa.status || 'Scheduled',
    scheduled_departure: schedDep ? new Date(schedDep).toISOString().slice(11, 16) + 'Z' : '—',
    scheduled_arrival: schedArr ? new Date(schedArr).toISOString().slice(11, 16) + 'Z' : '—',
    actual_departure: actDep ? new Date(actDep).toISOString().slice(11, 16) + 'Z' : null,
    actual_arrival: actArr ? new Date(actArr).toISOString().slice(11, 16) + 'Z' : null,
    _raw_dep: schedDep || null,
    _raw_arr: schedArr || null,
    gate: fa.gate_origin || fa.origin_gate || '—',
    delay_minutes: depDelay ? Math.round(Math.abs(depDelay) / 60) : 0,
    airline: fa.operator_iata || fa.operator || '—',
    _live: true,
  };
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function FlightProgress({ flight }) {
  const pct =
    ['En_Route', 'airborne', 'departed', 'Departed'].includes(flight.status) ? 55 :
    ['Arrived', 'arrived', 'landed'].includes(flight.status) ? 100 : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] font-mono text-gray-500 w-10 flex-shrink-0">{flight.origin}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
        <div className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-400' : 'bg-primary')} style={{ width: `${pct}%` }} />
        {['En_Route','airborne'].includes(flight.status) && (
          <Plane className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 text-primary fill-primary" style={{ left: `${pct}%` }} />
        )}
      </div>
      <span className="text-[10px] font-mono text-gray-500 w-10 flex-shrink-0 text-right">{flight.destination}</span>
    </div>
  );
}

// ── Flight row ────────────────────────────────────────────────────────────────
function FlightRow({ flight, isSelected, onClick }) {
  const cfg = getCfg(flight.status);
  // Estimate ground time from scheduled block times if available
  const gndTime = (() => {
    if (!flight._raw_arr || !flight._raw_dep) return null;
    const arr = new Date(flight._raw_arr);
    const dep = new Date(flight._raw_dep);
    const diff = Math.round((dep - arr) / 60000);
    return diff > 0 && diff < 300 ? `${diff}m` : null;
  })();
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left grid px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors gap-2',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
        flight.status === 'Cancelled' || flight.status === 'cancelled' ? 'opacity-50' : ''
      )}
      style={{ gridTemplateColumns: '90px 1fr 140px 55px 55px 70px 70px 55px 80px' }}
    >
      <div>
        <p className="text-sm font-extrabold text-white font-mono">{flight.flight_number}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {flight._live && <Radio className="w-2.5 h-2.5 text-green-400" />}
          <p className="text-[10px] text-gray-600">{flight.airline}</p>
        </div>
      </div>
      <div className="min-w-0">
        <FlightProgress flight={flight} />
        <p className="text-[10px] text-gray-600 mt-1">{flight.aircraft_tail} · {flight.aircraft_type}</p>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <div className="text-right">
            <p className="text-[10px] font-mono text-gray-400">{flight.scheduled_departure}</p>
            {localTime(flight._raw_dep) && (
              <p className="text-[9px] text-amber-400">{localTime(flight._raw_dep)} LT</p>
            )}
          </div>
          <span className="text-gray-600">→</span>
          <div className="text-right">
            <p className="text-[10px] font-mono text-gray-400">{flight.scheduled_arrival}</p>
            {localTime(flight._raw_arr) && (
              <p className="text-[9px] text-amber-400">{localTime(flight._raw_arr)} LT</p>
            )}
          </div>
        </div>
        {flight.actual_departure && <p className="text-[10px] text-green-400 font-mono mt-0.5">ATD {flight.actual_departure}</p>}
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-gray-300">{flight.gate || '—'}</p>
        <p className="text-[10px] text-gray-600">Gate</p>
      </div>
      <div className="text-center">
        {flight.delay_minutes > 0
          ? <p className="text-xs font-extrabold text-red-400">+{flight.delay_minutes}m</p>
          : <p className="text-xs text-gray-600">—</p>}
      </div>
      <div className="text-center">
        {gndTime ? <p className="text-[10px] font-bold text-cyan-400">{gndTime}</p> : <p className="text-[10px] text-gray-600">—</p>}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono text-gray-400 truncate">{flight.aircraft_type || '—'}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-gray-600">—</p>
      </div>
      <div className="flex items-center justify-end">
        <span className={cn('flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-full', cfg.bg, cfg.color)}>
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
          {cfg.label}
        </span>
      </div>
    </button>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function FlightDetailPanel({ flight, aircraft }) {
  if (!flight) return (
    <div className="flex items-center justify-center h-full text-gray-600 text-sm">
      <div className="text-center space-y-2">
        <Plane className="w-10 h-10 mx-auto opacity-20" />
        <p>Select a flight</p>
      </div>
    </div>
  );
  const cfg = getCfg(flight.status);
  const ac = aircraft.find(a => a.tail_number === flight.aircraft_tail);
  return (
    <div className="h-full overflow-y-auto p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-white font-mono">{flight.flight_number}</p>
            {flight._live && <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400"><Radio className="w-2.5 h-2.5" /> LIVE</span>}
          </div>
          <p className="text-sm text-gray-400">{flight.origin} → {flight.destination}</p>
        </div>
        <span className={cn('flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full', cfg.bg, cfg.color)}>
          <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />{cfg.label}
        </span>
      </div>

      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <p className="text-2xl font-black text-white">{flight.origin}</p>
          <p className="text-[10px] text-gray-500">Departure</p>
          <p className="text-xs font-mono text-primary">{flight.scheduled_departure}</p>
          {localTime(flight._raw_dep) && (
            <p className="text-[10px] text-amber-400">{localTime(flight._raw_dep)} LT</p>
          )}
          {flight.actual_departure && <p className="text-[10px] text-green-400">ATD {flight.actual_departure}</p>}
        </div>
        <div className="flex-1 mx-4"><FlightProgress flight={flight} /></div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">{flight.destination}</p>
          <p className="text-[10px] text-gray-500">Arrival</p>
          <p className="text-xs font-mono text-primary">{flight.scheduled_arrival}</p>
          {localTime(flight._raw_arr) && (
            <p className="text-[10px] text-amber-400">{localTime(flight._raw_arr)} LT</p>
          )}
          {flight.actual_arrival && <p className="text-[10px] text-green-400">ATA {flight.actual_arrival}</p>}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { l: 'Tail', v: flight.aircraft_tail, mono: true },
          { l: 'Type', v: flight.aircraft_type },
          { l: 'Gate', v: flight.gate },
          { l: 'Airline', v: flight.airline },
          { l: 'Delay', v: flight.delay_minutes > 0 ? `+${flight.delay_minutes}m` : 'On Time', color: flight.delay_minutes > 0 ? 'text-red-400' : 'text-green-400' },
          { l: 'Source', v: flight._live ? 'FlightAware' : 'Internal' },
        ].map(({ l, v, mono, color }) => (
          <div key={l} className="bg-[#0d1117] border border-white/8 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{l}</p>
            <p className={cn('text-sm font-bold text-white mt-0.5', mono && 'font-mono', color)}>{v || '—'}</p>
          </div>
        ))}
      </div>

      {flight.delay_minutes > 0 && flight.delay_reason && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Delay Reason</p>
            <p className="text-sm text-red-300">{flight.delay_reason}</p>
          </div>
        </div>
      )}

      {ac && (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Fleet Record</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[['MSN', ac.msn], ['Engine', ac.engine_type], ['ETOPS', ac.etops_approval ? `${ac.etops_approval}min` : '—'], ['CAT', ac.cat_approval], ['Base', ac.base_station], ['Status', ac.status?.toUpperCase()]].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-gray-600">{l}</span>
                <span className="text-gray-300 font-bold">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Link to="/TechOpsLogbook" className="flex-1 py-2.5 text-center rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-colors">Logbook</Link>
        <Link to="/Dispatch" className="flex-1 py-2.5 text-center rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-colors">Dispatch</Link>
      </div>
    </div>
  );
}

// ── Live feed filter bar ──────────────────────────────────────────────────────
const FLEET_TYPES = ['All Types','B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','B757','B767','B777','B787','A320','A321','A350','E190','CRJ900'];
const PERIODS = ['1 HR','2 HRS','4 HRS','8 HRS','12 HRS','24 HRS'];

const FILTER_CATEGORIES = [
  { id: 'carrier',     label: 'Carrier',          options: ['UAL','AAL','DAL','SWA','JBU','ASA','FFT'] },
  { id: 'fleetType',   label: 'Fleet / Sub-Fleet', options: FLEET_TYPES.slice(1) },
  { id: 'flightStatus',label: 'Flight Status',     options: ['Scheduled','En Route','Departed','Arrived','Landed','Cancelled'] },
  { id: 'melCode',     label: 'MEL Code',          options: ['Cat A','Cat B','Cat C','Cat D','None'] },
  { id: 'irropEvents', label: 'IRROP Events',       options: ['Weather','Mechanical','Crew','ATC','Other'] },
  { id: 'typeOfFlying',label: 'Type of Flying',    options: ['Mainline','Regional','Charter','Cargo'] },
  { id: 'zoneGate',   label: 'Zone / Gate',        options: [] },
];

function FilterSidebar({ onClose, activeFilters, setActiveFilters, savedViews, setSavedViews, onLoadView }) {
  const [expanded, setExpanded] = useState({ flightStatus: true, carrier: true });
  const [viewName, setViewName] = useState('');
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const toggleOption = (catId, opt) => {
    setActiveFilters(p => {
      const cur = new Set(p[catId] || []);
      cur.has(opt) ? cur.delete(opt) : cur.add(opt);
      return { ...p, [catId]: [...cur] };
    });
  };
  const totalActive = Object.values(activeFilters).reduce((s, a) => s + (a?.length || 0), 0);

  const saveView = () => {
    if (!viewName.trim()) return;
    const newView = { name: viewName.trim(), filters: { ...activeFilters } };
    const updated = [...savedViews.filter(v => v.name !== newView.name), newView];
    setSavedViews(updated);
    localStorage.setItem('afo_saved_views', JSON.stringify(updated));
    setViewName('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-white/10 w-56 flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-extrabold text-white uppercase tracking-widest">Filters</span>
          {totalActive > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">{totalActive}</span>}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-2 px-3 py-2 border-b border-white/8">
        <input
          value={viewName}
          onChange={e => setViewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && saveView()}
          placeholder="Name Your View"
          className="flex-1 bg-[#111620] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white placeholder-gray-600 outline-none focus:border-primary/50"
        />
        <button
          onClick={saveView}
          disabled={!viewName.trim()}
          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
        >Save</button>
      </div>
      {savedViews.length > 0 && (
        <div className="px-3 py-2 border-b border-white/8 space-y-1">
          <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest mb-1">Saved Views</p>
          {savedViews.map(v => (
            <div key={v.name} className="flex items-center gap-1">
              <button
                onClick={() => { onLoadView(v.filters); onClose(); }}
                className="flex-1 text-left text-[10px] text-primary hover:text-white truncate font-bold"
              >{v.name}</button>
              <button
                onClick={() => {
                  const updated = savedViews.filter(sv => sv.name !== v.name);
                  setSavedViews(updated);
                  localStorage.setItem('afo_saved_views', JSON.stringify(updated));
                }}
                className="text-gray-600 hover:text-red-400 flex-shrink-0"
              ><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 px-3 py-2 border-b border-white/8">
        <button onClick={() => setActiveFilters({})} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#111620] border border-white/10 text-gray-400 hover:text-white">Reset</button>
        <button onClick={onClose} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-primary/80 text-primary-foreground hover:bg-primary">Apply</button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {FILTER_CATEGORIES.map(cat => (
          <div key={cat.id} className="border-b border-white/8">
            <button onClick={() => toggle(cat.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <span>{cat.label}</span>
              <div className="flex items-center gap-2">
                {(activeFilters[cat.id]?.length > 0) && (
                  <span className="text-[9px] text-primary font-bold">{activeFilters[cat.id].length}</span>
                )}
                {expanded[cat.id] ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
              </div>
            </button>
            {expanded[cat.id] && cat.options.length > 0 && (
              <div className="px-4 pb-2 space-y-1">
                {cat.options.map(opt => {
                  const active = activeFilters[cat.id]?.includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <div onClick={() => toggleOption(cat.id, opt)}
                        className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer',
                          active ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40')}>
                        {active && <CheckCircle className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-gray-200">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveFilterBar({ params, setParams, onFetch, loading }) {
  return (
    <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-white/8 bg-[#080c12]">
      <div>
        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Airport (ICAO)</p>
        <input
          value={params.airport}
          onChange={e => setParams(p => ({ ...p, airport: e.target.value.toUpperCase() }))}
          placeholder="KEWR"
          maxLength={4}
          className="w-24 bg-[#111620] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 outline-none focus:border-primary/50"
        />
      </div>
      <div>
        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Building2 className="w-2.5 h-2.5" /> Airline (ICAO)</p>
        <input
          value={params.airline}
          onChange={e => setParams(p => ({ ...p, airline: e.target.value.toUpperCase() }))}
          placeholder="UAL"
          maxLength={4}
          className="w-24 bg-[#111620] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 outline-none focus:border-primary/50"
        />
      </div>
      <div>
        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Filter className="w-2.5 h-2.5" /> Fleet Type</p>
        <select
          value={params.fleetType}
          onChange={e => setParams(p => ({ ...p, fleetType: e.target.value }))}
          className="bg-[#111620] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
        >
          {FLEET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Direction</p>
        <div className="flex gap-1">
          {['arrivals','departures','airline'].map(d => (
            <button key={d} onClick={() => setParams(p => ({ ...p, dir: d }))}
              className={cn('text-[10px] font-bold px-2.5 py-2 rounded-lg capitalize transition-all',
                params.dir === d ? 'bg-primary text-primary-foreground' : 'bg-[#111620] border border-white/10 text-gray-500 hover:text-gray-300')}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onFetch} disabled={loading || (!params.airport && !params.airline)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-extrabold hover:bg-green-500 disabled:opacity-50 transition-colors mt-4">
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
        {loading ? 'Fetching…' : 'Fetch Live'}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'airborne', label: 'Airborne' },
  { id: 'delayed', label: 'Delayed' },
  { id: 'arrived', label: 'Arrived' },
];

export default function AerodyneFleetOps() {
  const [mode, setMode] = useState('live'); // 'live' | 'internal'
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [savedViews, setSavedViews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('afo_saved_views') || '[]'); } catch { return []; }
  });
  const [period, setPeriod] = useState('4 HRS');
  const [showPeriod, setShowPeriod] = useState(false);
  const [showMyViews, setShowMyViews] = useState(false);
  const [showQuickViews, setShowQuickViews] = useState(false);
  const [liveFlights, setLiveFlights] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [liveParams, setLiveParams] = useState({ airport: 'KEWR', airline: '', fleetType: 'All Types', dir: 'departures' });
  const today = new Date().toISOString().split('T')[0];

  const { data: aircraft = [] } = useQuery({
    queryKey: ['afo-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  // Internal entity flights
  const { data: entityFlights = [], isLoading: entityLoading, refetch: refetchEntity } = useQuery({
    queryKey: ['afo-entity-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 500),
    refetchInterval: 60000,
    enabled: mode === 'internal',
  });
  const todayEntityFlights = entityFlights.filter(f => f.flight_date === today);

  // Fetch live FA data
  const fetchLive = useCallback(async () => {
    setLiveLoading(true);
    setLiveError(null);
    setLiveFlights([]);
    try {
      let results = [];
      const { airport, airline, dir } = liveParams;
      if (dir === 'arrivals' && airport) {
        const res = await base44.functions.invoke('flightAwareProxy', { type: 'airport_arrivals', airport, airline_icao: airline || undefined });
        results = (res.data?.arrivals || []).map(normalizeFAFlight);
      } else if (dir === 'departures' && airport) {
        const res = await base44.functions.invoke('flightAwareProxy', { type: 'airport_departures', airport, airline_icao: airline || undefined });
        results = (res.data?.departures || []).map(normalizeFAFlight);
      } else if (dir === 'airline' && airline) {
        const res = await base44.functions.invoke('flightAwareProxy', { type: 'airline_flights', airline_icao: airline });
        results = (res.data?.flights || []).map(normalizeFAFlight);
      }
      // Filter by fleet type using ICAO codes
      if (liveParams.fleetType !== 'All Types') {
        const allowed = FLEET_ICAO_MAP[liveParams.fleetType] || [];
        results = results.filter(f => allowed.some(code => f.aircraft_type?.toUpperCase().startsWith(code)));
      }
      setLiveFlights(results);
    } catch (e) {
      setLiveError(e.message);
    } finally {
      setLiveLoading(false);
    }
  }, [liveParams]);

  // Auto-fetch on mount in live mode
  useEffect(() => { if (mode === 'live') fetchLive(); }, [mode]);

  const sourceFlights = mode === 'live' ? liveFlights : todayEntityFlights;
  const isLoading = mode === 'live' ? liveLoading : entityLoading;

  const filtered = sourceFlights.filter(f => {
    const s = f.status;

    // Status tab filter
    const matchStatus =
      statusFilter === 'all'      ? true :
      statusFilter === 'active'   ? isActive(s) :
      statusFilter === 'airborne' ? isAirborne(s) :
      statusFilter === 'delayed'  ? (f.delay_minutes || 0) > 0 :
      statusFilter === 'arrived'  ? isArrived(s) : true;

    // Search filter
    const q = search.toLowerCase();
    const matchSearch = !search ||
      f.flight_number?.toLowerCase().includes(q) ||
      f.origin?.toLowerCase().includes(q) ||
      f.destination?.toLowerCase().includes(q) ||
      f.aircraft_tail?.toLowerCase().includes(q) ||
      f.airline?.toLowerCase().includes(q) ||
      f.aircraft_type?.toLowerCase().includes(q);

    // Sidebar: Carrier filter
    const carrierFilters = activeFilters.carrier || [];
    const matchCarrier = carrierFilters.length === 0 || carrierFilters.some(c =>
      f.airline?.toUpperCase().includes(c) || f.flight_number?.toUpperCase().startsWith(c)
    );

    // Sidebar: Fleet type filter
    const fleetFilters = activeFilters.fleetType || [];
    const matchFleet = fleetFilters.length === 0 || fleetFilters.some(ft => {
      const allowed = FLEET_ICAO_MAP[ft] || [];
      return allowed.some(code => f.aircraft_type?.toUpperCase().startsWith(code));
    });

    // Sidebar: Flight status filter
    const statusFilters = activeFilters.flightStatus || [];
    const matchSidebarStatus = statusFilters.length === 0 || statusFilters.includes(f.status);

    return matchStatus && matchSearch && matchCarrier && matchFleet && matchSidebarStatus;
  });

  // KPIs
  const airborne  = filtered.filter(f => isAirborne(f.status)).length;
  const delayed   = filtered.filter(f => (f.delay_minutes||0) > 0).length;
  const onTime    = filtered.filter(f => (f.delay_minutes||0) === 0 && !['Cancelled','cancelled'].includes(f.status)).length;
  const otp       = filtered.length > 0 ? Math.round((onTime / filtered.length) * 100) : 0;

  const selectedFlight = [...liveFlights, ...entityFlights].find(f => f.id === selected) || null;

  return (
    <div className="h-screen flex flex-col bg-[#080c12] text-white overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-white/8 flex-shrink-0 bg-[#0a0e18]">
        <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-extrabold text-white tracking-widest uppercase">Aerodyne Fleet Ops</p>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase">Operations Control · {today}</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-[#111620] border border-white/10 rounded-xl p-1 flex-shrink-0">
          <button onClick={() => setMode('live')} className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all', mode === 'live' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-300')}>
            <Radio className="w-3 h-3" /> Live FA
          </button>
          <button onClick={() => setMode('internal')} className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all', mode === 'internal' ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-300')}>
            <Database className="w-3 h-3" /> Internal
          </button>
        </div>

        {/* KPI strip */}
        <div className="hidden md:flex items-center gap-5 ml-4 border-l border-white/10 pl-4">
          {[
            { label: 'OTP', val: `${otp}%`, color: otp >= 85 ? 'text-green-400' : otp >= 70 ? 'text-amber-400' : 'text-red-400' },
            { label: 'Airborne', val: airborne, color: 'text-primary' },
            { label: 'Delayed', val: delayed, color: delayed > 0 ? 'text-red-400' : 'text-gray-500' },
            { label: 'Showing', val: filtered.length, color: 'text-white' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={cn('text-base font-black leading-none', color)}>{val}</p>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ZuluClock />
          <button onClick={mode === 'live' ? fetchLive : refetchEntity}
            className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors">
            <RefreshCw className={cn('w-3.5 h-3.5 text-gray-400', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Secondary toolbar: Filters, My Views, Quick Views, Period ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 bg-[#0a0e18] flex-shrink-0 flex-wrap">
        <button onClick={() => setShowFilters(v => !v)}
          className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border transition-all',
            showFilters ? 'bg-primary text-primary-foreground border-primary' : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30')}>
          <SlidersHorizontal className="w-3 h-3" /> FILTERS
          {Object.values(activeFilters).reduce((s, a) => s + (a?.length || 0), 0) > 0 && (
            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">{Object.values(activeFilters).reduce((s, a) => s + (a?.length || 0), 0)}</span>
          )}
        </button>

        <div className="relative">
          <button onClick={() => { setShowMyViews(v => !v); setShowQuickViews(false); }}
            className="flex items-center gap-1 text-[10px] font-extrabold px-3 py-2 rounded-lg border border-white/15 text-gray-400 hover:text-white transition-all">
            <Bookmark className="w-3 h-3" /> MY VIEWS <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showMyViews && (
            <div className="absolute top-full left-0 mt-1 bg-[#141922] border border-white/10 rounded-xl shadow-2xl z-30 min-w-[180px] py-1">
              {savedViews.length === 0 ? (
                <p className="px-3 py-2 text-[10px] text-gray-500">No saved views yet</p>
              ) : savedViews.map(v => (
                <button key={v.name} onClick={() => { setActiveFilters(v.filters); setShowMyViews(false); }}
                  className="w-full text-left px-3 py-2 text-[10px] font-bold text-primary hover:bg-white/5 hover:text-white truncate">
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => { setShowQuickViews(v => !v); setShowMyViews(false); }}
            className="flex items-center gap-1 text-[10px] font-extrabold px-3 py-2 rounded-lg border border-white/15 text-gray-400 hover:text-white transition-all">
            <Layers className="w-3 h-3" /> QUICK VIEWS <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showQuickViews && (
            <div className="absolute top-full left-0 mt-1 bg-[#141922] border border-white/10 rounded-xl shadow-2xl z-30 min-w-[200px] py-1">
              {['Departures Next 2H','Arrivals Next 2H','Delayed Flights','AOG Aircraft','Active Airborne'].map(v => (
                <button key={v} onClick={() => setShowQuickViews(false)}
                  className="w-full text-left px-3 py-2 text-[10px] text-gray-300 hover:bg-white/5 hover:text-white">{v}</button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="relative">
          <button onClick={() => setShowPeriod(v => !v)}
            className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border border-white/15 text-primary bg-primary/10 hover:bg-primary/20 transition-all">
            <Clock className="w-3 h-3" /> {period} <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showPeriod && (
            <div className="absolute top-full left-0 mt-1 bg-[#141922] border border-white/10 rounded-xl shadow-2xl z-30 min-w-[120px] py-1">
              {PERIODS.map(p => (
                <button key={p} onClick={() => { setPeriod(p); setShowPeriod(false); }}
                  className={cn('w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-white/5',
                    period === p ? 'text-primary' : 'text-gray-300')}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Live filter bar (only in live mode) ── */}
      {mode === 'live' && (
        <LiveFilterBar params={liveParams} setParams={setLiveParams} onFetch={fetchLive} loading={liveLoading} />
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden" onClick={() => { setShowMyViews(false); setShowQuickViews(false); setShowPeriod(false); }}>
        {/* Filter sidebar */}
        {showFilters && (
          <FilterSidebar
            onClose={() => setShowFilters(false)}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            savedViews={savedViews}
            setSavedViews={setSavedViews}
            onLoadView={(filters) => setActiveFilters(filters)}
          />
        )}

        {/* Left: flight board */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-white/8">
          {/* Search + status filters */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 flex-shrink-0 bg-[#0a0e18]">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Flight, tail, route, airline…"
                className="w-full bg-[#111620] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50" />
            </div>
            <div className="flex gap-1.5">
              {STATUS_FILTERS.map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  className={cn('text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest',
                    statusFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-[#111620] border border-white/10 text-gray-500 hover:text-gray-300')}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-gray-600 ml-auto">{filtered.length} flights</span>
          </div>

          {/* Column headers */}
          <div className="grid px-4 py-2 border-b border-white/8 text-[9px] font-extrabold text-gray-600 uppercase tracking-widest bg-[#0a0e18] flex-shrink-0 gap-2"
            style={{ gridTemplateColumns: '90px 1fr 140px 55px 55px 70px 70px 55px 80px' }}>
            <span>Flight</span><span>Route</span><span>STD → STA</span><span className="text-center">Gate</span><span className="text-center">Delay</span><span className="text-center">Gnd Time</span><span className="text-center">Fleet</span><span className="text-center">MEL</span><span className="text-right">Status</span>
          </div>

          {/* Flight list */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {liveError && (
              <div className="m-4 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-400">FlightAware Error</p>
                  <p className="text-[10px] text-red-300">{liveError}</p>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
                <Radio className="w-8 h-8 animate-pulse text-green-500" />
                <p className="text-sm">Fetching live data…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-600">
                <Plane className="w-10 h-10 opacity-20" />
                <p className="text-sm">{mode === 'live' ? 'Set filters above and click Fetch Live' : 'No flights found for today'}</p>
              </div>
            ) : (
              filtered.map(f => (
                <FlightRow key={f.id} flight={f} isSelected={f.id === selected}
                  onClick={() => setSelected(f.id === selected ? null : f.id)} />
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 bg-[#0a0e18] flex-shrink-0">
          <div className="px-5 py-3 border-b border-white/8 flex-shrink-0">
            <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest">Flight Detail</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <FlightDetailPanel flight={selectedFlight} aircraft={aircraft} />
          </div>
        </div>
      </div>

      {/* ── Bottom Stats Bar ── */}
      <div className="flex-shrink-0 border-t border-white/8 bg-[#080c12] px-4 py-2 flex items-center gap-4 overflow-x-auto scrollbar-hide">
        {(() => {
          const total = filtered.length;
          const airborneCount = filtered.filter(f => isAirborne(f.status)).length;
          const cancelledCount = filtered.filter(f => isCancelled(f.status)).length;
          const arrivedCount = filtered.filter(f => isArrived(f.status)).length;
          const delayedCount = filtered.filter(f => (f.delay_minutes||0) > 0).length;
          const avgDelay = delayedCount > 0
            ? Math.round(filtered.filter(f => (f.delay_minutes||0) > 0).reduce((s, f) => s + f.delay_minutes, 0) / delayedCount)
            : 0;
          const stats = [
            { label: 'Total Flights', val: total },
            { label: 'Airborne', val: airborneCount, color: 'text-green-400' },
            { label: 'Arrived', val: arrivedCount },
            { label: 'Cancelled', val: cancelledCount, color: cancelledCount > 0 ? 'text-red-400' : undefined },
            { label: 'Delayed', val: delayedCount, color: delayedCount > 0 ? 'text-amber-400' : undefined },
            { label: 'Avg Dep Delay', val: avgDelay > 0 ? `+${avgDelay}m` : '0m', color: avgDelay > 0 ? 'text-amber-400' : 'text-gray-500' },
            { label: 'OTP', val: `${otp}%`, color: otp >= 85 ? 'text-green-400' : otp >= 70 ? 'text-amber-400' : 'text-red-400' },
          ];
          return stats.map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-gray-600">{label}:</span>
              <span className={cn('text-[10px] font-extrabold', color || 'text-white')}>{val}</span>
              <span className="text-gray-700 ml-1">|</span>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}