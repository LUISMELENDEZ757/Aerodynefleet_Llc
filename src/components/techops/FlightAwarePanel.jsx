import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, PlaneLanding, PlaneTakeoff, ExternalLink, Search, RefreshCw, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Airline ICAO → FlightAware operator code mapping ─────────────────────────
// FlightAware uses ICAO 3-letter airline codes in their URLs
const AIRLINE_FA_CODE = {
  // Common US carriers
  'AAL': 'AAL', 'DAL': 'DAL', 'UAL': 'UAL', 'SWA': 'SWA', 'ASA': 'ASA',
  'JBU': 'JBU', 'FFT': 'FFT', 'NKS': 'NKS', 'SKW': 'SKW', 'RPA': 'RPA',
  'ASQ': 'ASQ', 'OO': 'SKW', 'EV': 'ASQ', 'MQ': 'EGF',
  // International
  'BAW': 'BAW', 'AFR': 'AFR', 'DLH': 'DLH', 'UAE': 'UAE', 'QFA': 'QFA',
  'SIA': 'SIA', 'CPA': 'CPA', 'KAL': 'KAL', 'ANA': 'ANA', 'JAL': 'JAL',
  // Aerodyne fleets — map to their ICAO codes
  'AEX': 'AEX', 'ADY': 'ADY',
};

// Build a FlightAware URL for a tail number
function tailUrl(tail) {
  return `https://www.flightaware.com/live/flight/${encodeURIComponent(tail)}`;
}

// Build a FlightAware URL for an airline flight number
function flightUrl(icao, number) {
  return `https://www.flightaware.com/live/flight/${encodeURIComponent(icao + number)}`;
}

// Build a FlightAware airport arrivals/departures URL
function airportUrl(icao, type = 'departures') {
  return `https://www.flightaware.com/live/airport/${encodeURIComponent(icao)}`;
}

const STATUS_COLOR = {
  scheduled:  'text-gray-400',
  boarding:   'text-blue-400',
  departed:   'text-amber-400',
  airborne:   'text-sky-400',
  arrived:    'text-emerald-400',
  cancelled:  'text-red-400',
  delayed:    'text-orange-400',
  on_time:    'text-green-400',
  landed:     'text-emerald-400',
};

