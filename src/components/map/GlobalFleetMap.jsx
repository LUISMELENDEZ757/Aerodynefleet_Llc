import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  green:  { color: '#10b981', icon: '🟢', label: 'Airworthy' },
  yellow: { color: '#f59e0b', icon: '🟡', label: 'MEL Item' },
  red:    { color: '#ef4444', icon: '🔴', label: 'OOS' },
};

const AIRPORTS = {
  KEWR: { lat: 40.69, lng: -74.17 },
  KJFK: { lat: 40.64, lng: -73.78 },
  KORD: { lat: 41.87, lng: -87.63 },
  KLAX: { lat: 33.94, lng: -118.41 },
  KATL: { lat: 33.64, lng: -84.43 },
  KMIA: { lat: 25.80, lng: -80.29 },
  KDFW: { lat: 32.90, lng: -97.04 },
  KSFO: { lat: 37.62, lng: -122.38 },
  KDEN: { lat: 39.86, lng: -104.67 },
  EGLL: { lat: 51.47, lng: -0.45 },
  LFPG: { lat: 49.01, lng: 2.55 },
  EDDF: { lat: 50.04, lng: 8.56 },
  CYYZ: { lat: 43.68, lng: -79.63 },
  KBOS: { lat: 42.37, lng: -71.01 },
  KIAH: { lat: 29.98, lng: -95.34 },
};

export default function GlobalFleetMap({ flights = [], aircraft = [], melItems = [] }) {
  const [hovered, setHovered] = useState(null);

  const melByTail = new Set(melItems.map(m => m.aircraft_tail));
  const oosSet = new Set(aircraft.filter(a => a.status === 'oos').map(a => a.tail_number));

  const flightMarkers = flights
    .filter(f => f.aircraft_tail && (AIRPORTS[f.origin] || AIRPORTS[f.destination]))
    .map(f => {
      const tail = f.aircraft_tail;
      let colorKey = 'green';
      if (oosSet.has(tail)) colorKey = 'red';
      else if (melByTail.has(tail)) colorKey = 'yellow';
      const isArrived = ['arrived', 'landed'].includes(f.status);
      const airport = AIRPORTS[isArrived ? f.destination : f.origin];
      if (!airport) return null;
      return { ...f, lat: airport.lat, lng: airport.lng, colorKey };
    })
    .filter(Boolean);

  const routeLines = flights
    .map(f => {
      const orig = AIRPORTS[f.origin];
      const dest = AIRPORTS[f.destination];
      if (!orig || !dest) return null;
      return { id: f.id, positions: [[orig.lat, orig.lng], [dest.lat, dest.lng]] };
    })
    .filter(Boolean);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 300 }}>
      <MapContainer
        center={[30, -30]}
        zoom={2}
        style={{ width: '100%', height: '100%', minHeight: 300, background: '#0a1628' }}
        scrollWheelZoom={false}
        attributionControl={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Route lines */}
        {routeLines.map(r => (
          <Polyline
            key={r.id}
            positions={r.positions}
            pathOptions={{ color: '#3b82f6', weight: 1, opacity: 0.4, dashArray: '6 4' }}
          />
        ))}

        {/* Airport dots */}
        {Object.entries(AIRPORTS).map(([name, { lat, lng }]) => (
          <CircleMarker
            key={name}
            center={[lat, lng]}
            radius={3}
            pathOptions={{ color: '#3b82f6', fillColor: '#1e4068', fillOpacity: 1, weight: 1 }}
          >
            <Tooltip permanent={false} direction="top" offset={[0, -4]}>
              <span className="text-xs font-mono">{name}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Flight markers */}
        {flightMarkers.map((f, i) => {
          const { color } = STATUS_COLORS[f.colorKey];
          return (
            <CircleMarker
              key={f.id || i}
              center={[f.lat, f.lng]}
              radius={7}
              pathOptions={{ color: 'white', fillColor: color, fillOpacity: 0.9, weight: 1.5 }}
              eventHandlers={{
                mouseover: () => setHovered(f.id),
                mouseout: () => setHovered(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="text-xs font-bold">{f.flight_number}</div>
                <div className="text-[10px] text-gray-400">{f.origin} → {f.destination}</div>
                <div className="text-[10px] text-gray-400">{f.aircraft_tail}</div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2.5 space-y-1.5 text-xs z-[1000] pointer-events-none">
        <p className="font-extrabold text-white text-[10px] uppercase tracking-widest">Status</p>
        {Object.entries(STATUS_COLORS).map(([k, { icon, label }]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span>{icon}</span>
            <span className="text-slate-400 text-[10px]">{label}</span>
          </div>
        ))}
      </div>

      {/* Count badge */}
      <div className="absolute top-3 right-3 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 z-[1000] text-right pointer-events-none">
        <p className="text-sm font-black text-white">{flightMarkers.length}</p>
        <p className="text-[10px] text-slate-400">Tracked flights</p>
      </div>

      {oosSet.size > 0 && (
        <div className="absolute top-3 left-3 bg-red-900/70 border border-red-500/30 rounded-xl px-3 py-2 z-[1000] pointer-events-none">
          <p className="text-[10px] font-extrabold text-red-400">{oosSet.size} OOS</p>
        </div>
      )}
    </div>
  );
}