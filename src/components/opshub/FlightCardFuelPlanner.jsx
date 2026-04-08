import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Fuel, Wind, Cloud, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Performance presets per aircraft type ─────────────────────────────────────
const PERF = {
  'B737-700': { ff: 4800, speed: 450, reserve: 2800 },
  'B737-800': { ff: 5100, speed: 460, reserve: 3000 },
  'B737-900': { ff: 5300, speed: 460, reserve: 3100 },
  'B737 MAX 8': { ff: 4600, speed: 470, reserve: 2900 },
  'B737 MAX 9': { ff: 4800, speed: 470, reserve: 3000 },
  'B757':     { ff: 7200, speed: 490, reserve: 4000 },
  'B767':     { ff: 9800, speed: 490, reserve: 5200 },
  'B777':     { ff: 14500, speed: 510, reserve: 7500 },
  'B787':     { ff: 12000, speed: 510, reserve: 6500 },
  'A320':     { ff: 4900, speed: 450, reserve: 2900 },
  'A321':     { ff: 5200, speed: 455, reserve: 3100 },
  'A350':     { ff: 11500, speed: 510, reserve: 6200 },
  'E190':     { ff: 3200, speed: 430, reserve: 2000 },
  'E175':     { ff: 3000, speed: 430, reserve: 1900 },
  'CRJ700':   { ff: 2800, speed: 420, reserve: 1800 },
  'CRJ900':   { ff: 3000, speed: 425, reserve: 1900 },
};

const DEFAULT_PERF = { ff: 5000, speed: 450, reserve: 3000 };

// Weather penalty factors
function weatherPenalty(category) {
  if (!category) return 1.0;
  const c = category.toUpperCase();
  if (c === 'LIFR') return 1.10; // 10% extra for low IFR (likely holding/alt)
  if (c === 'IFR')  return 1.05;
  if (c === 'MVFR') return 1.02;
  return 1.0;
}

// Wind headwind component estimate (simplified — surface wind proxy)
function headwindPenalty(windSpeedKts) {
  if (!windSpeedKts || windSpeedKts < 10) return 1.0;
  // ~0.3% extra fuel per 10kts average headwind
  return 1 + (windSpeedKts * 0.003);
}

function FlightCategoryBadge({ category }) {
  const map = {
    VFR:  'bg-green-500/20 text-green-400 border-green-500/30',
    MVFR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    IFR:  'bg-red-500/20 text-red-400 border-red-500/30',
    LIFR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return (
    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded border', map[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30')}>
      {category || '—'}
    </span>
  );
}

