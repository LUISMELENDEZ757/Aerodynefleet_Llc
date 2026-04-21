import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const AIRLINE_DISPLAY = {
  'UAL': 'United (UAL)', 'AAL': 'American (AA)',
  'JBU': 'Jet Blue', 'SWA': 'Southwest',
};

function project(lat, lng) {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

const AIRPORT_COORDS = {
  KEWR: [40.69, -74.17], KJFK: [40.64, -73.78], KLAX: [33.94, -118.41],
  KORD: [41.87, -87.63], KDFW: [32.90, -97.04], KATL: [33.64, -84.43],
  KMIA: [25.80, -80.29], KSFO: [37.62, -122.38], KBOS: [42.37, -71.01],
  KDEN: [39.86, -104.67], KSEA: [47.45, -122.31], KPHX: [33.43, -112.01],
  EGLL: [51.47, -0.45], EDDF: [50.04, 8.56], LFPG: [49.01, 2.55],
  LEMD: [40.42, -3.60], OMDB: [25.25, 55.37], RJTT: [35.55, 139.78],
};

export default function LiveAircraftMap({ flights = [] }) {
  const [aircraftPositions, setAircraftPositions] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await base44.functions.invoke('flightAwarePositions', {});
        setAircraftPositions(res.data?.aircraft || []);
      } catch (e) {
        console.error('Failed to fetch positions:', e);
      }
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 30000);
    return () => clearInterval(interval);
  }, []);

  const airlines = [...new Set(aircraftPositions.map(a => a.airline).filter(Boolean))].sort();
  const filtered = selectedAirline
    ? aircraftPositions.filter(a => a.airline === selectedAirline)
    : aircraftPositions;

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-full bg-background flex flex-col">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50 flex-shrink-0 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0">Airline:</span>
        <button onClick={() => setSelectedAirline(null)}
          className={cn('text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0',
            !selectedAirline ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground')}>
          All
        </button>
        {airlines.map(airline => (
          <button key={airline} onClick={() => setSelectedAirline(airline)}
            className={cn('text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0',
              selectedAirline === airline ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground')}>
            {AIRLINE_DISPLAY[airline] || airline}
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">{filtered.length} aircraft</span>
      </div>

      {/* SVG Map */}
      <div className="flex-1 relative bg-[#0a1628] overflow-hidden">
        <svg viewBox="0 0 1000 500" className="w-full h-full" style={{ display: 'block' }}>
          <rect width="1000" height="500" fill="#0a1628" />
          {/* Grid */}
          {[-60,-30,0,30,60].map(lat => { const {y} = project(lat,0); return <line key={lat} x1="0" y1={y} x2="1000" y2={y} stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4 4" />; })}
          {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lng => { const {x} = project(0,lng); return <line key={lng} x1={x} y1="0" x2={x} y2="500" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4 4" />; })}

          {/* Airport dots */}
          {Object.entries(AIRPORT_COORDS).map(([name, [lat, lng]]) => {
            const { x, y } = project(lat, lng);
            return (
              <g key={name}>
                <circle cx={x} cy={y} r="3" fill="#1e4068" stroke="#3b82f6" strokeWidth="1" />
                <text x={x+5} y={y-3} fill="#64748b" fontSize="7" fontFamily="monospace">{name}</text>
              </g>
            );
          })}

          {/* Route lines */}
          {filtered.map((a, i) => {
            const orig = AIRPORT_COORDS[a.origin];
            const dest = AIRPORT_COORDS[a.destination];
            if (!orig || !dest) return null;
            const p1 = project(orig[0], orig[1]);
            const p2 = project(dest[0], dest[1]);
            return <line key={`r-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 4" opacity="0.25" />;
          })}

          {/* Aircraft dots from FlightAware */}
          {filtered.map((a, i) => {
            if (!a.latitude || !a.longitude) return null;
            const { x, y } = project(a.latitude, a.longitude);
            const isHov = hovered === i;
            return (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={isHov ? 9 : 6} fill={selectedAirline ? '#f59e0b' : '#06b6d4'}
                  stroke="white" strokeWidth="1.5" opacity="0.9" />
                <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="white">✈</text>
                {isHov && (
                  <g>
                    <rect x={x+12} y={y-24} width="110" height="36" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x={x+16} y={y-10} fill="white" fontSize="8" fontWeight="bold">{a.flight_number}</text>
                    <text x={x+16} y={y+2} fill="#94a3b8" fontSize="7">{a.origin}→{a.destination}</text>
                    <text x={x+16} y={y+11} fill="#64748b" fontSize="6">{a.altitude}ft · {a.ground_speed}kts</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {filtered.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No live positions available</p>
          </div>
        )}
      </div>
    </div>
  );
}