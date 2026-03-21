import React from 'react';
import { Cloud, Wind, Eye, Droplets, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OpenWeatherCard({ weather, station }) {
  if (!weather) return null;

  const temp = Math.round(weather.main?.temp || 0);
  const feelsLike = Math.round(weather.main?.feels_like || 0);
  const humidity = weather.main?.humidity;
  const windSpeed = weather.wind?.speed;
  const windDir = weather.wind?.deg;
  const visibility = weather.visibility ? (weather.visibility / 1000).toFixed(1) : null;
  const pressure = weather.main?.pressure;
  const desc = weather.weather?.[0]?.main || 'Unknown';
  const icon = weather.weather?.[0]?.icon;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 bg-secondary/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <img
              src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
              alt={desc}
              className="w-10 h-10"
            />
          )}
          <div>
            <p className="text-sm font-mono font-bold text-foreground">{station}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold font-mono text-foreground">{temp}°</p>
          <p className="text-xs text-muted-foreground">Feels {feelsLike}°</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
        {windSpeed != null && (
          <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
            <Wind className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="text-sm font-mono font-bold text-foreground">
                {windDir != null ? `${String(windDir).padStart(3, '0')}°` : 'VRB'} @ {windSpeed}m/s
              </p>
            </div>
          </div>
        )}
        {humidity != null && (
          <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
            <Droplets className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-sm font-mono font-bold text-foreground">{humidity}%</p>
            </div>
          </div>
        )}
        {visibility && (
          <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
            <Eye className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Visibility</p>
              <p className="text-sm font-mono font-bold text-foreground">{visibility} km</p>
            </div>
          </div>
        )}
        {pressure && (
          <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
            <Gauge className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Pressure</p>
              <p className="text-sm font-mono font-bold text-foreground">{pressure} hPa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}