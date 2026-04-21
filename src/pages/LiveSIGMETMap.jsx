import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, CloudLightning, RefreshCw, AlertTriangle, Wind, Thermometer, Eye, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIGMETS = [
  { id: 'C1', type: 'CONVECTIVE', color: '#ef4444', coords: [[42,-90],[40,-88],[38,-90],[39,-93],[41,-93]], altitudes: 'SFC–FL430', intensity: 'EMBD TS OBS AND FCST', movement: 'MOV E 20KT', expires: '2026-04-09T17:00Z' },
  { id: 'T3', type: 'TURBULENCE', color: '#f97316', coords: [[46,-90],[44,-88],[43,-91],[44,-94],[46,-93]], altitudes: 'FL350–FL450', intensity: 'SEV TURB', movement: 'MOV NE 25KT', expires: '2026-04-09T19:00Z' },
  { id: 'I2', type: 'ICING',      color: '#3b82f6', coords: [[42.4,-71],[42.7,-74],[43.1,-76],[43.0,-73],[42.3,-70.9]], altitudes: 'FL080–FL200', intensity: 'MOD ICING IN CLDS', movement: 'STNR', expires: '2026-04-09T18:30Z' },
  { id: 'C2', type: 'CONVECTIVE', color: '#ef4444', coords: [[42,-88.5],[41,-88],[40.5,-89],[41,-90],[42,-89.5]], altitudes: 'SFC–FL280', intensity: 'ISOL SEV TS OBS', movement: 'MOV SE 15KT', expires: '2026-04-09T17:15Z' },
];

const AIRMETS = [
  { id: 'SIE1', type: 'SIERRA', color: '#06b6d4', coords: [[35,-80],[33,-78],[32,-82],[34,-84]], desc: 'IFR conditions and mountain obscuration' },
  { id: 'TAN1', type: 'TANGO',  color: '#eab308', coords: [[38,-100],[36,-98],[35,-102],[37,-104]], desc: 'Moderate turbulence, wind shear' },
  { id: 'ZUL1', type: 'ZULU',   color: '#8b5cf6', coords: [[45,-105],[43,-103],[42,-107],[44,-109]], desc: 'Moderate icing, freezing level' },
];

const TFRS = [
  { id: 'TFR1', label: 'TFR – VIP Movement',   lat: 38.9,  lon: -77.04, radius: 2.5, color: '#a855f7', desc: 'Presidential TFR · SFC–FL180' },
  { id: 'TFR2', label: 'TFR – Sporting Event',  lat: 33.75, lon: -84.39, radius: 1.5, color: '#ec4899', desc: 'Temporary Flight Restriction · SFC–3000 MSL' },
];

const AIRPORTS = [
  { icao: 'KEWR', name: 'Newark Liberty',       lat: 40.6895, lon: -74.1745 },
  { icao: 'KJFK', name: 'New York JFK',          lat: 40.6413, lon: -73.7781 },
  { icao: 'KORD', name: "Chicago O'Hare",         lat: 41.9742, lon: -87.9073 },
  { icao: 'KATL', name: 'Atlanta Hartsfield',    lat: 33.6407, lon: -84.4277 },
  { icao: 'KLAX', name: 'Los Angeles',           lat: 33.9425, lon: -118.4081 },
  { icao: 'KDFW', name: 'Dallas/Fort Worth',     lat: 32.8998, lon: -97.0403 },
  { icao: 'KDEN', name: 'Denver',               lat: 39.8561, lon: -104.6737 },
  { icao: 'KBOS', name: 'Boston Logan',         lat: 42.3656, lon: -71.0096 },
  { icao: 'KMIA', name: 'Miami',                lat: 25.7959, lon: -80.287 },
  { icao: 'KSEA', name: 'Seattle-Tacoma',       lat: 47.4502, lon: -122.3088 },
  { icao: 'KLAS', name: 'Las Vegas',            lat: 36.084,  lon: -115.1537 },
  { icao: 'KPHX', name: 'Phoenix Sky Harbor',   lat: 33.4373, lon: -112.0078 },
  { icao: 'KMSP', name: 'Minneapolis',          lat: 44.882,  lon: -93.2218 },
  { icao: 'KDCA', name: 'Reagan National',      lat: 38.8521, lon: -77.0377 },
];

// SVG projection — focus on CONUS: lat 24–50, lon -125 to -65
// viewBox 0 0 800 500
function project(lat, lon) {
  const x = ((lon + 125) / 60) * 800;
  const y = ((50 - lat) / 26) * 500;
  return { x: Math.max(0, Math.min(800, x)), y: Math.max(0, Math.min(500, y)) };
}

function coordsToPoints(coords) {
  return coords.map(([lat, lon]) => {
    const { x, y } = project(lat, lon);
    return `${x},${y}`;
  }).join(' ');
}

function layerDash(type) {
  if (type === 'SIGMET') return '8 4';
  if (type === 'AIRMET') return '4 6';
  return '4 4';
}

