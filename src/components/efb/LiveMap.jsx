import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, Cloud, AlertTriangle, RefreshCw, Plane, Layers } from 'lucide-react';

// Airport coordinates (ICAO → [lat, lon])
const AIRPORTS = {
  KEWR: [40.6895, -74.1745], KJFK: [40.6413, -73.7781], KLGA: [40.7773, -73.8726],
  KORD: [41.9742, -87.9073], KMDW: [41.7868, -87.7522], KATL: [33.6407, -84.4277],
  KDFW: [32.8998, -97.0403], KDEN: [39.8561, -104.6737], KLAX: [33.9425, -118.4081],
  KSFO: [37.6213, -122.379],  KMIA: [25.7959, -80.2870], KBOS: [42.3656, -71.0096],
  KSEA: [47.4502, -122.3088], KLAS: [36.0840, -115.1537], KPHX: [33.4373, -112.0078],
  KMSP: [44.8848, -93.2223],  KDTW: [42.2124, -83.3534], KIAH: [29.9902, -95.3368],
  KBWI: [39.1754, -76.6683],  KCLT: [35.2140, -80.9431],
};

// Sample SIGMETs / weather cells
const WEATHER_CELLS = [
  { id: 1, lat: 39.5, lon: -95.0, type: 'TS', label: 'TS AREA', color: '#ff4444', radius: 3 },
  { id: 2, lat: 42.0, lon: -88.0, type: 'TURB', label: 'MOD TURB', color: '#ff8800', radius: 2 },
  { id: 3, lat: 36.0, lon: -80.0, type: 'ICE', label: 'MOD ICE', color: '#4488ff', radius: 2.5 },
];

// Convert lat/lon to SVG x/y for a simplified Mercator projection
// Viewport: lat 24-50, lon -125 to -65
function toXY(lat, lon, width, height) {
  const minLat = 24, maxLat = 50, minLon = -125, maxLon = -65;
  const x = ((lon - minLon) / (maxLon - minLon)) * width;
  const y = ((maxLat - lat) / (maxLat - minLat)) * height;
  return [x, y];
}

// Draw great-circle intermediate points between two airports
function routePoints(icaoA, icaoB, count = 20) {
  const a = AIRPORTS[icaoA], b = AIRPORTS[icaoB];
  if (!a || !b) return [];
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return pts;
}

function SimulatedAircraft({ flight, width, height, showLabel }) {
  const orig = AIRPORTS[flight.origin];
  const dest = AIRPORTS[flight.destination];
  if (!orig || !dest) return null;

  // Simulated position based on status
  const progress = flight.status === 'airborne' ? 0.45 :
                   flight.status === 'departed' ? 0.15 :
                   flight.status === 'arrived'  ? 1.0  : 0;

  const lat = orig[0] + (dest[0] - orig[0]) * progress;
  const lon = orig[1] + (dest[1] - orig[1]) * progress;
  const [x, y] = toXY(lat, lon, width, height);

  // Heading angle
  const dx = dest[1] - orig[1];
  const dy = dest[0] - orig[0];
  const angle = Math.atan2(dx, dy) * (180 / Math.PI);

  if (progress === 0 || progress === 1) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <g transform={`rotate(${angle})`}>
        <polygon
          points="0,-8 5,6 0,3 -5,6"
          fill={flight.status === 'airborne' ? '#fbbf24' : '#60a5fa'}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="0.5"
        />
      </g>
      {showLabel && (
        <text x="10" y="4" fontSize="7" fill="#e2e8f0" fontFamily="monospace">{flight.flight_number}</text>
      )}
    </g>
  );
}

