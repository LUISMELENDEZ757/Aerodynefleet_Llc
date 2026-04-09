import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Wind, AlertTriangle, ArrowRight, MapPin, Thermometer, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMultiStationWeather } from '@/hooks/useOpenMeteo';

const CATEGORY_CFG = {
  VFR:  { color: 'text-green-400',  bg: 'bg-green-500/15',  label: 'VFR'  },
  MVFR: { color: 'text-blue-400',   bg: 'bg-blue-500/15',   label: 'MVFR' },
  IFR:  { color: 'text-red-400',    bg: 'bg-red-500/15',    label: 'IFR'  },
  LIFR: { color: 'text-purple-400', bg: 'bg-purple-500/15', label: 'LIFR' },
};


const HUB_STATIONS = ['KEWR', 'KJFK', 'KORD', 'KATL', 'KLAX', 'KDFW', 'KDEN', 'KBOS'];

function wmoToFlightCat(code, windspeed_kt = 0) {
  if (code >= 95) return 'IFR';
  if (code >= 50 && code <= 69) return 'MVFR';
  if (code >= 70 && code <= 79) return 'IFR';
  if (windspeed_kt > 25) return 'MVFR';
  return 'VFR';
}

export default function WeatherAtcPanel({ releases }) {
  const { data: liveWx = [], isLoading: wxLoading } = useMultiStationWeather(HUB_STATIONS);

  const stationsWithWeather = liveWx.map(wx => ({
    station: wx.icao,
    cat: wmoToFlightCat(wx.weathercode, wx.windspeed_kt),
    temp_c: wx.temp_c,
    temp_f: wx.temp_f,
    windspeed_kt: wx.windspeed_kt,
    winddirection: wx.winddirection,
    condition: wx.condition,
    is_day: wx.is_day,
  }));

  const deteriorating = stationsWithWeather.filter(s => s.cat === 'IFR' || s.cat === 'LIFR').length;
  const activeSigmets = [];

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
            <p className="text-xl font-extrabold text-primary">{wxLoading ? '…' : stationsWithWeather.length}</p>
            <p className="text-[10px] text-gray-500">Live Stations</p>
          </div>
        </div>

        {/* Live station weather grid */}
        {wxLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
            <RefreshCw className="w-3 h-3 animate-spin" /> Fetching live weather…
          </div>
        ) : stationsWithWeather.length > 0 ? (
          <div className="space-y-1.5">
            {stationsWithWeather.map(({ station, cat, temp_c, windspeed_kt, winddirection, condition }) => {
              const cfg = CATEGORY_CFG[cat] || CATEGORY_CFG.VFR;
              return (
                <div key={station} className="flex items-center gap-2 bg-[#0d1117] rounded-lg px-3 py-2">
                  <span className="text-sm flex-shrink-0">{condition.icon}</span>
                  <span className="text-xs font-mono font-bold text-white w-10 flex-shrink-0">{station}</span>
                  <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded flex-shrink-0', cfg.bg, cfg.color)}>{cat}</span>
                  <span className="text-[10px] text-white flex-shrink-0">{temp_c}°C</span>
                  <span className="text-[10px] text-gray-500 flex-1 truncate flex items-center gap-1">
                    <Wind className="w-2.5 h-2.5 inline" /> {windspeed_kt}kt {winddirection}°
                  </span>
                  {(cat === 'IFR' || cat === 'LIFR') && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0d1117] rounded-xl px-4 py-4 text-center">
            <Cloud className="w-7 h-7 text-gray-700 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Connecting to Open-Meteo…</p>
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