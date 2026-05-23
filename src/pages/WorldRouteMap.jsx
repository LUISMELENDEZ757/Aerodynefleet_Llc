import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Plane, RefreshCw, Search, Radio, AlertTriangle,
  MapPin, Activity, Clock, Filter, X, Globe, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Aircraft SVG icon ─────────────────────────────────────────────────────────
function makeAircraftIcon(heading = 0, color = '#f59e0b', size = 28) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <g transform="rotate(${heading}, 12, 12)">
        <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18.5 21 L12 17 L5.5 21 L8 13.5 L2 9 L9.5 9 Z"
          fill="${color}" stroke="white" stroke-width="1" opacity="0.9"/>
      </g>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Airport marker
function makeAirportIcon() {
  return L.divIcon({
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#22d3ee;border:2px solid white;box-shadow:0 0 8px rgba(34,211,238,0.7)"></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

// ── Map auto-fit ──────────────────────────────────────────────────────────────
function MapAutoFit({ flights }) {
  const map = useMap();
  useEffect(() => {
    const pts = flights.filter(f => f.lat && f.lon).map(f => [f.lat, f.lon]);
    if (pts.length >= 2) {
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 6 });
    }
  }, [flights.length]);
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const POPULAR_AIRLINES = [
  { icao: 'UAL', name: 'United', flag: '🇺🇸' },
  { icao: 'AAL', name: 'American', flag: '🇺🇸' },
  { icao: 'DAL', name: 'Delta', flag: '🇺🇸' },
  { icao: 'BAW', name: 'British', flag: '🇬🇧' },
  { icao: 'AFR', name: 'Air France', flag: '🇫🇷' },
  { icao: 'DLH', name: 'Lufthansa', flag: '🇩🇪' },
  { icao: 'UAE', name: 'Emirates', flag: '🇦🇪' },
  { icao: 'QTR', name: 'Qatar', flag: '🇶🇦' },
  { icao: 'SIA', name: 'Singapore', flag: '🇸🇬' },
  { icao: 'CPA', name: 'Cathay', flag: '🇭🇰' },
];

const MAJOR_AIRPORTS = [
  { icao: 'KEWR', name: 'Newark', lat: 40.6895, lon: -74.1745 },
  { icao: 'KJFK', name: 'JFK', lat: 40.6413, lon: -73.7781 },
  { icao: 'KLAX', name: 'LAX', lat: 33.9425, lon: -118.4081 },
  { icao: 'KORD', name: "O'Hare", lat: 41.9742, lon: -87.9073 },
  { icao: 'KATL', name: 'Atlanta', lat: 33.6407, lon: -84.4277 },
  { icao: 'EGLL', name: 'Heathrow', lat: 51.4700, lon: -0.4543 },
  { icao: 'EDDF', name: 'Frankfurt', lat: 50.0379, lon: 8.5622 },
  { icao: 'LFPG', name: 'CDG', lat: 49.0097, lon: 2.5479 },
  { icao: 'OMDB', name: 'Dubai', lat: 25.2532, lon: 55.3657 },
  { icao: 'WSSS', name: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { icao: 'VHHH', name: 'Hong Kong', lat: 22.3080, lon: 113.9185 },
  { icao: 'RJTT', name: 'Tokyo', lat: 35.5494, lon: 139.7798 },
  { icao: 'YSSY', name: 'Sydney', lat: -33.9399, lon: 151.1753 },
];

function statusColor(status) {
  if (!status) return '#6b7280';
  const s = status.toLowerCase();
  if (s.includes('en route') || s.includes('airborne')) return '#22c55e';
  if (s.includes('depart')) return '#f59e0b';
  if (s.includes('cancel')) return '#ef4444';
  return '#6b7280';
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorldRouteMap() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [mode, setMode] = useState('airline'); // 'airline' | 'airport'
  const [airline, setAirline] = useState('UAL');
  const [airport, setAirport] = useState('KEWR');
  const [airportInput, setAirportInput] = useState('KEWR');
  const [showAirports, setShowAirports] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedFlight(null);
    setTrackData(null);
    try {
      let res;
      if (mode === 'airline') {
        res = await base44.functions.invoke('flightAwareSearch', { type: 'airline_enroute', airline_icao: airline });
      } else {
        res = await base44.functions.invoke('flightAwareSearch', { type: 'airport_board', airport });
      }
      const raw = mode === 'airline'
        ? (res.data?.flights || [])
        : [...(res.data?.departures || []), ...(res.data?.arrivals || [])];
      // Extract lat/lon from last_position if available
      const mapped = raw.map(f => ({
        ...f,
        lat: f.last_position?.latitude ?? f.lat,
        lon: f.last_position?.longitude ?? f.lon,
        heading: f.last_position?.heading ?? f.heading,
        altitude: f.last_position?.altitude ?? f.altitude,
        groundspeed: f.last_position?.groundspeed ?? f.groundspeed,
      }));
      setFlights(mapped.filter(f => f.lat && f.lon));
    } catch (e) {
      setError(e.message?.includes('429') ? 'API rate limit reached. Please wait before retrying.' : (e.message || 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [mode, airline, airport]);

  useEffect(() => {
    fetchFlights();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchFlights, 120000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchFlights]);

  const fetchTrack = async (flight) => {
    setSelectedFlight(flight);
    setTrackData(null);
    setTrackLoading(true);
    try {
      const id = flight.fa_flight_id || flight.ident;
      const res = await base44.functions.invoke('flightAwareSearch', { type: 'flight_track', ident: id });
      const positions = res.data?.track?.positions || [];
      setTrackData(positions.map(p => [p.latitude, p.longitude]).filter(p => p[0] && p[1]));
    } catch {
      setTrackData([]);
    } finally {
      setTrackLoading(false);
    }
  };

  const airborne = flights.filter(f => (f.status || '').toLowerCase().includes('en route')).length;
  const airportIcon = makeAirportIcon();

  return (
    <div className="h-screen flex flex-col bg-[#080c12] text-white overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-white/8 flex-shrink-0 bg-[#0a0e18]">
        <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </Link>
        <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center">
          <Globe className="w-4 h-4 text-sky-400" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-extrabold text-white tracking-widest uppercase">World Route Map</p>
          <p className="text-[9px] text-gray-600 tracking-widest uppercase">Live Aircraft Tracking · FlightAware AeroAPI</p>
        </div>

        {/* KPIs */}
        <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
          <div className="text-center">
            <p className="text-sm font-black text-sky-400 leading-none">{flights.length}</p>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest">Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-green-400 leading-none">{airborne}</p>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest">Airborne</p>
          </div>
        </div>

        {/* Controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-[#111620] border border-white/10 rounded-lg p-0.5">
            <button onClick={() => setMode('airline')}
              className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-md transition-all',
                mode === 'airline' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:text-gray-300')}>
              Airline
            </button>
            <button onClick={() => setMode('airport')}
              className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-md transition-all',
                mode === 'airport' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:text-gray-300')}>
              Airport
            </button>
          </div>

          {/* Airline quick-picks */}
          {mode === 'airline' && (
            <select value={airline} onChange={e => setAirline(e.target.value)}
              className="bg-[#111620] border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-sky-500/50">
              {POPULAR_AIRLINES.map(a => (
                <option key={a.icao} value={a.icao}>{a.flag} {a.name} ({a.icao})</option>
              ))}
            </select>
          )}

          {/* Airport input */}
          {mode === 'airport' && (
            <input
              value={airportInput}
              onChange={e => setAirportInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter' && airportInput.length === 4) setAirport(airportInput); }}
              placeholder="ICAO"
              maxLength={4}
              className="w-20 bg-[#111620] border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono placeholder-gray-600 outline-none focus:border-sky-500/50"
            />
          )}

          {/* Airport overlay toggle */}
          <button onClick={() => setShowAirports(v => !v)}
            className={cn('flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all',
              showAirports ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'border-white/15 text-gray-500 hover:text-gray-300')}>
            <MapPin className="w-3 h-3" /> Airports
          </button>

          {/* Auto-refresh */}
          <button onClick={() => setAutoRefresh(v => !v)}
            className={cn('flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all',
              autoRefresh ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'border-white/15 text-gray-500 hover:text-gray-300')}>
            <Zap className="w-3 h-3" /> {autoRefresh ? 'Auto' : 'Manual'}
          </button>

          <button onClick={() => { if (mode === 'airport') setAirport(airportInput); fetchFlights(); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[10px] font-extrabold hover:bg-sky-500 disabled:opacity-50 transition-colors">
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3" />}
            {loading ? 'Loading…' : 'Fetch Live'}
          </button>
        </div>
      </div>

      {/* ── Body: Map + Side Panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {error && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-red-900/90 border border-red-500/50 rounded-xl px-4 py-2 flex items-center gap-2 max-w-md">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
              <button onClick={() => setError(null)}><X className="w-3.5 h-3.5 text-red-400 ml-2" /></button>
            </div>
          )}

          {loading && (
            <div className="absolute top-3 right-3 z-[1000] bg-[#0d1117]/90 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span className="text-xs text-sky-400 font-bold">Fetching positions…</span>
            </div>
          )}

          <MapContainer
            center={[30, 10]}
            zoom={3}
            style={{ height: '100%', width: '100%', background: '#0d1117' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
            />

            <MapAutoFit flights={flights} />

            {/* Major airport markers */}
            {showAirports && MAJOR_AIRPORTS.map(ap => (
              <Marker key={ap.icao} position={[ap.lat, ap.lon]} icon={airportIcon}>
                <Popup className="dark-popup">
                  <div className="bg-[#141922] text-white p-2 rounded-lg min-w-[100px]">
                    <p className="font-extrabold text-cyan-400 text-xs">{ap.icao}</p>
                    <p className="text-[10px] text-gray-400">{ap.name}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route lines from origin airport to current position */}
            {flights.filter(f => f.lat && f.lon).map((f) => {
              const originAp = MAJOR_AIRPORTS.find(ap => ap.icao === (f.origin?.code_icao || f.origin));
              if (!originAp) return null;
              return (
                <Polyline
                  key={`route-${f.fa_flight_id || f.ident}`}
                  positions={[[originAp.lat, originAp.lon], [f.lat, f.lon]]}
                  color={statusColor(f.status)}
                  weight={1}
                  opacity={0.3}
                  dashArray="4 6"
                />
              );
            })}

            {/* Track for selected flight */}
            {selectedFlight && trackData && trackData.length > 1 && (
              <Polyline
                positions={trackData}
                color="#f59e0b"
                weight={2.5}
                opacity={0.8}
              />
            )}

            {/* Aircraft markers */}
            {flights.filter(f => f.lat && f.lon).map((f) => {
              const isSelected = selectedFlight?.fa_flight_id === f.fa_flight_id;
              const color = isSelected ? '#f59e0b' : statusColor(f.status);
              const icon = makeAircraftIcon(f.heading || 0, color, isSelected ? 34 : 26);
              return (
                <Marker
                  key={f.fa_flight_id || f.ident}
                  position={[f.lat, f.lon]}
                  icon={icon}
                  eventHandlers={{ click: () => fetchTrack(f) }}
                >
                  <Popup className="dark-popup">
                    <div className="bg-[#141922] text-white p-3 rounded-xl min-w-[180px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-primary text-sm font-mono">{f.ident_iata || f.ident}</p>
                        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full',
                          (f.status || '').toLowerCase().includes('en route') ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400')}>
                          {f.status || '—'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">{f.origin?.code_icao || f.origin || '—'} → {f.destination?.code_icao || f.destination || '—'}</p>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500">
                        <span>Alt: <span className="text-white font-bold">{f.altitude ? `${f.altitude}ft` : '—'}</span></span>
                        <span>GS: <span className="text-white font-bold">{f.groundspeed ? `${f.groundspeed}kt` : '—'}</span></span>
                        <span>Tail: <span className="text-cyan-400 font-mono">{f.registration || '—'}</span></span>
                        <span>Type: <span className="text-white">{f.aircraft_type || '—'}</span></span>
                      </div>
                      <p className="text-[9px] text-sky-400 font-bold pt-0.5">Click marker to load track</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#0d1117]/90 border border-white/10 rounded-xl px-3 py-2 space-y-1.5">
            <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest">Legend</p>
            {[
              { color: '#22c55e', label: 'En Route' },
              { color: '#f59e0b', label: 'Departed' },
              { color: '#6b7280', label: 'Other' },
              { color: '#f59e0b', label: 'Selected Track', dashed: false, line: true },
            ].map(({ color, label, line }) => (
              <div key={label} className="flex items-center gap-2">
                {line
                  ? <div className="w-6 h-0.5 rounded" style={{ background: color }} />
                  : <div className="w-3 h-3 rounded-full" style={{ background: color }} />}
                <span className="text-[9px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Side Panel ── */}
        <div className="w-72 flex flex-col bg-[#0a0e18] border-l border-white/8 flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
              {selectedFlight ? 'Flight Detail' : `${flights.length} Aircraft Tracked`}
            </p>
          </div>

          {selectedFlight ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-black text-primary font-mono">{selectedFlight.ident_iata || selectedFlight.ident}</p>
                  <p className="text-xs text-gray-400">
                    {selectedFlight.origin?.code_icao || selectedFlight.origin || '—'} → {selectedFlight.destination?.code_icao || selectedFlight.destination || '—'}
                  </p>
                </div>
                <button onClick={() => { setSelectedFlight(null); setTrackData(null); }}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>

              {trackLoading && (
                <div className="flex items-center gap-2 text-xs text-sky-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Loading track…
                </div>
              )}
              {trackData && (
                <div className="bg-[#0d1117] border border-white/8 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-gray-300">{trackData.length} track points loaded</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Tail', v: selectedFlight.registration, mono: true },
                  { l: 'Type', v: selectedFlight.aircraft_type },
                  { l: 'Altitude', v: selectedFlight.altitude ? `${selectedFlight.altitude} ft` : '—' },
                  { l: 'Ground Spd', v: selectedFlight.groundspeed ? `${selectedFlight.groundspeed} kt` : '—' },
                  { l: 'Heading', v: selectedFlight.heading ? `${selectedFlight.heading}°` : '—' },
                  { l: 'Status', v: selectedFlight.status },
                  { l: 'Operator', v: selectedFlight.operator_icao || selectedFlight.operator },
                  { l: 'Position', v: selectedFlight.lat ? `${selectedFlight.lat.toFixed(2)}, ${selectedFlight.lon.toFixed(2)}` : '—' },
                ].map(({ l, v, mono }) => (
                  <div key={l} className="bg-[#0d1117] border border-white/8 rounded-xl px-3 py-2">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">{l}</p>
                    <p className={cn('text-xs font-bold text-white mt-0.5 truncate', mono && 'font-mono text-cyan-400')}>{v || '—'}</p>
                  </div>
                ))}
              </div>

              <a
                href={`https://www.flightaware.com/live/flight/${encodeURIComponent(selectedFlight.fa_flight_id || selectedFlight.ident || '')}`}
                target="_blank" rel="noopener noreferrer"
                className="block w-full py-2 text-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-extrabold text-amber-400 hover:bg-amber-500/25 transition-colors"
              >
                View on FlightAware ↗
              </a>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {flights.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <Globe className="w-10 h-10 text-gray-700" />
                  <p className="text-sm text-gray-500">Click "Fetch Live" to load aircraft positions</p>
                </div>
              )}
              {flights.map((f) => (
                <button
                  key={f.fa_flight_id || f.ident}
                  onClick={() => fetchTrack(f)}
                  className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold text-primary font-mono">{f.ident_iata || f.ident}</span>
                    <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full',
                      (f.status || '').toLowerCase().includes('en route')
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-amber-500/15 text-amber-400')}>
                      {f.status?.split(' ')[0] || '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {f.origin?.code_icao || f.origin || '—'} → {f.destination?.code_icao || f.destination || '—'}
                  </p>
                  <p className="text-[10px] text-gray-600 font-mono">{f.registration || '—'} · {f.aircraft_type || '—'}</p>
                </button>
              ))}
            </div>
          )}

          {/* Bottom stats */}
          <div className="px-4 py-2 border-t border-white/8 flex items-center gap-3 flex-shrink-0">
            <div className="flex-1 text-center">
              <p className="text-sm font-black text-white">{flights.length}</p>
              <p className="text-[9px] text-gray-600 uppercase">Total</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-sm font-black text-green-400">{airborne}</p>
              <p className="text-[9px] text-gray-600 uppercase">Airborne</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-sm font-black text-amber-400">{flights.length - airborne}</p>
              <p className="text-[9px] text-gray-600 uppercase">Other</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .leaflet-popup-content-wrapper { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { display: none !important; }
      `}</style>
    </div>
  );
}