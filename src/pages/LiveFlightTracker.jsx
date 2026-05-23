import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Plane, Search, RefreshCw, ChevronLeft, ExternalLink, X,
  PlaneLanding, PlaneTakeoff, Globe, Clock, MapPin, AlertTriangle,
  Loader, Building2, Filter, ChevronDown, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Popular airlines for quick-select ────────────────────────────────────────
const POPULAR_AIRLINES = [
  { icao: 'UAL', iata: 'UA', name: 'United Airlines',       flag: '🇺🇸' },
  { icao: 'AAL', iata: 'AA', name: 'American Airlines',     flag: '🇺🇸' },
  { icao: 'DAL', iata: 'DL', name: 'Delta Air Lines',       flag: '🇺🇸' },
  { icao: 'SWA', iata: 'WN', name: 'Southwest Airlines',    flag: '🇺🇸' },
  { icao: 'BAW', iata: 'BA', name: 'British Airways',       flag: '🇬🇧' },
  { icao: 'AFR', iata: 'AF', name: 'Air France',            flag: '🇫🇷' },
  { icao: 'DLH', iata: 'LH', name: 'Lufthansa',             flag: '🇩🇪' },
  { icao: 'UAE', iata: 'EK', name: 'Emirates',              flag: '🇦🇪' },
  { icao: 'QFA', iata: 'QF', name: 'Qantas',                flag: '🇦🇺' },
  { icao: 'SIA', iata: 'SQ', name: 'Singapore Airlines',    flag: '🇸🇬' },
  { icao: 'CPA', iata: 'CX', name: 'Cathay Pacific',        flag: '🇭🇰' },
  { icao: 'KAL', iata: 'KE', name: 'Korean Air',            flag: '🇰🇷' },
  { icao: 'ANA', iata: 'NH', name: 'ANA',                   flag: '🇯🇵' },
  { icao: 'JAL', iata: 'JL', name: 'Japan Airlines',        flag: '🇯🇵' },
  { icao: 'THY', iata: 'TK', name: 'Turkish Airlines',      flag: '🇹🇷' },
  { icao: 'ETH', iata: 'ET', name: 'Ethiopian Airlines',    flag: '🇪🇹' },
  { icao: 'QTR', iata: 'QR', name: 'Qatar Airways',         flag: '🇶🇦' },
  { icao: 'ETD', iata: 'EY', name: 'Etihad Airways',        flag: '🇦🇪' },
  { icao: 'ASA', iata: 'AS', name: 'Alaska Airlines',       flag: '🇺🇸' },
  { icao: 'JBU', iata: 'B6', name: 'JetBlue',               flag: '🇺🇸' },
];

const POPULAR_AIRPORTS = [
  'KEWR','KJFK','KLAX','KORD','KATL','KDFW','KSFO','KDEN','KIAH','KMIA',
  'EGLL','LFPG','EDDF','LEMD','LIRF','EHAM','OMDB','VHHH','WSSS','RJTT',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return { utc: '—', local: '—' };
  const utc = new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
  const local = new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { utc: utc + 'Z', local };
}

function statusColor(status = '', cancelled, diverted) {
  if (cancelled) return 'text-red-400 bg-red-500/10';
  if (diverted)  return 'text-orange-400 bg-orange-500/10';
  const s = status.toLowerCase();
  if (s.includes('en route'))  return 'text-sky-400 bg-sky-500/10';
  if (s.includes('arrived') || s.includes('landed')) return 'text-emerald-400 bg-emerald-500/10';
  if (s.includes('delayed'))   return 'text-amber-400 bg-amber-500/10';
  if (s.includes('scheduled')) return 'text-gray-400 bg-gray-500/10';
  return 'text-blue-400 bg-blue-500/10';
}

function getDelay(flight, mode) {
  const raw = mode === 'arrivals' ? flight.arrival_delay : flight.departure_delay;
  return raw ? Math.round(raw / 60) : 0;
}

