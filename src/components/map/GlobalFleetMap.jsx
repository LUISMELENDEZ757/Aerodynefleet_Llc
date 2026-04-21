import { useState } from 'react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  green:  { fill: '#10b981', icon: '🟢', label: 'Airworthy' },
  yellow: { fill: '#f59e0b', icon: '🟡', label: 'MEL Item' },
  red:    { fill: '#ef4444', icon: '🔴', label: 'OOS' },
};

// Convert lat/lng to SVG x/y (simple equirectangular projection)
// SVG viewBox: 0 0 1000 500
function project(lat, lng) {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

const AIRPORTS = [
  { name: 'KEWR', lat: 40.69, lng: -74.17 },
  { name: 'KJFK', lat: 40.64, lng: -73.78 },
  { name: 'KORD', lat: 41.87, lng: -87.63 },
  { name: 'KLAX', lat: 33.94, lng: -118.41 },
  { name: 'KATL', lat: 33.64, lng: -84.43 },
  { name: 'KMIA', lat: 25.80, lng: -80.29 },
  { name: 'KDFW', lat: 32.90, lng: -97.04 },
  { name: 'KSFO', lat: 37.62, lng: -122.38 },
  { name: 'KDEN', lat: 39.86, lng: -104.67 },
  { name: 'EGLL', lat: 51.47, lng: -0.45 },
  { name: 'LFPG', lat: 49.01, lng: 2.55 },
  { name: 'EDDF', lat: 50.04, lng: 8.56 },
  { name: 'CYYZ', lat: 43.68, lng: -79.63 },
  { name: 'KBOS', lat: 42.37, lng: -71.01 },
  { name: 'KIAH', lat: 29.98, lng: -95.34 },
];

const AIRPORT_MAP = Object.fromEntries(AIRPORTS.map(a => [a.name, a]));

// Simplified world landmass paths (SVG path data, equirectangular 1000x500)
const LAND_PATH = `
M 261 80 L 270 75 L 280 70 L 295 68 L 310 72 L 320 78 L 318 88 L 308 95 L 295 98 L 280 96 L 265 90 Z
M 395 55 L 420 48 L 450 52 L 475 65 L 480 85 L 470 105 L 450 118 L 425 120 L 405 112 L 390 95 L 385 75 Z
M 130 100 L 145 90 L 160 88 L 175 95 L 178 110 L 168 122 L 150 125 L 135 118 L 128 108 Z
M 330 120 L 380 115 L 420 118 L 450 130 L 460 155 L 450 180 L 430 195 L 400 200 L 370 195 L 345 178 L 330 155 L 325 135 Z
M 460 200 L 490 195 L 515 200 L 525 220 L 518 240 L 500 255 L 478 258 L 460 245 L 452 225 Z
M 500 140 L 540 130 L 580 128 L 620 135 L 650 150 L 660 175 L 650 200 L 625 215 L 590 218 L 555 210 L 525 195 L 505 175 L 498 155 Z
M 650 100 L 700 90 L 750 92 L 790 105 L 810 125 L 805 150 L 785 165 L 750 170 L 710 162 L 675 145 L 655 125 Z
M 200 170 L 230 160 L 260 162 L 278 178 L 272 200 L 252 212 L 228 210 L 210 196 L 198 180 Z
M 195 218 L 225 210 L 250 215 L 258 235 L 248 255 L 225 262 L 202 255 L 190 238 Z
M 320 240 L 360 230 L 400 235 L 425 255 L 420 280 L 400 295 L 365 298 L 332 285 L 318 265 Z
M 540 280 L 580 272 L 615 278 L 630 298 L 622 322 L 595 335 L 562 330 L 542 312 L 535 295 Z
M 650 260 L 700 255 L 740 265 L 755 288 L 745 315 L 718 328 L 685 322 L 658 305 L 645 282 Z
M 700 170 L 740 162 L 775 168 L 790 188 L 782 210 L 758 222 L 725 218 L 705 200 L 695 182 Z
M 580 345 L 620 340 L 645 355 L 640 378 L 618 390 L 590 385 L 572 368 L 575 350 Z
M 820 280 L 860 270 L 900 278 L 918 300 L 910 325 L 885 338 L 852 332 L 828 312 L 815 295 Z
M 850 140 L 880 130 L 910 135 L 925 152 L 918 172 L 895 182 L 868 178 L 848 160 Z
M 410 290 L 445 282 L 470 290 L 478 310 L 468 332 L 445 340 L 420 333 L 408 312 Z
M 430 345 L 462 338 L 488 348 L 492 370 L 478 390 L 453 395 L 428 382 L 420 362 Z
`;

export default function GlobalFleetMap({ flights = [], aircraft = [], melItems = [] }) {
  const [hovered, setHovered] = useState(null);

  const melByTail = new Set(melItems.map(m => m.aircraft_tail));
  const oosSet = new Set(aircraft.filter(a => a.status === 'oos').map(a => a.tail_number));

  // Build flight markers
  const flightMarkers = flights
    .filter(f => f.aircraft_tail && (AIRPORT_MAP[f.origin] || AIRPORT_MAP[f.destination]))
    .map(f => {
      const tail = f.aircraft_tail;
      let colorKey = 'green';
      if (oosSet.has(tail)) colorKey = 'red';
      else if (melByTail.has(tail)) colorKey = 'yellow';

      const isArrived = ['arrived', 'landed'].includes(f.status);
      const airport = AIRPORT_MAP[isArrived ? f.destination : f.origin];
      if (!airport) return null;
      const { x, y } = project(airport.lat, airport.lng);
      return { ...f, x, y, colorKey };
    })
    .filter(Boolean);

  // Route lines
  const routeLines = flights
    .map(f => {
      const orig = AIRPORT_MAP[f.origin];
      const dest = AIRPORT_MAP[f.destination];
      if (!orig || !dest) return null;
      const p1 = project(orig.lat, orig.lng);
      const p2 = project(dest.lat, dest.lng);
      return { id: f.id, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    })
    .filter(Boolean);

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden">
      <svg viewBox="0 0 1000 500" className="w-full h-full" style={{ display: 'block' }}>
        {/* Ocean background */}
        <rect width="1000" height="500" fill="#0a1628" />

        {/* Grid lines */}
        {[-60,-30,0,30,60].map(lat => {
          const { y } = project(lat, 0);
          return <line key={lat} x1="0" y1={y} x2="1000" y2={y} stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4 4" />;
        })}
        {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lng => {
          const { x } = project(0, lng);
          return <line key={lng} x1={x} y1="0" x2={x} y2="500" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4 4" />;
        })}

        {/* Land masses */}
        <path d={LAND_PATH} fill="#162a45" stroke="#1e4068" strokeWidth="0.5" />

        {/* Route lines */}
        {routeLines.map(r => (
          <line key={r.id} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
            stroke="#3b82f6" strokeWidth="1" strokeDasharray="6 4" opacity="0.35" />
        ))}

        {/* Airport dots */}
        {AIRPORTS.map(ap => {
          const { x, y } = project(ap.lat, ap.lng);
          return (
            <g key={ap.name}>
              <circle cx={x} cy={y} r="3" fill="#1e4068" stroke="#3b82f6" strokeWidth="1" />
              <text x={x + 5} y={y - 3} fill="#64748b" fontSize="7" fontFamily="monospace">{ap.name}</text>
            </g>
          );
        })}

        {/* Flight markers */}
        {flightMarkers.map((f, i) => {
          const color = STATUS_COLORS[f.colorKey].fill;
          const isHov = hovered === f.id;
          return (
            <g key={f.id || i}
              onMouseEnter={() => setHovered(f.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <circle cx={f.x} cy={f.y} r={isHov ? 8 : 6} fill={color} opacity="0.85"
                stroke="white" strokeWidth="1.5" />
              <text x={f.x} y={f.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="6" fill="white">✈</text>
              {isHov && (
                <g>
                  <rect x={f.x + 10} y={f.y - 22} width="100" height="32" rx="4"
                    fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <text x={f.x + 14} y={f.y - 10} fill="white" fontSize="8" fontWeight="bold">
                    {f.flight_number}
                  </text>
                  <text x={f.x + 14} y={f.y + 2} fill="#94a3b8" fontSize="7">
                    {f.origin}→{f.destination} · {f.aircraft_tail}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2.5 space-y-1.5 text-xs z-10">
        <p className="font-extrabold text-white text-[10px] uppercase tracking-widest">Status</p>
        {Object.entries(STATUS_COLORS).map(([k, { icon, label }]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span>{icon}</span>
            <span className="text-slate-400 text-[10px]">{label}</span>
          </div>
        ))}
      </div>

      {/* Count badge */}
      <div className="absolute top-3 right-3 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 z-10 text-right">
        <p className="text-sm font-black text-white">{flightMarkers.length}</p>
        <p className="text-[10px] text-slate-400">Tracked flights</p>
      </div>

      {/* OOS count */}
      {oosSet.size > 0 && (
        <div className="absolute top-3 left-3 bg-red-900/70 border border-red-500/30 rounded-xl px-3 py-2 z-10">
          <p className="text-[10px] font-extrabold text-red-400">{oosSet.size} OOS</p>
        </div>
      )}
    </div>
  );
}