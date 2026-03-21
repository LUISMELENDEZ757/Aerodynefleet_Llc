import React from 'react';
import { Wind, Droplets, Gauge } from 'lucide-react';

export default function OpenWeatherCard({ weather, station, isLoading, error }) {
  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Loading weather…</div>;
  }

  if (error) {
    return <div className="text-xs text-orange-400">Unable to load weather data.</div>;
  }

  if (!weather) return null;

  const current = weather.current_weather;
  const hourly = weather.hourly;
  
  if (!current) return null;
  
  const temp = Math.round(current.temperature);
  const windSpeed = current.wind_speed;
  const windDir = current.wind_direction;
  const humidity = hourly?.relative_humidity_2m?.[0] || 0;
  const precipitation = hourly?.precipitation?.[0] || 0;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 bg-secondary/40 flex items-center justify-between border-b border-border/50">
        <div>
          <p className="text-sm font-mono font-bold text-foreground">{station}</p>
          <p className="text-xs text-muted-foreground">Open-Meteo</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold font-mono text-foreground">{temp}°</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
        <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
          <Wind className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Wind</p>
            <p className="text-sm font-mono font-bold text-foreground">
              {String(windDir).padStart(3, '0')}° @ {windSpeed}m/s
            </p>
          </div>
        </div>
        <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
          <Droplets className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className="text-sm font-mono font-bold text-foreground">{humidity}%</p>
          </div>
        </div>
        <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
          <Gauge className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Precip</p>
            <p className="text-sm font-mono font-bold text-foreground">{precipitation}mm</p>
          </div>
        </div>
        <div className="bg-background/40 rounded-lg px-3 py-2 flex items-start gap-2">
          <div className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="text-sm font-mono font-bold text-foreground">{new Date(current.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}