export default function FlightCardFuelPlanner({ flight, aircraftType, onClose }) {
  const [open, setOpen] = useState(true);

  // Fetch weather + distance from FlightAware
  const { data: wxData, isLoading: wxLoading, error: wxError } = useQuery({
    queryKey: ['flight-fuel-wx', flight.origin, flight.destination, flight.flight_number],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightFuelWeather', {
        origin: flight.origin,
        destination: flight.destination,
        flight_number: flight.flight_number,
      });
      return res.data;
    },
    enabled: !!(flight.origin && flight.destination),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch registered aircraft to look up type if not passed
  const { data: aircraftList = [] } = useQuery({
    queryKey: ['fuel-planner-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    staleTime: 60 * 1000,
  });

  const resolvedType = useMemo(() => {
    if (aircraftType) return aircraftType;
    const ac = aircraftList.find(a => a.tail_number === flight.aircraft_tail);
    return ac?.aircraft_type || null;
  }, [aircraftType, aircraftList, flight.aircraft_tail]);

  const perf = PERF[resolvedType] || DEFAULT_PERF;

  const fuelCalc = useMemo(() => {
    const distNm = wxData?.distance_nm || null;
    if (!distNm) return null;

    const speedKts = perf.speed;
    const flightTimeHrs = distNm / speedKts;

    // Penalties
    const destCategory = wxData?.destination_flight_category;
    const destWindKts = wxData?.destination_weather?.speed_kts || 0;
    const wxFactor = weatherPenalty(destCategory);
    const windFactor = headwindPenalty(wxData?.origin_weather?.speed_kts || 0);

    const tripFuelLbs = Math.round(flightTimeHrs * perf.ff * wxFactor * windFactor);
    const contingency = Math.round(tripFuelLbs * 0.05);
    const alternateFuel = destCategory === 'LIFR' || destCategory === 'IFR'
      ? Math.round(perf.ff * 0.75) // ~45 min to alternate
      : Math.round(perf.ff * 0.5); // ~30 min nominal
    const finalReserve = perf.reserve;
    const taxiFuel = 800;
    const minRequired = tripFuelLbs + contingency + alternateFuel + finalReserve + taxiFuel;
    const flightTimeMin = Math.round(flightTimeHrs * 60);

    return {
      distNm,
      flightTimeHrs,
      flightTimeMin,
      tripFuelLbs,
      contingency,
      alternateFuel,
      finalReserve,
      taxiFuel,
      minRequired,
      wxFactor,
      windFactor,
    };
  }, [wxData, perf]);

  return (
    <div className="border border-sky-500/30 rounded-xl bg-[#0d1520] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-sky-900/20 hover:bg-sky-900/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-extrabold text-sky-300 uppercase tracking-widest">Fuel Planner</span>
          {!wxLoading && fuelCalc && (
            <span className="text-[10px] font-bold text-white bg-sky-600/40 px-2 py-0.5 rounded">
              {fuelCalc.minRequired.toLocaleString()} lbs min
            </span>
          )}
          {wxLoading && <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <span onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-3 h-3 text-gray-400" />
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4">

          {/* Aircraft type row */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">Aircraft:</span>
            <span className="font-bold text-white">{flight.aircraft_tail || '—'}</span>
            {resolvedType && (
              <span className="font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">{resolvedType}</span>
            )}
            {!resolvedType && (
              <span className="text-amber-400 text-[10px]">Type unknown — using default profile</span>
            )}
          </div>

          {/* Error */}
          {wxError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Failed to fetch weather data — fuel estimate unavailable
            </div>
          )}

          {/* Loading */}
          {wxLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              Fetching weather and distance from FlightAware…
            </div>
          )}

          {/* Weather strip */}
          {wxData && !wxLoading && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: flight.origin, category: wxData.origin_flight_category, wind: wxData.origin_weather },
                { label: flight.destination, category: wxData.destination_flight_category, wind: wxData.destination_weather },
              ].map(({ label, category, wind }) => (
                <div key={label} className="bg-[#141922] rounded-xl px-3 py-2.5 border border-white/8">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-white font-mono">{label}</span>
                    <FlightCategoryBadge category={category} />
                  </div>
                  {wind ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Wind className="w-3 h-3 text-sky-400" />
                      <span>{wind.direction ?? '—'}° @ {wind.speed_kts ?? '—'}kts</span>
                      {wind.gusts_kts && <span className="text-amber-400">G{wind.gusts_kts}</span>}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-600">No METAR available</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fuel breakdown */}
          {fuelCalc && !wxLoading && (
            <div className="space-y-3">
              {/* Distance + Time */}
              <div className="flex items-center gap-4 text-xs text-gray-400 border-b border-white/8 pb-2">
                <span>Distance: <strong className="text-white">{fuelCalc.distNm} NM</strong></span>
                <span>Est. Time: <strong className="text-white">{Math.floor(fuelCalc.flightTimeMin / 60)}h {fuelCalc.flightTimeMin % 60}m</strong></span>
                {(fuelCalc.wxFactor > 1 || fuelCalc.windFactor > 1) && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Weather/wind penalty applied
                  </span>
                )}
              </div>

              {/* Fuel rows */}
              <div className="space-y-1.5">
                {[
                  { label: 'Trip Fuel',      value: fuelCalc.tripFuelLbs, color: 'text-white' },
                  { label: 'Contingency (5%)', value: fuelCalc.contingency, color: 'text-gray-300' },
                  { label: 'Alternate Fuel', value: fuelCalc.alternateFuel, color: 'text-gray-300' },
                  { label: 'Final Reserve',  value: fuelCalc.finalReserve, color: 'text-gray-300' },
                  { label: 'Taxi Allowance', value: fuelCalc.taxiFuel, color: 'text-gray-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className={cn('font-mono font-bold', color)}>{value.toLocaleString()} lbs</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-extrabold text-white">Min. Block Fuel Required</span>
                </div>
                <span className="text-lg font-black text-sky-300 font-mono">{fuelCalc.minRequired.toLocaleString()} lbs</span>
              </div>

              {/* kg equivalent */}
              <p className="text-[10px] text-gray-600 text-right">
                ≈ {Math.round(fuelCalc.minRequired * 0.4536).toLocaleString()} kg
              </p>
            </div>
          )}

          {/* No data yet */}
          {!wxLoading && !wxError && !fuelCalc && wxData && (
            <p className="text-xs text-gray-600 text-center py-2">Could not compute distance — airport coordinates unavailable</p>
          )}
        </div>
      )}
    </div>
  );
}