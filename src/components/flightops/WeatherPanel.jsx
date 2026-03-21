import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cloud, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, Wind, Eye, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeatherByCity, AIRPORT_COORDS } from '@/hooks/useOpenWeather';
import OpenWeatherCard from '@/components/weather/OpenWeatherCard';

// Aviation Weather Center — no API key required
const AWC_BASE = 'https://aviationweather.gov/api/data';

async function fetchMetar(icao) {
  const res = await fetch(`${AWC_BASE}/metar?ids=${icao}&format=json&hours=2`);
  if (!res.ok) throw new Error('METAR fetch failed');
  const data = await res.json();
  return data[0] || null;
}

async function fetchTaf(icao) {
  const res = await fetch(`${AWC_BASE}/taf?ids=${icao}&format=json`);
  if (!res.ok) throw new Error('TAF fetch failed');
  const data = await res.json();
  return data[0] || null;
}

// Flight category color
function flightCatColor(cat) {
  if (!cat) return 'text-muted-foreground bg-muted';
  switch (cat.toUpperCase()) {
    case 'VFR':  return 'text-green-400 bg-green-500/15';
    case 'MVFR': return 'text-blue-400 bg-blue-500/15';
    case 'IFR':  return 'text-destructive bg-destructive/15';
    case 'LIFR': return 'text-purple-400 bg-purple-500/15';
    default:     return 'text-muted-foreground bg-muted';
  }
}

function WindBadge({ wdir, wspd, wgst }) {
  if (!wspd && wspd !== 0) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-mono text-foreground">
      <Wind className="w-3 h-3 text-muted-foreground" />
      {wdir != null ? `${String(wdir).padStart(3,'0')}°` : 'VRB'} @ {wspd}kt
      {wgst ? ` G${wgst}kt` : ''}
    </span>
  );
}

function StationCard({ icao }) {
  const [expanded, setExpanded] = useState(false);
  const [showOpenWeather, setShowOpenWeather] = useState(false);
  const coords = AIRPORT_COORDS[icao];

  const { data: metar, isLoading: mLoading, error: mError, refetch: refetchMetar } = useQuery({
    queryKey: ['metar', icao],
    queryFn: () => fetchMetar(icao),
    refetchInterval: 5 * 60 * 1000, // every 5 min
    retry: 1,
  });

  const { data: taf, isLoading: tLoading, error: tError } = useQuery({
    queryKey: ['taf', icao],
    queryFn: () => fetchTaf(icao),
    refetchInterval: 15 * 60 * 1000, // every 15 min
    retry: 1,
    enabled: expanded,
  });

  const { data: owWeather, isLoading: owLoading, error: owError } = useWeatherByCity(coords?.name || icao, showOpenWeather && !!coords);

  const isLoading = mLoading;
  const cat = metar?.flightCategory;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Station header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn('text-xs font-mono font-bold px-2 py-0.5 rounded', flightCatColor(cat))}>
            {cat || '---'}
          </span>
          <div className="text-left">
            <p className="text-sm font-bold font-mono text-foreground">{icao}</p>
            {metar?.name && <p className="text-xs text-muted-foreground">{metar.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {metar && <WindBadge wdir={metar.wdir} wspd={metar.wspd} wgst={metar.wgst} />}
          {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          {(mError || tError) && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* METAR raw */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" /> METAR
              {metar?.reportTime && (
                <span className="font-normal normal-case tracking-normal ml-1">
                  · {new Date(metar.reportTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                </span>
              )}
            </p>
            {mError ? (
              <p className="text-xs text-orange-400">Unable to fetch METAR</p>
            ) : metar?.rawOb ? (
              <p className="text-xs font-mono text-foreground bg-background/60 rounded-lg px-3 py-2 leading-relaxed break-all">
                {metar.rawOb}
              </p>
            ) : isLoading ? (
              <p className="text-xs text-muted-foreground">Fetching…</p>
            ) : (
              <p className="text-xs text-muted-foreground">No METAR available</p>
            )}
          </div>

          {/* Decoded summary */}
          {metar && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metar.visib != null && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Vis</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metar.visib} SM</p>
                </div>
              )}
              {metar.altim != null && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground">Altimeter</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metar.altim.toFixed(2)}"</p>
                </div>
              )}
              {metar.temp != null && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Thermometer className="w-3 h-3" /> Temp</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metar.temp}°C / {metar.dewp}°C</p>
                </div>
              )}
              {metar.clouds?.length > 0 && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground">Ceiling</p>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {metar.clouds[0].cover} {metar.clouds[0].base != null ? `${metar.clouds[0].base}'` : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAF */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">TAF</p>
            {tError ? (
              <p className="text-xs text-orange-400">Unable to fetch TAF</p>
            ) : tLoading ? (
              <p className="text-xs text-muted-foreground">Fetching TAF…</p>
            ) : taf?.rawTAF ? (
              <p className="text-xs font-mono text-foreground bg-background/60 rounded-lg px-3 py-2 leading-relaxed break-all whitespace-pre-wrap">
                {taf.rawTAF}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No TAF available</p>
            )}
          </div>

          {/* OpenWeather */}
          {coords && (
            <div>
              <button
                onClick={() => setShowOpenWeather(!showOpenWeather)}
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors flex items-center gap-1"
              >
                {showOpenWeather ? '▼' : '▶'} OpenWeather
              </button>
              {showOpenWeather && <OpenWeatherCard weather={owWeather} station={icao} isLoading={owLoading} error={owError} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WeatherPanel({ flights }) {
  // Collect unique airports from today's flights
  const stations = React.useMemo(() => {
    const icaos = new Set();
    flights.forEach(f => {
      if (f.origin) icaos.add(f.origin);
      if (f.destination) icaos.add(f.destination);
    });
    return [...icaos];
  }, [flights]);

  if (stations.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No flights loaded — add flights to see live weather
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Live data from <span className="text-primary font-semibold">aviationweather.gov</span> · METAR refreshes every 5 min · TAF every 15 min
      </p>
      {stations.map(icao => (
        <StationCard key={icao} icao={icao} />
      ))}
    </div>
  );
}