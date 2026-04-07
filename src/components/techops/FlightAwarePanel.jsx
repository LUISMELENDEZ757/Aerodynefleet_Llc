import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  X, PlaneLanding, PlaneTakeoff, ExternalLink, Search,
  RefreshCw, Clock, MapPin, AlertTriangle, Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '—';
  const utc = new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
  const local = new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { utc: utc + 'Z', local };
}

function statusColor(status = '') {
  const s = status.toLowerCase();
  if (s.includes('cancelled')) return 'text-red-400';
  if (s.includes('diverted'))  return 'text-orange-400';
  if (s.includes('delayed'))   return 'text-amber-400';
  if (s.includes('en route'))  return 'text-sky-400';
  if (s.includes('arrived') || s.includes('landed')) return 'text-emerald-400';
  if (s.includes('scheduled')) return 'text-gray-400';
  return 'text-blue-400';
}

// ── Flight Row ─────────────────────────────────────────────────────────────────
function FlightRow({ flight, mode }) {
  const ident = flight.ident_icao || flight.ident || '';
  const faUrl = `https://www.flightaware.com/live/flight/${encodeURIComponent(ident)}`;
  const origin = flight.origin?.code_icao || flight.origin?.code || '—';
  const dest   = flight.destination?.code_icao || flight.destination?.code || '—';
  const tail   = flight.registration || '—';

  const scheduledTime = mode === 'arrivals'
    ? (flight.scheduled_in || flight.scheduled_on)
    : (flight.scheduled_out || flight.scheduled_off);
  const actualTime = mode === 'arrivals'
    ? (flight.actual_in || flight.actual_on)
    : (flight.actual_out || flight.actual_off);
  const estimatedTime = mode === 'arrivals'
    ? (flight.estimated_in || flight.estimated_on)
    : (flight.estimated_out || flight.estimated_off);

  const delayMin = mode === 'arrivals'
    ? flight.arrival_delay
    : flight.departure_delay;
  const delayMins = delayMin ? Math.round(delayMin / 60) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-primary font-mono">
            {flight.ident_iata || flight.ident || '—'}
          </span>
          <span className="text-xs font-mono text-cyan-400">{tail}</span>
          {flight.aircraft_type && (
            <span className="text-[10px] text-gray-600">{flight.aircraft_type}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
          <span className="text-xs text-gray-400">{origin}</span>
          <span className="text-gray-600 text-xs">→</span>
          <span className="text-xs text-gray-400">{dest}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0 space-y-0.5">
        <div className={cn('text-[10px] font-bold', statusColor(flight.status))}>
          {flight.cancelled ? 'CANCELLED' : flight.diverted ? 'DIVERTED' : (flight.status || '—')}
        </div>
        <div className="text-[10px] text-gray-500 flex flex-col items-end gap-0.5">
          {(() => {
            const t = actualTime ? fmtTime(actualTime) : estimatedTime ? fmtTime(estimatedTime) : fmtTime(scheduledTime);
            const colorClass = actualTime ? 'text-emerald-400' : estimatedTime ? 'text-amber-400' : 'text-gray-400';
            if (!t || t === '—') return <span>—</span>;
            return (
              <>
                <span className={`flex items-center gap-1 ${colorClass}`}>
                  <Clock className="w-2.5 h-2.5" />{t.utc}
                </span>
                <span className="text-sky-400">{t.local} LT</span>
              </>
            );
          })()}
        </div>
        {delayMins > 1 && (
          <div className="text-[10px] text-orange-400 font-bold">+{delayMins}m delay</div>
        )}
        {delayMins < -1 && (
          <div className="text-[10px] text-green-400 font-bold">{delayMins}m early</div>
        )}
      </div>

      <a href={faUrl} target="_blank" rel="noopener noreferrer"
        className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/30 transition-colors flex-shrink-0"
        title="Track on FlightAware">
        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
      </a>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function FlightAwarePanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('departures');
  const [airport, setAirport]     = useState('KEWR');
  const [airlineFilter, setAirlineFilter] = useState('');
  const [tailSearch, setTailSearch]       = useState('');
  const [flightSearch, setFlightSearch]   = useState('');
  const [searchResult, setSearchResult]   = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState(null);

  // Load airport departures
  const { data: depData, isLoading: depLoading, refetch: refetchDep, error: depError } = useQuery({
    queryKey: ['fa-departures', airport, airlineFilter],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareProxy', {
        type: 'airport_departures',
        airport: airport.toUpperCase(),
        ...(airlineFilter ? { airline_icao: airlineFilter.toUpperCase() } : {}),
      });
      return res.data?.departures || [];
    },
    enabled: !!airport && activeTab === 'departures',
    refetchInterval: 120000,
    staleTime: 60000,
  });

  // Load airport arrivals
  const { data: arrData, isLoading: arrLoading, refetch: refetchArr, error: arrError } = useQuery({
    queryKey: ['fa-arrivals', airport, airlineFilter],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareProxy', {
        type: 'airport_arrivals',
        airport: airport.toUpperCase(),
        ...(airlineFilter ? { airline_icao: airlineFilter.toUpperCase() } : {}),
      });
      return res.data?.arrivals || [];
    },
    enabled: !!airport && activeTab === 'arrivals',
    refetchInterval: 120000,
    staleTime: 60000,
  });

  const flights = activeTab === 'departures' ? (depData || []) : (arrData || []);
  const isLoading = activeTab === 'departures' ? depLoading : arrLoading;
  const error = activeTab === 'departures' ? depError : arrError;
  const refetch = activeTab === 'departures' ? refetchDep : refetchArr;

  // Direct flight/tail search
  const handleSearch = async () => {
    const ident = (flightSearch || tailSearch).trim().toUpperCase();
    if (!ident) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const res = await base44.functions.invoke('flightAwareProxy', { type: 'flight', ident });
      setSearchResult(res.data?.flights || []);
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <PlaneLanding className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white uppercase tracking-wide">Arrivals & Departures</p>
              <p className="text-[10px] text-gray-500">Live data via FlightAware AeroAPI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Airport + Airline filter */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Airport (ICAO)</label>
              <div className="flex gap-2">
                <input
                  value={airport}
                  onChange={e => setAirport(e.target.value.toUpperCase())}
                  placeholder="KEWR"
                  maxLength={4}
                  className="flex-1 bg-[#141922] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50 font-mono uppercase"
                />
                <button onClick={() => refetch()}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                  Load
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Filter by Airline (ICAO)</label>
              <input
                value={airlineFilter}
                onChange={e => setAirlineFilter(e.target.value.toUpperCase())}
                placeholder="e.g. UAL, AAL, DAL"
                className="w-full bg-[#141922] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50 font-mono uppercase"
              />
            </div>
          </div>

          {/* Direct flight / tail search */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Track Flight # or Tail #</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  value={flightSearch || tailSearch}
                  onChange={e => { setFlightSearch(e.target.value); setTailSearch(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. UAL1324 or N27271"
                  className="w-full bg-[#141922] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50 font-mono uppercase"
                />
              </div>
              <button onClick={handleSearch} disabled={searchLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {searchLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Search
              </button>
            </div>
          </div>

          {/* Search results */}
          {searchError && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{searchError}</p>
            </div>
          )}
          {searchResult && (
            <div className="bg-[#141922] border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <p className="text-xs font-bold text-white">Search Results ({searchResult.length})</p>
                <button onClick={() => setSearchResult(null)} className="text-gray-500 hover:text-white text-xs">✕ Clear</button>
              </div>
              {searchResult.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No flights found</p>
              ) : (
                searchResult.slice(0, 5).map((f, i) => (
                  <FlightRow key={i} flight={f} mode="departures" />
                ))
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2 flex-shrink-0">
          {[
            { key: 'departures', label: 'Departures', icon: PlaneTakeoff },
            { key: 'arrivals',   label: 'Arrivals',   icon: PlaneLanding },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {!isLoading && (
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-black',
                  activeTab === key ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400')}>
                  {flights.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Flight list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader className="w-5 h-5 text-amber-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading live data from FlightAware…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <p className="text-sm text-red-300">Failed to load flights</p>
              <p className="text-xs text-gray-500">{error.message}</p>
              <button onClick={() => refetch()} className="text-xs text-amber-400 underline">Retry</button>
            </div>
          ) : flights.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-gray-500 text-sm">No flights found for {airport}</p>
              <p className="text-gray-600 text-xs">Try a different airport or remove airline filter</p>
            </div>
          ) : (
            <div>
              {flights.map((f, i) => (
                <FlightRow key={f.fa_flight_id || i} flight={f} mode={activeTab} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] text-gray-600">
            {flights.length} flights · {airport} · Auto-refreshes every 2 min
          </p>
          <a href={`https://www.flightaware.com/live/airport/${airport}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
            <ExternalLink className="w-3 h-3" /> Open on FlightAware
          </a>
        </div>
      </div>
    </div>
  );
}