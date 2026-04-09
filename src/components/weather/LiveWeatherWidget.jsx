/**
 * LiveWeatherWidget — compact weather card using Open-Meteo
 * Usage: <LiveWeatherWidget icao="KEWR" /> or <LiveWeatherWidget lat={40.69} lon={-74.17} />
 */
import { Wind, Thermometer, Navigation, RefreshCw } from 'lucide-react';
import { useStationWeather } from '@/hooks/useOpenMeteo';
import { cn } from '@/lib/utils';

function WindArrow({ degrees }) {
  return (
    <span
      style={{ display: 'inline-block', transform: `rotate(${degrees}deg)` }}
      className="text-sm"
    >↑</span>
  );
}

export default function LiveWeatherWidget({ icao, lat, lon, compact = false, className }) {
  const coords = lat != null ? [lat, lon] : icao;
  const { data: wx, isLoading, error, refetch } = useStationWeather(coords);

  if (isLoading) return (
    <div className={cn('flex items-center gap-2 text-xs text-gray-500', className)}>
      <RefreshCw className="w-3 h-3 animate-spin" /> Fetching weather…
    </div>
  );

  if (error || !wx) return (
    <div className={cn('text-xs text-gray-600', className)}>Weather unavailable</div>
  );

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-xs', className)}>
        <span className="text-base">{wx.condition.icon}</span>
        <span className="font-bold text-white">{wx.temp_c}°C / {wx.temp_f}°F</span>
        <span className="text-gray-400">{wx.condition.label}</span>
        <span className="text-gray-500 flex items-center gap-0.5">
          <WindArrow degrees={wx.winddirection} />
          {wx.windspeed_kt}kt
        </span>
      </div>
    );
  }

  return (
    <div className={cn('bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3', className)}>
      <div className="flex items-start justify-between">
        <div>
          {icao && <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1">{icao}</p>}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{wx.condition.icon}</span>
            <p className="text-2xl font-black text-white">{wx.temp_c}°C</p>
            <p className="text-sm text-gray-500">{wx.temp_f}°F</p>
          </div>
          <p className="text-sm text-gray-300 mt-0.5">{wx.condition.label}</p>
        </div>
        <button onClick={() => refetch()} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <RefreshCw className="w-3 h-3 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0d1117] rounded-xl p-2.5 flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <div>
            <p className="text-xs font-bold text-white">{wx.windspeed_kt}kt</p>
            <p className="text-[10px] text-gray-500">Wind</p>
          </div>
        </div>
        <div className="bg-[#0d1117] rounded-xl p-2.5 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-blue-400" style={{ transform: `rotate(${wx.winddirection}deg)` }} />
          <div>
            <p className="text-xs font-bold text-white">{wx.winddirection}°</p>
            <p className="text-[10px] text-gray-500">From</p>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-gray-600 text-right">Open-Meteo · Live</p>
    </div>
  );
}