function FlightRow({ flight, airline }) {
  // Derive FlightAware operator code from fleet ICAO
  const icao = AIRLINE_FA_CODE[airline?.icao_code] || airline?.icao_code || '';
  // Strip the airline prefix from flight_number if it contains it
  const rawNum = flight.flight_number?.replace(/^[A-Z]{2,3}\s*/, '') || '';
  const faUrl = icao ? flightUrl(icao, rawNum) : tailUrl(flight.aircraft_tail || '');

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-primary font-mono">{flight.flight_number || '—'}</span>
          {flight.aircraft_tail && (
            <span className="text-xs font-mono text-cyan-400">{flight.aircraft_tail}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />{flight.origin || '—'}
          </span>
          <span className="text-gray-600">→</span>
          <span className="text-xs text-gray-400">{flight.destination || '—'}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-bold uppercase', STATUS_COLOR[flight.status] || 'text-gray-400')}>
            {flight.status?.replace('_', ' ') || '—'}
          </span>
          {flight.delay_minutes > 0 && (
            <span className="text-[10px] text-orange-400">+{flight.delay_minutes}m</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 justify-end">
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="text-[10px] text-gray-500">
            {flight.scheduled_departure || flight.scheduled_arrival || '—'}Z
          </span>
        </div>
      </div>
      <a href={faUrl} target="_blank" rel="noopener noreferrer"
        className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/30 transition-colors flex-shrink-0"
        title="Track on FlightAware">
        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
      </a>
    </div>
  );
}

export default function FlightAwarePanel({ onClose }) {
  const [tailSearch, setTailSearch] = useState('');
  const [flightSearch, setFlightSearch] = useState('');
  const [stationSearch, setStationSearch] = useState('');
  const [activeTab, setActiveTab] = useState('arrivals');

  const today = new Date().toISOString().split('T')[0];

  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ['fa-flights'],
    queryFn: () => base44.entities.Flight.filter({ flight_date: today }, '-scheduled_departure', 200),
    refetchInterval: 60000,
  });

  const { data: fleets = [] } = useQuery({
    queryKey: ['fa-fleets'],
    queryFn: () => base44.entities.Fleet.list('name', 50),
  });

  // Map airline name → fleet object for ICAO lookup
  const fleetByName = {};
  fleets.forEach(f => { fleetByName[f.name] = f; });

  // Filter flights
  const arrivals   = flights.filter(f => !['scheduled','boarding','departed','airborne'].includes(f.status) || f.actual_arrival);
  const departures = flights.filter(f => ['scheduled','boarding','departed','airborne','delayed','on_time'].includes(f.status));

  const filterFlights = (list) => list.filter(f => {
    const matchTail   = !tailSearch   || (f.aircraft_tail   || '').toLowerCase().includes(tailSearch.toLowerCase());
    const matchFlt    = !flightSearch || (f.flight_number   || '').toLowerCase().includes(flightSearch.toLowerCase());
    const matchSta    = !stationSearch|| (f.origin || '').toLowerCase().includes(stationSearch.toLowerCase()) ||
                                         (f.destination || '').toLowerCase().includes(stationSearch.toLowerCase());
    return matchTail && matchFlt && matchSta;
  });

  const displayed = filterFlights(activeTab === 'arrivals' ? arrivals : departures);

  // Direct tail/flight search → FlightAware link
  const directTailUrl  = tailSearch.length >= 4   ? tailUrl(tailSearch.toUpperCase()) : null;
  const directFlightUrl = flightSearch.length >= 3 ? `https://www.flightaware.com/live/flight/${encodeURIComponent(flightSearch.toUpperCase())}` : null;
  const directAirportUrl = stationSearch.length >= 3 ? airportUrl(stationSearch.toUpperCase()) : null;

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
              <p className="text-sm font-extrabold text-white uppercase tracking-wide">Flight Arrivals & Departures</p>
              <p className="text-[10px] text-gray-500">Live data via FlightAware · Today's Ops</p>
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

        {/* Search bar */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={tailSearch}
                onChange={e => setTailSearch(e.target.value)}
                placeholder="Tail # e.g. N455GJ"
                className="w-full bg-[#141922] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={flightSearch}
                onChange={e => setFlightSearch(e.target.value)}
                placeholder="Flight # e.g. AA100"
                className="w-full bg-[#141922] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={stationSearch}
                onChange={e => setStationSearch(e.target.value)}
                placeholder="Station e.g. KEWR"
                className="w-full bg-[#141922] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Quick FlightAware direct links */}
          <div className="flex flex-wrap gap-2">
            {directTailUrl && (
              <a href={directTailUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors">
                <ExternalLink className="w-3 h-3" /> Track {tailSearch.toUpperCase()} on FlightAware
              </a>
            )}
            {directFlightUrl && (
              <a href={directFlightUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full hover:bg-sky-500/20 transition-colors">
                <ExternalLink className="w-3 h-3" /> Track {flightSearch.toUpperCase()} on FlightAware
              </a>
            )}
            {directAirportUrl && (
              <a href={directAirportUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-colors">
                <ExternalLink className="w-3 h-3" /> {stationSearch.toUpperCase()} Airport on FlightAware
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-1 flex-shrink-0">
          {[
            { key: 'arrivals',   label: 'Arrivals',   icon: PlaneLanding,  count: filterFlights(arrivals).length },
            { key: 'departures', label: 'Departures', icon: PlaneTakeoff,  count: filterFlights(departures).length },
          ].map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-black',
                activeTab === key ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400')}>
                {count}
              </span>
            </button>
          ))}

          {/* Airline FlightAware quick-links */}
          {fleets.length > 0 && (
            <div className="ml-auto flex gap-1">
              {fleets.slice(0, 4).map(fleet => {
                const code = AIRLINE_FA_CODE[fleet.icao_code] || fleet.icao_code;
                if (!code) return null;
                return (
                  <a key={fleet.id}
                    href={`https://www.flightaware.com/live/fleet/${encodeURIComponent(code)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
                    title={`${fleet.name} fleet on FlightAware`}>
                    {fleet.icao_code}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Flight list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-gray-500 text-sm py-10">Loading today's flights…</div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-gray-500 text-sm">No flights found</p>
              <p className="text-gray-600 text-xs">Use the search above or open FlightAware directly</p>
              <a href="https://www.flightaware.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-500/20 mt-2">
                <ExternalLink className="w-3.5 h-3.5" /> Open FlightAware.com
              </a>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {displayed.map(f => (
                <FlightRow key={f.id} flight={f} airline={fleetByName[f.airline]} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] text-gray-600">
            Showing {displayed.length} flight{displayed.length !== 1 ? 's' : ''} · {today}
          </p>
          <a href="https://www.flightaware.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
            <ExternalLink className="w-3 h-3" /> FlightAware.com
          </a>
        </div>
      </div>
    </div>
  );
}