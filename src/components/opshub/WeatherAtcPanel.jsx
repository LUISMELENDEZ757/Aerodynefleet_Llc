import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Wind, AlertTriangle, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CATEGORY_CFG = {
  VFR:  { color: 'text-green-400',  bg: 'bg-green-500/15',  label: 'VFR'  },
  MVFR: { color: 'text-blue-400',   bg: 'bg-blue-500/15',   label: 'MVFR' },
  IFR:  { color: 'text-red-400',    bg: 'bg-red-500/15',    label: 'IFR'  },
  LIFR: { color: 'text-purple-400', bg: 'bg-purple-500/15', label: 'LIFR' },
};

// Extract key stations from active dispatch releases
function extractStations(releases) {
  const stations = new Set();
  releases.forEach(r => {
    if (r.origin) stations.add(r.origin);
    if (r.destination) stations.add(r.destination);
    if (r.alternate) stations.add(r.alternate);
  });
  return [...stations].slice(0, 8);
}

function parseWeatherCategory(metar) {
  if (!metar) return null;
  if (metar.includes('LIFR') || metar.match(/\bR\d+\/M\d+/)) return 'LIFR';
  if (metar.includes(' IFR') || metar.match(/BKN0[0-2]\d|OVC0[0-2]\d/)) return 'IFR';
  if (metar.includes('MVFR') || metar.match(/BKN0[3-4]\d|OVC0[3-4]\d/)) return 'MVFR';
  return 'VFR';
}

export default function WeatherAtcPanel({ releases }) {
  // Derive weather from dispatch monitoring data
  const { data: monitoring = [] } = useQuery({
    queryKey: ['opshub-monitoring'],
    queryFn: () => base44.entities.DispatchMonitoring.list('-created_date', 50),
    refetchInterval: 120000,
  });

  const stationsWithWeather = monitoring
    .filter(m => m.weather_monitoring?.current_metar_destination)
    .slice(0, 6)
    .map(m => ({
      station: m.destination,
      metar: m.weather_monitoring.current_metar_destination,
      trend: m.weather_monitoring.destination_trend,
      sigmets: m.weather_monitoring.active_sigmets || [],
    }));

  const deteriorating = stationsWithWeather.filter(s => s.trend === 'deteriorating').length;
  const activeSigmets = stationsWithWeather.flatMap(s => s.sigmets).filter(Boolean);

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <p className="text-sm font-extrabold text-white tracking-wide">WEATHER & ATC</p>
        </div>
        <Link to="/Weather" className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">
          Full Wx <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1117] rounded-xl px-3 py-2 text-center">
            <p className={cn('text-xl font-extrabold', deteriorating > 0 ? 'text-amber-400' : 'text-green-400')}>{deteriorating}</p>
            <p className="text-[10px] text-gray-500">Deteriorating</p>
          </div>
          <div className="bg-[#0d1117] rounded-xl px-3 py-2 text-center">
            <p className={cn('text-xl font-extrabold', activeSigmets.length > 0 ? 'text-red-400' : 'text-green-400')}>{activeSigmets.length}</p>
            <p className="text-[10px] text-gray-500">SIGMETs</p>
          </div>
          <div className="bg-[#0d1117] rounded-xl px-3 py-2 text-center">
            <p className="text-xl font-extrabold text-primary">{stationsWithWeather.length}</p>
            <p className="text-[10px] text-gray-500">Stations</p>
          </div>
        </div>

        {/* Station weather list */}
        {stationsWithWeather.length > 0 ? (
          <div className="space-y-1.5">
            {stationsWithWeather.map(({ station, metar, trend }) => {
              const cat = parseWeatherCategory(metar);
              const cfg = cat ? CATEGORY_CFG[cat] : CATEGORY_CFG.VFR;
              return (
                <div key={station} className="flex items-center gap-2 bg-[#0d1117] rounded-lg px-3 py-2">
                  <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  <span className="text-xs font-mono font-bold text-white w-10 flex-shrink-0">{station}</span>
                  {cat && <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded flex-shrink-0', cfg.bg, cfg.color)}>{cfg.label}</span>}
                  <span className="text-[10px] text-gray-500 flex-1 truncate">{metar?.slice(0, 40)}</span>
                  {trend === 'deteriorating' && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                  {trend === 'improving' && <span className="text-[10px] text-green-400 flex-shrink-0">↑</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0d1117] rounded-xl px-4 py-4 text-center">
            <Cloud className="w-7 h-7 text-gray-700 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Weather data populates from active dispatch monitoring</p>
            <Link to="/Weather" className="text-[10px] text-primary mt-1 block">Open Weather Dashboard →</Link>
          </div>
        )}

        {/* Active SIGMETs */}
        {activeSigmets.length > 0 && (
          <div className="bg-red-900/15 border border-red-500/20 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Wind className="w-3 h-3" /> Active SIGMETs
            </p>
            {activeSigmets.slice(0, 2).map((s, i) => (
              <p key={i} className="text-[10px] text-red-300 leading-relaxed">{s}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}