export default function LiveMap({ flights = [] }) {
  const [showWeather, setShowWeather]   = useState(true);
  const [showRoutes, setShowRoutes]     = useState(true);
  const [showLabels, setShowLabels]     = useState(true);
  const [showSigmets, setShowSigmets]   = useState(true);
  const [tick, setTick]                 = useState(0);

  const W = 800, H = 420;

  // Animate aircraft positions
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // All unique airports from today's flights
  const flightAirports = new Set();
  flights.forEach(f => { flightAirports.add(f.origin); flightAirports.add(f.destination); });

  const activeFlights = flights.filter(f => ['airborne', 'departed', 'boarding'].includes(f.status));

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="rounded-xl bg-card border border-border p-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Layers className="w-3.5 h-3.5 text-primary" /> Layers
        </p>
        {[
          { key: 'routes',  label: 'Routes',   state: showRoutes,  set: setShowRoutes  },
          { key: 'wx',      label: 'WX Cells', state: showWeather, set: setShowWeather },
          { key: 'sigmets', label: 'SIGMETs',  state: showSigmets, set: setShowSigmets },
          { key: 'labels',  label: 'Labels',   state: showLabels,  set: setShowLabels  },
        ].map(({ key, label, state, set }) => (
          <button
            key={key}
            onClick={() => set(s => !s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
              state ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
            )}
          >{label}</button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Airborne
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block ml-1" /> Boarding/Dep
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block ml-1" /> Airport
        </div>
      </div>

      {/* Map SVG */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-secondary/60 flex items-center justify-between">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-primary" /> Live Route Map — CONUS
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · {activeFlights.length} airborne
          </div>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
        >
          {/* US coastline / state borders (simplified paths) */}
          <path d="M 90,280 Q 160,260 200,230 Q 240,200 280,180 Q 320,160 360,155 Q 400,150 440,145 Q 480,142 520,140 Q 560,138 600,135 Q 640,132 680,128 Q 720,125 760,120"
            stroke="#334155" strokeWidth="1" fill="none" />
          {/* Rough coastlines */}
          <path d="M 90,50 Q 92,100 95,140 Q 98,180 90,220 Q 85,250 90,280 Q 130,290 150,310 Q 170,320 190,340 Q 200,360 220,370 Q 260,380 280,390 Q 300,395 320,400"
            stroke="#1e3a5f" strokeWidth="1" fill="none" />
          <path d="M 630,50 Q 650,60 670,80 Q 700,100 720,130 Q 740,155 760,170"
            stroke="#1e3a5f" strokeWidth="1" fill="none" />
          {/* Gulf coast */}
          <path d="M 320,400 Q 380,410 430,408 Q 480,405 520,400 Q 560,390 590,370 Q 610,355 630,330"
            stroke="#1e3a5f" strokeWidth="1" fill="none" />

          {/* Latitude/Longitude grid */}
          {[30, 35, 40, 45].map(lat => {
            const [, y] = toXY(lat, -95, W, H);
            return <line key={lat} x1={0} y1={y} x2={W} y2={y} stroke="#1e293b" strokeWidth="0.5" />;
          })}
          {[-120, -110, -100, -90, -80, -70].map(lon => {
            const [x] = toXY(35, lon, W, H);
            return <line key={lon} x1={x} y1={0} x2={x} y2={H} stroke="#1e293b" strokeWidth="0.5" />;
          })}

          {/* Weather cells */}
          {showWeather && WEATHER_CELLS.map(cell => {
            const [cx, cy] = toXY(cell.lat, cell.lon, W, H);
            const rx = (cell.radius / 60) * W;
            const ry = (cell.radius / 26) * H;
            return (
              <g key={cell.id}>
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
                  fill={cell.color} fillOpacity="0.15"
                  stroke={cell.color} strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3,2" />
                {showLabels && (
                  <text x={cx} y={cy - ry - 4} textAnchor="middle" fontSize="7"
                    fill={cell.color} fontFamily="monospace" fontWeight="bold">{cell.label}</text>
                )}
              </g>
            );
          })}

          {/* SIGMET indicators */}
          {showSigmets && WEATHER_CELLS.filter(c => c.type === 'TS').map(cell => {
            const [cx, cy] = toXY(cell.lat, cell.lon, W, H);
            return (
              <g key={`sig-${cell.id}`}>
                <polygon points={`${cx},${cy-12} ${cx+10},${cy+8} ${cx-10},${cy+8}`}
                  fill="#ff4444" fillOpacity="0.7" stroke="#ff0000" strokeWidth="1" />
                <text x={cx} y={cy+2} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">!</text>
              </g>
            );
          })}

          {/* Route lines */}
          {showRoutes && flights.map(f => {
            const pts = routePoints(f.origin, f.destination);
            if (pts.length === 0) return null;
            const pathD = pts.map(([lat, lon], i) => {
              const [x, y] = toXY(lat, lon, W, H);
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
            }).join(' ');
            const isActive = ['airborne', 'departed'].includes(f.status);
            return (
              <path key={f.id} d={pathD}
                stroke={isActive ? '#fbbf24' : '#475569'}
                strokeWidth={isActive ? 1.5 : 0.8}
                strokeDasharray={isActive ? 'none' : '4,3'}
                fill="none" strokeOpacity={isActive ? 0.8 : 0.4} />
            );
          })}

          {/* Airport dots */}
          {Object.entries(AIRPORTS).map(([icao, [lat, lon]]) => {
            const [x, y] = toXY(lat, lon, W, H);
            const isFlightAirport = flightAirports.has(icao);
            return (
              <g key={icao}>
                <circle cx={x} cy={y} r={isFlightAirport ? 4 : 2.5}
                  fill={isFlightAirport ? '#4ade80' : '#334155'}
                  stroke={isFlightAirport ? '#16a34a' : '#475569'} strokeWidth="0.8" />
                {showLabels && isFlightAirport && (
                  <text x={x + 6} y={y + 4} fontSize="7" fill="#94a3b8" fontFamily="monospace">{icao}</text>
                )}
              </g>
            );
          })}

          {/* Aircraft positions */}
          {flights.map(f => (
            <SimulatedAircraft key={f.id} flight={f} width={W} height={H} showLabel={showLabels} />
          ))}
        </svg>

        {/* Legend */}
        <div className="px-4 py-2 border-t border-border bg-secondary/20 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-6 border-t-2 border-yellow-400" /> Active route</span>
          <span className="flex items-center gap-1"><span className="inline-block w-6 border-t border-dashed border-slate-500" /> Scheduled route</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-2 rounded-sm bg-red-500/30 border border-red-400" /> TS cell</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-2 rounded-sm bg-orange-500/30 border border-orange-400" /> Turbulence</span>
          <span className="text-muted-foreground ml-auto">Positions are simulated · Not for navigation</span>
        </div>
      </div>

      {/* Active flight status */}
      {activeFlights.length > 0 && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Active Flights</p>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeFlights.map(f => (
              <div key={f.id} className="flex items-center gap-3 bg-background/40 rounded-lg px-3 py-2">
                <Plane className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-bold text-foreground">{f.flight_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{f.origin} → {f.destination} · {f.aircraft_tail || '—'}</p>
                </div>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                  f.status === 'airborne' ? 'bg-green-500/15 text-green-400' : 'bg-primary/15 text-primary'
                )}>{f.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}