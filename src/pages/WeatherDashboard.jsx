import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';
import {
  Cloud, Wind, Eye, Thermometer, Gauge, RefreshCw,
  AlertTriangle, ChevronDown, ChevronRight, Search, MapPin, Zap
} from 'lucide-react';
import { useWeatherByCity, AIRPORT_COORDS } from '@/hooks/useOpenWeather';
import OpenWeatherCard from '@/components/weather/OpenWeatherCard';

const DEFAULT_STATIONS = ['KEWR', 'KJFK', 'KORD', 'KLAX', 'KATL', 'KDFW', 'KSEA', 'KMIA'];

async function fetchMetar(icao) {
  try {
    const res = await base44.functions.invoke('fetchWeatherData', { type: 'metar', icao });
    return res.data[0] || null;
  } catch (err) {
    console.error('METAR fetch error:', err.message);
    throw err;
  }
}

async function fetchTaf(icao) {
  try {
    const res = await base44.functions.invoke('fetchWeatherData', { type: 'taf', icao });
    return res.data[0] || null;
  } catch (err) {
    console.error('TAF fetch error:', err.message);
    throw err;
  }
}

async function fetchSigmet() {
  try {
    const res = await base44.functions.invoke('fetchWeatherData', { type: 'sigmet' });
    return res.data;
  } catch (err) {
    console.error('SIGMET fetch error:', err.message);
    throw err;
  }
}

const FLIGHT_CAT = {
  VFR:  { color: 'text-green-400',    bg: 'bg-green-500/15',    border: 'border-green-500/30' },
  MVFR: { color: 'text-blue-400',     bg: 'bg-blue-500/15',     border: 'border-blue-500/30' },
  IFR:  { color: 'text-destructive',  bg: 'bg-destructive/15',  border: 'border-destructive/30' },
  LIFR: { color: 'text-purple-400',   bg: 'bg-purple-500/15',   border: 'border-purple-500/30' },
};

function catCfg(cat) {
  return FLIGHT_CAT[cat?.toUpperCase()] || { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' };
}

// ── Summary Card (compact grid tile) ────────────────────────────────────────
function StationSummary({ icao, onClick, selected, pollingInterval }) {
  const { data: metar, isLoading, error } = useQuery({
    queryKey: ['metar', icao],
    queryFn: () => fetchMetar(icao),
    refetchInterval: pollingInterval,
    retry: 1,
  });

  const cat = metar?.flightCategory;
  const cfg = catCfg(cat);

  return (
     <button
       onClick={() => onClick(icao)}
       aria-pressed={selected}
       aria-label={`${icao} weather station: ${isLoading ? 'loading' : error ? 'unavailable' : `${cat || 'unknown flight category'}`}`}
       className={cn(
         'rounded-xl border p-3 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
         selected ? `${cfg.bg} ${cfg.border} border-2` : 'bg-card border-border hover:border-primary/40'
       )}
     >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-mono font-extrabold text-foreground">{icao}</span>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
          {isLoading ? '…' : error ? 'ERR' : cat || '---'}
        </span>
      </div>
      {metar && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wind className="w-3 h-3" />
            <span className="font-mono">
              {metar.wdir != null ? String(metar.wdir).padStart(3, '0') : 'VRB'}°/{metar.wspd ?? '--'}kt
              {metar.wgst ? ` G${metar.wgst}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span className="font-mono">{metar.visib ?? '--'} SM</span>
            {metar.clouds?.[0] && (
              <span className="font-mono ml-1">{metar.clouds[0].cover} {metar.clouds[0].base != null ? `${metar.clouds[0].base}'` : ''}</span>
            )}
          </div>
          {metar.temp != null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Thermometer className="w-3 h-3" />
              <span className="font-mono">{metar.temp}°C / {metar.dewp}°C</span>
              {metar.altim != null && <span className="font-mono ml-1">{metar.altim.toFixed(2)}"</span>}
            </div>
          )}
        </div>
      )}
      {isLoading && <p className="text-xs text-muted-foreground mt-1">Loading…</p>}
      {error && <p className="text-xs text-orange-400 mt-1">Unavailable</p>}
    </button>
  );
}