// ── Flight Detail Panel ───────────────────────────────────────────────────────
function FlightDetail({ flight, onClose }) {
  const ident = flight.ident_icao || flight.ident || '';
  const faUrl = `https://www.flightaware.com/live/flight/${encodeURIComponent(ident)}`;
  const origin = flight.origin?.code_icao || flight.origin?.code || '—';
  const dest   = flight.destination?.code_icao || flight.destination?.code || '—';

  const rows = [
    ['Flight',        flight.ident_iata || flight.ident],
    ['ICAO Ident',    flight.ident_icao],
    ['Registration',  flight.registration],
    ['Aircraft Type', flight.aircraft_type],
    ['Operator',      flight.operator],
    ['Origin',        `${origin} — ${flight.origin?.name || ''}`],
    ['Destination',   `${dest} — ${flight.destination?.name || ''}`],
    ['Status',        flight.cancelled ? 'CANCELLED' : flight.diverted ? 'DIVERTED' : flight.status],
    ['Sched Dep',     fmtTime(flight.scheduled_out || flight.scheduled_off).utc],
    ['Sched Dep LT',  fmtTime(flight.scheduled_out || flight.scheduled_off).local],
    ['Actual Dep',    fmtTime(flight.actual_out || flight.actual_off).utc],
    ['Actual Dep LT', fmtTime(flight.actual_out || flight.actual_off).local],
    ['Sched Arr',     fmtTime(flight.scheduled_in || flight.scheduled_on).utc],
    ['Sched Arr LT',  fmtTime(flight.scheduled_in || flight.scheduled_on).local],
    ['Est Arr',       fmtTime(flight.estimated_in || flight.estimated_on).utc],
    ['Est Arr LT',    fmtTime(flight.estimated_in || flight.estimated_on).local],
    ['Actual Arr',    fmtTime(flight.actual_in || flight.actual_on).utc],
    ['Actual Arr LT', fmtTime(flight.actual_in || flight.actual_on).local],
    ['Dep Delay',     flight.departure_delay ? `${Math.round(flight.departure_delay/60)} min` : '—'],
    ['Arr Delay',     flight.arrival_delay   ? `${Math.round(flight.arrival_delay/60)} min` : '—'],
    ['Route Dist',    flight.route_distance  ? `${flight.route_distance} nm` : '—'],
    ['Runway Off',    flight.actual_runway_off],
    ['Runway On',     flight.actual_runway_on],
    ['Progress',      flight.progress_percent != null ? `${flight.progress_percent}%` : '—'],
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center bg-black/80 p-3 pt-24">
      <div className="w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
              <Plane className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">{flight.ident_iata || flight.ident}</p>
              <p className="text-[10px] text-gray-500">{origin} → {dest}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={faUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20">
              <ExternalLink className="w-3 h-3" /> FlightAware
            </a>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {flight.progress_percent != null && (
          <div className="px-5 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5">
              <span className="font-mono font-bold text-white">{origin}</span>
              <span className="text-sky-400 font-bold">{flight.progress_percent}% complete</span>
              <span className="font-mono font-bold text-white">{dest}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all"
                style={{ width: `${flight.progress_percent}%` }} />
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[10px]">✈</span>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-1">
            {rows.filter(([, v]) => v && v !== '—').map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-[11px] text-gray-500">{label}</span>
                <span className="text-[11px] font-bold text-white">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Flight Table Row ──────────────────────────────────────────────────────────
function FlightRow({ flight, mode, onSelect }) {
  const origin = flight.origin?.code_icao || flight.origin?.code || '—';
  const dest   = flight.destination?.code_icao || flight.destination?.code || '—';
  const delay  = getDelay(flight, mode);
  const sc = statusColor(flight.status, flight.cancelled, flight.diverted);

  const scheduledTime = mode === 'arrivals'
    ? (flight.scheduled_in  || flight.scheduled_on)
    : (flight.scheduled_out || flight.scheduled_off);
  const actualTime = mode === 'arrivals'
    ? (flight.actual_in  || flight.actual_on)
    : (flight.actual_out || flight.actual_off);
  const estimatedTime = mode === 'arrivals'
    ? (flight.estimated_in  || flight.estimated_on)
    : (flight.estimated_out || flight.estimated_off);

  return (
    <tr onClick={() => onSelect(flight)}
      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
      <td className="px-4 py-3 font-mono font-extrabold text-primary text-sm whitespace-nowrap">
        {flight.ident_iata || flight.ident || '—'}
      </td>
      <td className="px-3 py-3 text-xs text-cyan-400 font-mono">{flight.registration || '—'}</td>
      <td className="px-3 py-3 text-xs text-gray-400">{origin}</td>
      <td className="px-3 py-3 text-xs text-gray-400">{dest}</td>
      <td className="px-3 py-3 text-xs text-gray-500">{flight.aircraft_type || '—'}</td>
      <td className="px-3 py-3">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap', sc)}>
          {flight.cancelled ? 'CANCELLED' : flight.diverted ? 'DIVERTED' : (flight.status || '—')}
        </span>
      </td>
      <td className="px-3 py-3 text-xs whitespace-nowrap">
        {(() => {
          const t = actualTime ? fmtTime(actualTime) : estimatedTime ? fmtTime(estimatedTime) : fmtTime(scheduledTime);
          const colorClass = actualTime ? 'text-emerald-400' : estimatedTime ? 'text-amber-400' : 'text-gray-400';
          return (
            <div className="flex flex-col gap-0.5">
              <span className={colorClass}>{t.utc}</span>
              <span className="text-sky-400 text-xs">{t.local} LT</span>
            </div>
          );
        })()}
      </td>
      <td className="px-3 py-3 text-xs whitespace-nowrap">
        {flight.gate_origin
          ? <span className="text-sky-400 font-extrabold bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">{flight.gate_origin}</span>
          : <span className="text-gray-600">—</span>}
      </td>
      <td className="px-3 py-3 text-xs whitespace-nowrap">
        {flight.gate_destination
          ? <span className="text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">{flight.gate_destination}</span>
          : <span className="text-gray-600">—</span>}
      </td>
      <td className="px-3 py-3 text-xs whitespace-nowrap">
        {delay > 1 ? <span className="text-orange-400 font-bold">+{delay}m</span> :
         delay < -1 ? <span className="text-green-400 font-bold">{delay}m</span> :
         <span className="text-gray-600">On time</span>}
      </td>
      <td className="px-3 py-3">
        <a href={`https://www.flightaware.com/live/flight/${encodeURIComponent(flight.ident_icao || flight.ident || '')}`}
          target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/30 transition-colors">
          <ExternalLink className="w-3 h-3 text-amber-400" />
        </a>
      </td>
    </tr>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color + '/20')}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className="text-xl font-black text-white">{value}</p>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LiveFlightTracker() {
  const [mode, setMode]               = useState('airline');   // 'airline' | 'airport' | 'search'
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [customAirline, setCustomAirline]     = useState('');
  const [activeAirlineIcao, setActiveAirlineIcao] = useState(''); // fired on demand
  const [airport, setAirport]         = useState('KEWR');
  const [airportInput, setAirportInput] = useState('KEWR');
  const [airportTab, setAirportTab]   = useState('departures');
  const [airportAirlineFilter, setAirportAirlineFilter] = useState(''); // sub-filter for airport mode
  const [searchIdent, setSearchIdent] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showAirlineList, setShowAirlineList] = useState(false);

  // ── Airline enroute flights ──
  const { data: airlineData, isLoading: airlineLoading, refetch: refetchAirline, error: airlineError } = useQuery({
    queryKey: ['fa-airline', activeAirlineIcao],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareSearch', {
        type: 'airline_enroute',
        airline_icao: activeAirlineIcao,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data?.flights || [];
    },
    enabled: mode === 'airline' && !!activeAirlineIcao,
    refetchInterval: 120000,
    staleTime: 60000,
  });

  // ── Airport board ──
  const { data: airportData, isLoading: airportLoading, refetch: refetchAirport, error: airportError } = useQuery({
    queryKey: ['fa-airport', airport],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareSearch', {
        type: 'airport_board',
        airport,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data || { departures: [], arrivals: [] };
    },
    enabled: !!airport && airport.length === 4,
    refetchInterval: 120000,
    staleTime: 60000,
    refetchOnMount: true,
  });

  // ── Direct search ──
  const { data: searchData, isLoading: searchLoading, refetch: refetchSearch, error: searchError } = useQuery({
    queryKey: ['fa-search', searchIdent],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareSearch', {
        type: 'search_flight',
        ident: searchIdent,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data?.flights || [];
    },
    enabled: mode === 'search' && !!searchIdent,
    staleTime: 60000,
  });

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchIdent(searchInput.trim().toUpperCase());
      setMode('search');
    }
  };

  // Helper to fire the airline fetch
  const fetchAirline = useCallback((icao) => {
    if (icao) setActiveAirlineIcao(icao);
  }, []);

  // Auto-load United on mount
  useEffect(() => {
    setSelectedAirline(POPULAR_AIRLINES[0]);
    setActiveAirlineIcao(POPULAR_AIRLINES[0].icao);
  }, []);

  // Derive display data
  const rawAirportFlights = airportTab === 'departures' ? (airportData?.departures || []) : (airportData?.arrivals || []);
  const displayFlights = mode === 'airline' ? (airlineData || [])
    : mode === 'search' ? (searchData || [])
    : airportAirlineFilter
      ? rawAirportFlights.filter(f => {
          const op = f.operator || f.ident_iata?.substring(0, 2) || '';
          return op === airportAirlineFilter;
        })
      : rawAirportFlights;

  // All airlines available in the current airport board (both deps + arrs)
  const airportAirlines = Array.from(new Set(
    [...(airportData?.departures || []), ...(airportData?.arrivals || [])]
      .map(f => f.operator || f.ident_iata?.substring(0, 2))
      .filter(Boolean)
  )).sort();

  const isLoading = mode === 'airline' ? airlineLoading
    : mode === 'airport' ? airportLoading
    : searchLoading;

  const error = mode === 'airline' ? airlineError
    : mode === 'airport' ? airportError
    : searchError;

  const refetch = mode === 'airline' ? refetchAirline
    : mode === 'airport' ? refetchAirport
    : refetchSearch;

  // KPIs
  const enroute   = displayFlights.filter(f => (f.status || '').toLowerCase().includes('en route')).length;
  const delayed   = displayFlights.filter(f => (f.departure_delay > 300) || (f.arrival_delay > 300)).length;
  const cancelled = displayFlights.filter(f => f.cancelled).length;
  const onTime    = displayFlights.length - delayed - cancelled;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">

      {/* ── HEADER ── */}
      <div className="border-b border-white/10 bg-[#0a0e18] px-5 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-sky-400 tracking-widest uppercase">Live Flight Tracker</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Powered by FlightAware AeroAPI · Real-Time</p>
            </div>
          </div>

          {/* Global search bar */}
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Flight # or tail (e.g. UAL1324)"
                className="bg-[#141922] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-sky-500/50 w-64 font-mono uppercase"
              />
            </div>
            <button onClick={handleSearch}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Search
            </button>
            <button onClick={() => refetch()}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mode selector tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'airline',  label: 'By Airline',  icon: Building2 },
            { key: 'airport',  label: 'By Airport',  icon: MapPin },
            { key: 'search',   label: 'Flight Search', icon: Search },
          ].map(({ key, label, icon: TabIcon }) => (
            <button key={key} onClick={() => setMode(key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                mode === key ? 'bg-sky-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
              <TabIcon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">

        {/* ── AIRLINE MODE ── */}
        {mode === 'airline' && (
          <div className="space-y-4">
            {/* Airline selector */}
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" /> Select Airline
                </p>
                <button onClick={() => setShowAirlineList(v => !v)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                  {showAirlineList ? 'Hide' : 'Show all'}
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAirlineList && 'rotate-180')} />
                </button>
              </div>

              {/* Popular quick-picks */}
              <div className="flex flex-wrap gap-2">
                {POPULAR_AIRLINES.slice(0, showAirlineList ? POPULAR_AIRLINES.length : 10).map(a => (
                  <button key={a.icao}
                    onClick={() => {
                      setSelectedAirline(a);
                      setCustomAirline('');
                      fetchAirline(a.icao);
                    }}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      activeAirlineIcao === a.icao
                        ? 'bg-sky-600 text-white border-sky-500'
                        : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20')}>
                    <span>{a.flag}</span>{a.iata} — {a.name}
                  </button>
                ))}
              </div>

              {/* Custom airline input */}
              <div className="flex gap-2 items-center">
                <input
                  value={customAirline}
                  onChange={e => { setCustomAirline(e.target.value.toUpperCase()); setSelectedAirline(null); }}
                  onKeyDown={e => e.key === 'Enter' && customAirline.length >= 2 && fetchAirline(customAirline)}
                  placeholder="Custom ICAO code (e.g. AEX)"
                  className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-sky-500/50 font-mono uppercase"
                />
                <button
                  onClick={() => customAirline.length >= 2 && fetchAirline(customAirline)}
                  disabled={customAirline.length < 2}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Fetch
                </button>
                {selectedAirline && activeAirlineIcao === selectedAirline.icao && (
                  <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2 flex-shrink-0">
                    <span>{selectedAirline.flag}</span>
                    <span className="text-xs font-bold text-sky-300">{selectedAirline.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── AIRPORT MODE ── */}
        {mode === 'airport' && (
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" /> Select Airport
            </p>

            {/* ICAO input + Load button */}
            <div className="flex gap-2">
              <input
                value={airportInput}
                onChange={e => setAirportInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter' && airportInput.length === 4) { setAirport(airportInput); setAirportAirlineFilter(''); } }}
                placeholder="ICAO e.g. KEWR"
                maxLength={4}
                className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-sky-500/50 font-mono uppercase"
              />
              <button
                onClick={() => { setAirport(airportInput); setAirportAirlineFilter(''); }}
                disabled={airportInput.length !== 4}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 disabled:opacity-40 transition-colors flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Load
              </button>
            </div>

            {/* Popular airport quick-picks — clicking immediately loads */}
            <div className="flex flex-wrap gap-2">
              {POPULAR_AIRPORTS.map(ap => (
                <button key={ap} onClick={() => { setAirport(ap); setAirportInput(ap); setAirportAirlineFilter(''); }}
                  className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all',
                    airport === ap
                      ? 'bg-sky-600 text-white border-transparent'
                      : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20')}>
                  {ap}
                </button>
              ))}
            </div>

            {/* Departures / Arrivals tabs */}
            <div className="flex gap-2">
              {['departures', 'arrivals'].map(t => (
                <button key={t} onClick={() => setAirportTab(t)}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                    airportTab === t ? 'bg-sky-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
                  {t === 'departures' ? <PlaneTakeoff className="w-3.5 h-3.5" /> : <PlaneLanding className="w-3.5 h-3.5" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {airportData && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-black',
                      airportTab === t ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400')}>
                      {t === 'departures' ? (airportData.departures?.length || 0) : (airportData.arrivals?.length || 0)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Airline sub-filter — only shown when data is available */}
            {airportAirlines.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Filter by Airline
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setAirportAirlineFilter('')}
                    className={cn('px-3 py-1 rounded-lg text-[10px] font-bold border transition-all',
                      !airportAirlineFilter ? 'bg-sky-600 text-white border-transparent' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20')}>
                    All ({rawAirportFlights.length})
                  </button>
                  {airportAirlines.map(airline => {
                    const count = rawAirportFlights.filter(f => (f.operator || f.ident_iata?.substring(0, 2)) === airline).length;
                    return (
                      <button key={airline}
                        onClick={() => setAirportAirlineFilter(airportAirlineFilter === airline ? '' : airline)}
                        className={cn('px-3 py-1 rounded-lg text-[10px] font-bold border transition-all',
                          airportAirlineFilter === airline
                            ? 'bg-sky-600 text-white border-transparent'
                            : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20')}>
                        {airline} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── KPI BAR ── */}
        {displayFlights.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard icon={Plane}        label="Total Flights"  value={displayFlights.length} color="text-sky-400" />
            <KpiCard icon={Activity}     label="En Route"       value={enroute}               color="text-green-400" />
            <KpiCard icon={Clock}        label="Delayed"        value={delayed}               color="text-amber-400" />
            <KpiCard icon={AlertTriangle}label="Cancelled"      value={cancelled}             color="text-red-400" />
          </div>
        )}

        {/* ── FLIGHTS TABLE ── */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <p className="text-sm font-extrabold text-white flex items-center gap-2">
              <Plane className="w-4 h-4 text-sky-400" />
              {mode === 'airline' && selectedAirline ? `${selectedAirline.flag} ${selectedAirline.name} — Enroute` :
               mode === 'airline' && customAirline ? `${customAirline} — Enroute` :
               mode === 'airport' ? `${airport} ${airportTab === 'departures' ? 'Departures' : 'Arrivals'}${airportAirlineFilter ? ` · ${airportAirlineFilter}` : ''}` :
               mode === 'search' ? `Search: ${searchIdent}` : 'Select a source above'}
            </p>
            {isLoading && <Loader className="w-4 h-4 text-sky-400 animate-spin" />}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader className="w-6 h-6 text-sky-400 animate-spin" />
              <p className="text-gray-400">Loading live flight data…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <p className="text-red-300 text-sm font-bold">
                {error.message?.includes('429') ? 'API Rate Limit Reached' : 'Failed to load'}
              </p>
              <p className="text-gray-500 text-xs text-center max-w-xs">
                {error.message?.includes('429')
                  ? 'FlightAware API quota exhausted. Please wait a few minutes and retry.'
                  : error.message}
              </p>
              <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors">Retry</button>
            </div>
          ) : displayFlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <Globe className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">
                {mode === 'airline' && !activeAirlineIcao ? 'Select an airline above to view live flights' :
                 mode === 'search' && !searchIdent ? 'Enter a flight number or tail number to search' :
                 'No flights found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Flight','Tail','Origin','Destination','A/C Type','Status','Time','Dep Gate','Arr Gate','Delay','FA'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap first:px-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayFlights.map((f, i) => (
                    <FlightRow key={f.fa_flight_id || i} flight={f}
                      mode={mode === 'airport' ? airportTab : 'departures'}
                      onSelect={setSelectedFlight} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {displayFlights.length > 0 && (
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
              <p className="text-[10px] text-gray-600">{displayFlights.length} flights · Auto-refreshes every 2 min · Click row for details</p>
              <a href="https://www.flightaware.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
                <ExternalLink className="w-3 h-3" /> FlightAware.com
              </a>
            </div>
          )}
        </div>
      </div>

      {selectedFlight && (
        <FlightDetail flight={selectedFlight} onClose={() => setSelectedFlight(null)} />
      )}
    </div>
  );
}