import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Plane, ChevronLeft, RefreshCw, AlertTriangle, CheckCircle,
  Search, Radio, Database, MapPin, Building2, Filter, X
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

function localTime(isoOrShort, airportCode) {
  if (!isoOrShort || isoOrShort === '—') return null;
  const tz = AIRPORT_TZ[airportCode];
  if (!tz) return null;
  try {
    // Accept full ISO string directly
    const d = new Date(isoOrShort);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz, hour12: false });
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
  return {
    id: fa.fa_flight_id || fa.ident,
    flight_number: fa.ident_iata || fa.ident || '—',
    origin: fa.origin?.code_iata || fa.origin?.code || '—',
    destination: fa.destination?.code_iata || fa.destination?.code || '—',
    aircraft_tail: fa.registration || '—',
    aircraft_type: fa.aircraft_type || '—',
    status: fa.status || 'Scheduled',
    scheduled_departure: fa.scheduled_out ? new Date(fa.scheduled_out).toISOString().slice(11, 16) + 'Z' : '—',
    scheduled_arrival: fa.scheduled_in ? new Date(fa.scheduled_in).toISOString().slice(11, 16) + 'Z' : '—',
    actual_departure: fa.actual_out ? new Date(fa.actual_out).toISOString().slice(11, 16) + 'Z' : null,
    actual_arrival: fa.actual_in ? new Date(fa.actual_in).toISOString().slice(11, 16) + 'Z' : null,
    _raw_dep: fa.scheduled_out || null,
    _raw_arr: fa.scheduled_in || null,
    gate: fa.gate_origin || '—',
    delay_minutes: fa.departure_delay ? Math.round(fa.departure_delay / 60) : 0,
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
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left grid gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
        flight.status === 'Cancelled' || flight.status === 'cancelled' ? 'opacity-50' : ''
      )}
      style={{ gridTemplateColumns: '96px 1fr 120px 70px 60px 80px' }}
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
            {localTime(flight._raw_dep, flight.origin) && (
              <p className="text-[9px] text-amber-400">{localTime(flight._raw_dep, flight.origin)} LT</p>
            )}
          </div>
          <span className="text-gray-600">→</span>
          <div className="text-right">
            <p className="text-[10px] font-mono text-gray-400">{flight.scheduled_arrival}</p>
            {localTime(flight._raw_arr, flight.destination) && (
              <p className="text-[9px] text-amber-400">{localTime(flight._raw_arr, flight.destination)} LT</p>
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
          {localTime(flight._raw_dep, flight.origin) && (
            <p className="text-[10px] text-amber-400">{localTime(flight._raw_dep, flight.origin)} LT</p>
          )}
          {flight.actual_departure && <p className="text-[10px] text-green-400">ATD {flight.actual_departure}</p>}
        </div>
        <div className="flex-1 mx-4"><FlightProgress flight={flight} /></div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">{flight.destination}</p>
          <p className="text-[10px] text-gray-500">Arrival</p>
          <p className="text-xs font-mono text-primary">{flight.scheduled_arrival}</p>
          {localTime(flight._raw_arr, flight.destination) && (
            <p className="text-[10px] text-amber-400">{localTime(flight._raw_arr, flight.destination)} LT</p>
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
    const matchStatus =
      statusFilter === 'all'      ? true :
      statusFilter === 'active'   ? isActive(s) :
      statusFilter === 'airborne' ? isAirborne(s) :
      statusFilter === 'delayed'  ? (f.delay_minutes || 0) > 0 :
      statusFilter === 'arrived'  ? isArrived(s) : true;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      f.flight_number?.toLowerCase().includes(q) ||
      f.origin?.toLowerCase().includes(q) ||
      f.destination?.toLowerCase().includes(q) ||
      f.aircraft_tail?.toLowerCase().includes(q) ||
      f.airline?.toLowerCase().includes(q) ||
      f.aircraft_type?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
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

      {/* ── Live filter bar (only in live mode) ── */}
      {mode === 'live' && (
        <LiveFilterBar params={liveParams} setParams={setLiveParams} onFetch={fetchLive} loading={liveLoading} />
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
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
          <div className="grid gap-3 px-4 py-2 border-b border-white/8 text-[9px] font-extrabold text-gray-600 uppercase tracking-widest bg-[#0a0e18] flex-shrink-0"
            style={{ gridTemplateColumns: '96px 1fr 120px 70px 60px 80px' }}>
            <span>Flight</span><span>Route</span><span>STD → STA</span><span className="text-center">Gate</span><span className="text-center">Delay</span><span className="text-right">Status</span>
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
    </div>
  );
}