// ── Detail Panel ─────────────────────────────────────────────────────────────
function StationDetail({ icao, pollingInterval }) {
  const [showOpenWeather, setShowOpenWeather] = useState(false);
  const coords = AIRPORT_COORDS[icao];
  const tafPollingInterval = Math.max(pollingInterval * 3, 15 * 60 * 1000); // TAF less frequent

  const { data: metar, isLoading: mLoad, error: mErr, refetch: rMetar } = useQuery({
    queryKey: ['metar', icao],
    queryFn: () => fetchMetar(icao),
    refetchInterval: pollingInterval,
    retry: 1,
  });

  const { data: taf, isLoading: tLoad, error: tErr } = useQuery({
    queryKey: ['taf', icao],
    queryFn: () => fetchTaf(icao),
    refetchInterval: tafPollingInterval,
    retry: 1,
  });

  const { data: owWeather, isLoading: owLoading, error: owError } = useWeatherByCity(coords?.name || icao, showOpenWeather && !!coords);

  const cat = metar?.flightCategory;
  const cfg = catCfg(cat);

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className={cn('px-4 py-3 border-b border-border flex items-center justify-between', cfg.bg)}>
        <div className="flex items-center gap-3">
          <MapPin className={cn('w-4 h-4', cfg.color)} />
          <div>
            <p className="text-base font-mono font-extrabold text-foreground">{icao}</p>
            {metar?.name && <p className="text-xs text-muted-foreground">{metar.name}</p>}
          </div>
          <span className={cn('text-sm font-extrabold px-3 py-1 rounded-full', cfg.bg, cfg.color, 'border', cfg.border)}>
            {mLoad ? '…' : mErr ? 'ERR' : cat || '---'}
          </span>
        </div>
        <button 
          onClick={rMetar} 
          aria-label={`Refresh METAR for ${icao}`}
          className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-lg p-1"
        >
           <RefreshCw className="w-4 h-4" aria-hidden="true" />
         </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Decoded summary grid */}
        {metar && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: Wind,        label: 'Wind',      value: metar.wdir != null ? `${String(metar.wdir).padStart(3,'0')}°/${metar.wspd}kt${metar.wgst ? ` G${metar.wgst}` : ''}` : `VRB/${metar.wspd ?? '--'}kt` },
              { icon: Eye,         label: 'Visibility', value: `${metar.visib ?? '--'} SM` },
              { icon: Thermometer, label: 'Temp/Dew',  value: `${metar.temp ?? '--'}°C / ${metar.dewp ?? '--'}°C` },
              { icon: Gauge,       label: 'Altimeter', value: metar.altim != null ? `${metar.altim.toFixed(2)}"` : '--' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-secondary/40 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1">
                  <Icon className="w-3 h-3" />{label}
                </p>
                <p className="text-sm font-mono font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Clouds */}
        {metar?.clouds?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" /> Cloud Layers
            </p>
            <div className="flex flex-wrap gap-2">
              {metar.clouds.map((c, i) => (
                <span key={i} className="bg-secondary/50 rounded-lg px-3 py-1.5 text-xs font-mono text-foreground">
                  {c.cover} {c.base != null ? `@ ${c.base.toLocaleString()}'` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Raw METAR */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5" /> Raw METAR
            {metar?.reportTime && (
              <span className="font-normal normal-case tracking-normal text-muted-foreground ml-1">
                · {new Date(metar.reportTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
              </span>
            )}
          </p>
          {mErr ? (
            <p className="text-xs text-orange-400">Unable to fetch METAR</p>
          ) : mLoad ? (
            <p className="text-xs text-muted-foreground">Fetching…</p>
          ) : metar?.rawOb ? (
            <p className="text-xs font-mono text-foreground bg-background/60 rounded-lg px-3 py-2 leading-relaxed break-all">{metar.rawOb}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No METAR available</p>
          )}
        </div>

        {/* TAF */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">TAF Forecast</p>
          {tErr ? (
            <p className="text-xs text-orange-400">Unable to fetch TAF</p>
          ) : tLoad ? (
            <p className="text-xs text-muted-foreground">Fetching TAF…</p>
          ) : taf?.rawTAF ? (
            <p className="text-xs font-mono text-foreground bg-background/60 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap break-all">{taf.rawTAF}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No TAF available</p>
          )}
        </div>

        {/* OpenWeather Section */}
        {coords && (
          <div>
            <button
              onClick={() => setShowOpenWeather(!showOpenWeather)}
              aria-expanded={showOpenWeather}
              aria-label={`${showOpenWeather ? 'Hide' : 'Show'} OpenWeather details for ${icao}`}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded px-2 py-1"
            >
             <span aria-hidden="true">{showOpenWeather ? '▼' : '▶'}</span> OpenWeather
            </button>
            {showOpenWeather && <OpenWeatherCard weather={owWeather} station={icao} isLoading={owLoading} error={owError} />}
            </div>
            )}
            </div>
            </div>
            );
            }

// ── SIGMET Banner ─────────────────────────────────────────────────────────────
function SigmetBanner() {
  const { data: sigmets = [], isLoading } = useQuery({
    queryKey: ['sigmets'],
    queryFn: fetchSigmet,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });

  if (isLoading || sigmets.length === 0) return null;

  return (
    <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
      <p className="text-xs font-bold text-destructive flex items-center gap-1.5 mb-2" role="alert" aria-live="polite">
         <Zap className="w-3.5 h-3.5" aria-hidden="true" /> ACTIVE SIGMETS ({sigmets.length})
       </p>
      <div className="space-y-1">
        {sigmets.slice(0, 3).map((s, i) => (
          <p key={i} className="text-xs font-mono text-foreground bg-background/40 rounded px-2 py-1">
            {s.rawAirSigmet || s.alphaChar || JSON.stringify(s).slice(0, 100)}
          </p>
        ))}
        {sigmets.length > 3 && <p className="text-xs text-muted-foreground">+{sigmets.length - 3} more</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WeatherDashboard() {
  const [stations, setStations] = useState(DEFAULT_STATIONS);
  const [selected, setSelected] = useState(DEFAULT_STATIONS[0]);
  const [searchInput, setSearchInput] = useState('');
  const pollingInterval = useDynamicPolling(5 * 60 * 1000, 15 * 60 * 1000); // 5m active, 15m hidden

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const addStation = () => {
    const icao = searchInput.trim().toUpperCase();
    if (icao.length >= 3 && !stations.includes(icao)) {
      setStations(prev => [...prev, icao]);
      setSelected(icao);
    }
    setSearchInput('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" aria-label="Go to Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
              <Cloud className="w-5 h-5 text-primary" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">WEATHER DASHBOARD</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Live METAR · TAF · SIGMET · aviationweather.gov</p>
            </div>
          </div>
          <p className="text-lg font-mono font-bold text-foreground flex-shrink-0">{timeStr} Z</p>
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-3 flex-wrap" role="region" aria-label="Flight category legend">
          {[
            { cat: 'VFR',  label: 'VFR > 3SM & > 1000\'' },
            { cat: 'MVFR', label: 'MVFR 1–3SM / 500–1000\'' },
            { cat: 'IFR',  label: 'IFR < 1SM / < 500\'' },
            { cat: 'LIFR', label: 'LIFR < ½SM / < 200\'' },
          ].map(({ cat, label }) => {
            const c = catCfg(cat);
            return (
              <span key={cat} className={cn('text-xs font-bold px-2 py-0.5 rounded-full', c.bg, c.color)}>
                {cat} — {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* SIGMET alerts */}
        <SigmetBanner />

        {/* Search / add station */}
        <div className="flex gap-2" role="region" aria-label="Add aviation weather station">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              id="station-search"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && addStation()}
              placeholder="Add ICAO station (e.g. EGLL)"
              maxLength={4}
              aria-label="Enter ICAO station code to add to weather dashboard"
              className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={addStation}
            aria-label="Add ICAO station to weather dashboard"
            className="h-10 px-4 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          >
            Add
          </button>
        </div>

        {/* Station grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2" role="region" aria-label="Aviation weather stations">
          {stations.map(icao => (
            <StationSummary
              key={icao}
              icao={icao}
              selected={selected === icao}
              onClick={setSelected}
              pollingInterval={pollingInterval}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selected && <StationDetail icao={selected} pollingInterval={pollingInterval} />}

        <p className="text-xs text-muted-foreground text-center">
          Data from <span className="text-primary font-semibold">aviationweather.gov</span> · METAR auto-refreshes every 5 min · TAF every 15 min
        </p>
      </div>
    </div>
  );
}