function LayerBtn({ label, active, color, onClick }) {
  return (
    <button onClick={onClick}
      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex-shrink-0',
        active ? 'text-white' : 'bg-[#141922]/80 text-gray-500 border-white/10')}
      style={active ? { background: color + '33', borderColor: color + '88', color } : {}}>
      <span className="w-2 h-2 rounded-full" style={{ background: active ? color : '#4b5563' }} />
      {label}
    </button>
  );
}

function AirportPopup({ airport, onClose }) {
  const COORDS = {};
  AIRPORTS.forEach(a => { COORDS[a.icao] = [a.lat, a.lon]; });

  const { data, isLoading } = useQuery({
    queryKey: ['apt-wx', airport.icao],
    queryFn: async () => {
      const c = COORDS[airport.icao];
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c[0]}&longitude=${c[1]}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=2`);
      return res.json();
    },
    staleTime: 300000,
  });

  const wmoLabel = (c) => {
    if (c === 0) return 'Clear'; if (c <= 2) return 'Partly Cloudy'; if (c === 3) return 'Overcast';
    if (c <= 49) return 'Fog'; if (c <= 69) return 'Rain'; if (c <= 79) return 'Snow';
    if (c <= 86) return 'Showers'; return 'Thunderstorm';
  };
  const flightCat = (code, wind) => {
    if (code >= 95) return { cat: 'IFR', color: '#ef4444' };
    if (code >= 50 || wind > 25 || code === 3) return { cat: 'MVFR', color: '#3b82f6' };
    return { cat: 'VFR', color: '#22c55e' };
  };

  const w = data?.current_weather;
  const kt = w ? Math.round(w.windspeed / 1.852) : 0;
  const fc = w ? flightCat(w.weathercode, kt) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-extrabold text-white">{airport.icao}</p>
            <p className="text-[10px] text-gray-400">{airport.name}</p>
          </div>
          {fc && <span className="text-xs font-extrabold px-2 py-0.5 rounded border" style={{ background: fc.color + '22', color: fc.color, borderColor: fc.color + '55' }}>{fc.cat}</span>}
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white ml-2">✕</button>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-xs"><Loader2 className="w-4 h-4 animate-spin" /> Loading weather…</div>
        ) : w ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <Thermometer className="w-3 h-3 text-orange-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-white">{Math.round(w.temperature)}°C</p>
                <p className="text-[9px] text-gray-500">Temp</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <Wind className="w-3 h-3 text-cyan-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-white">{kt}kt</p>
                <p className="text-[9px] text-gray-500">{w.winddirection}°</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <Eye className="w-3 h-3 text-blue-400 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-white">{wmoLabel(w.weathercode)}</p>
                <p className="text-[9px] text-gray-500">Cond</p>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-2">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">METAR (synthetic)</p>
              <p className="text-[10px] font-mono text-green-400 break-all leading-relaxed">
                {airport.icao} AUTO {String(Math.round(w.winddirection)).padStart(3,'0')}{String(kt).padStart(2,'0')}KT 9999 {wmoLabel(w.weathercode).toUpperCase().replace(/ /g,'')} {Math.round(w.temperature)}/{Math.round(w.temperature-3)} Q1013
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No data available</p>
        )}
      </div>
    </div>
  );
}

export default function LiveSIGMETMap() {
  const navigate = useNavigate();
  const [layers, setLayers] = useState({ SIGMET: true, AIRMET: true, TFR: true, AIRPORTS: true });
  const [updated, setUpdated] = useState(new Date());
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const toggle = k => setLayers(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#0a0e18] border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <CloudLightning className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white tracking-widest uppercase">SIGMET / AIRMET / TFR Map</p>
          <p className="text-[10px] text-blue-400 font-mono">Live Aviation Weather Hazards · Click airport for METAR/TAF</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">{SIGMETS.length} SIGMET</span>
          <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">{AIRMETS.length} AIRMET</span>
          <span className="text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full">{TFRS.length} TFR</span>
        </div>
        <button onClick={() => setUpdated(new Date())} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Controls */}
      <div className="flex-shrink-0 bg-[#0d1117]/90 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-white/5">
        <Layers className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <LayerBtn label="SIGMETs"  active={layers.SIGMET}   color="#ef4444" onClick={() => toggle('SIGMET')} />
        <LayerBtn label="AIRMETs"  active={layers.AIRMET}   color="#eab308" onClick={() => toggle('AIRMET')} />
        <LayerBtn label="TFRs"     active={layers.TFR}      color="#a855f7" onClick={() => toggle('TFR')} />
        <LayerBtn label="Airports" active={layers.AIRPORTS} color="#22c55e" onClick={() => toggle('AIRPORTS')} />
        <span className="ml-auto text-[10px] text-gray-600 flex-shrink-0">Updated {updated.toLocaleTimeString()}</span>
      </div>

      {/* SVG Map */}
      <div className="flex-1 relative bg-[#0a1020] overflow-hidden">
        <svg viewBox="0 0 800 500" className="w-full h-full" style={{ display: 'block' }}>
          {/* Background */}
          <rect width="800" height="500" fill="#0a1020" />

          {/* Lat/lon grid */}
          {[25, 30, 35, 40, 45, 50].map(lat => {
            const { y } = project(lat, -95);
            return <line key={lat} x1="0" y1={y} x2="800" y2={y} stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4 4" />;
          })}
          {[-120, -115, -110, -105, -100, -95, -90, -85, -80, -75, -70, -65].map(lon => {
            const { x } = project(35, lon);
            return <line key={lon} x1={x} y1="0" x2={x} y2="500" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4 4" />;
          })}

          {/* SIGMET polygons */}
          {layers.SIGMET && SIGMETS.map(s => (
            <polygon key={s.id} points={coordsToPoints(s.coords)}
              fill={s.color} fillOpacity="0.18" stroke={s.color} strokeWidth="2" strokeDasharray="8 4"
              style={{ cursor: 'pointer' }} onClick={() => setSelectedHazard({ ...s, kind: 'SIGMET' })} />
          ))}

          {/* AIRMET polygons */}
          {layers.AIRMET && AIRMETS.map(a => (
            <polygon key={a.id} points={coordsToPoints(a.coords)}
              fill={a.color} fillOpacity="0.12" stroke={a.color} strokeWidth="1.5" strokeDasharray="4 6"
              style={{ cursor: 'pointer' }} onClick={() => setSelectedHazard({ ...a, kind: 'AIRMET' })} />
          ))}

          {/* TFR circles */}
          {layers.TFR && TFRS.map(t => {
            const { x, y } = project(t.lat, t.lon);
            const rx = (t.radius / 60) * 800;
            return (
              <ellipse key={t.id} cx={x} cy={y} rx={rx} ry={rx * 0.5}
                fill={t.color} fillOpacity="0.15" stroke={t.color} strokeWidth="2" strokeDasharray="4 4"
                style={{ cursor: 'pointer' }} onClick={() => setSelectedHazard({ ...t, kind: 'TFR' })} />
            );
          })}

          {/* Airport dots */}
          {layers.AIRPORTS && AIRPORTS.map(apt => {
            const { x, y } = project(apt.lat, apt.lon);
            return (
              <g key={apt.icao} onClick={() => setSelectedAirport(apt)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r="5" fill="#22c55e" stroke="white" strokeWidth="1" opacity="0.9" />
                <text x={x + 7} y={y - 4} fill="#22c55e" fontSize="7" fontFamily="monospace">{apt.icao}</text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-[#0d1117]/90 border border-white/10 rounded-2xl p-3 space-y-1.5 text-[10px]">
          <p className="text-gray-500 font-bold uppercase tracking-widest mb-2">Legend</p>
          {[
            { color: '#ef4444', label: 'Convective SIGMET', dash: true },
            { color: '#f97316', label: 'Turbulence SIGMET', dash: true },
            { color: '#3b82f6', label: 'Icing SIGMET', dash: true },
            { color: '#eab308', label: 'AIRMET', dash: true },
            { color: '#a855f7', label: 'TFR', dash: true },
            { color: '#22c55e', label: 'Airport (click for wx)', dash: false },
          ].map(({ color, label, dash }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-6 h-0 border-t-2 flex-shrink-0" style={{ borderColor: color, borderStyle: dash ? 'dashed' : 'solid' }} />
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Hazard detail panel */}
        {selectedHazard && (
          <div className="absolute top-4 right-4 z-10 bg-[#0d1117]/95 border border-white/10 rounded-2xl p-4 max-w-[240px] shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border"
                style={{ background: selectedHazard.color + '22', color: selectedHazard.color, borderColor: selectedHazard.color + '66' }}>
                {selectedHazard.kind} {selectedHazard.type || ''}
              </span>
              <button onClick={() => setSelectedHazard(null)} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-gray-400 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-sm font-extrabold text-white mb-2">{selectedHazard.id || selectedHazard.label}</p>
            <div className="text-[11px] text-gray-300 space-y-1">
              {selectedHazard.altitudes && <p><span className="text-gray-500">Altitudes:</span> <span className="font-bold">{selectedHazard.altitudes}</span></p>}
              {selectedHazard.intensity && <p><span className="text-gray-500">Phenomenon:</span> <span className="font-bold">{selectedHazard.intensity}</span></p>}
              {selectedHazard.movement && <p><span className="text-gray-500">Movement:</span> <span className="font-bold">{selectedHazard.movement}</span></p>}
              {selectedHazard.desc && <p className="text-gray-300">{selectedHazard.desc}</p>}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-red-400 mt-2">
              <AlertTriangle className="w-3 h-3" /> Potential airspace hazard
            </div>
          </div>
        )}
      </div>

      {/* Airport weather popup */}
      {selectedAirport && (
        <AirportPopup airport={selectedAirport} onClose={() => setSelectedAirport(null)} />
      )}
    </div>
  );
}