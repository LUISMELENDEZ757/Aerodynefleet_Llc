/**
 * useOpenMeteo — Fetches live current weather from Open-Meteo (no API key required)
 * Accepts lat/lon or a known ICAO → coordinates map.
 * Returns { temp_c, temp_f, windspeed_kmh, windspeed_kt, winddirection, weathercode, condition, is_day, loading, error }
 */

import { useQuery } from '@tanstack/react-query';

// WMO weather interpretation codes → human-readable condition
export function wmoCondition(code) {
  if (code === 0)            return { label: 'Clear',           icon: '☀️' };
  if (code <= 2)             return { label: 'Partly Cloudy',   icon: '⛅' };
  if (code === 3)            return { label: 'Overcast',        icon: '☁️' };
  if (code <= 49)            return { label: 'Fog / Mist',      icon: '🌫️' };
  if (code <= 59)            return { label: 'Drizzle',         icon: '🌦️' };
  if (code <= 69)            return { label: 'Rain',            icon: '🌧️' };
  if (code <= 79)            return { label: 'Snow',            icon: '❄️' };
  if (code <= 82)            return { label: 'Rain Showers',    icon: '🌦️' };
  if (code <= 86)            return { label: 'Snow Showers',    icon: '🌨️' };
  if (code <= 99)            return { label: 'Thunderstorm',    icon: '⛈️' };
  return                            { label: 'Unknown',         icon: '🌡️' };
}

// Known major hub coordinates (ICAO → [lat, lon])
export const ICAO_COORDS = {
  KEWR: [40.6895, -74.1745],
  KJFK: [40.6413, -73.7781],
  KLAX: [33.9425, -118.4081],
  KORD: [41.9742, -87.9073],
  KATL: [33.6407, -84.4277],
  KDFW: [32.8998, -97.0403],
  KDEN: [39.8561, -104.6737],
  KSFO: [37.6213, -122.379],
  KMIA: [25.7959, -80.287],
  KBOS: [42.3656, -71.0096],
  KPHL: [39.8719, -75.2411],
  KIAD: [38.9531, -77.4565],
  KDCA: [38.8521, -77.0377],
  KBWI: [39.1774, -76.668],
  KMSP: [44.882, -93.2218],
  KSEA: [47.4502, -122.3088],
  KPHX: [33.4373, -112.0078],
  KLAS: [36.084, -115.1537],
  EGLL: [51.477,   -0.461],
  LFPG: [49.0097,   2.5479],
  EDDF: [50.0379,   8.5622],
  LEMD: [40.4719,  -3.5626],
  LIRF: [41.8003,  12.2389],
  EHAM: [52.3086,   4.7639],
};

async function fetchMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  const w = data.current_weather;
  return {
    temp_c: w.temperature,
    temp_f: Math.round(w.temperature * 9 / 5 + 32),
    windspeed_kmh: w.windspeed,
    windspeed_kt: Math.round(w.windspeed / 1.852),
    winddirection: w.winddirection,
    weathercode: w.weathercode,
    condition: wmoCondition(w.weathercode),
    is_day: w.is_day === 1,
  };
}

/** Hook for a single station by ICAO or explicit lat/lon */
export function useStationWeather(icaoOrCoords, options = {}) {
  const coords = typeof icaoOrCoords === 'string'
    ? ICAO_COORDS[icaoOrCoords]
    : icaoOrCoords;

  return useQuery({
    queryKey: ['open-meteo', icaoOrCoords],
    queryFn: () => coords ? fetchMeteo(coords[0], coords[1]) : null,
    enabled: !!coords,
    refetchInterval: options.refetchInterval ?? 300000, // 5 min default
    staleTime: 240000,
  });
}

/** Hook for multiple stations in parallel */
export function useMultiStationWeather(icaos = []) {
  return useQuery({
    queryKey: ['open-meteo-multi', icaos.join(',')],
    queryFn: async () => {
      const results = await Promise.allSettled(
        icaos.map(icao => {
          const coords = ICAO_COORDS[icao];
          if (!coords) return Promise.resolve(null);
          return fetchMeteo(coords[0], coords[1]).then(wx => ({ icao, ...wx }));
        })
      );
      return results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);
    },
    enabled: icaos.length > 0,
    refetchInterval: 300000,
    staleTime: 240000,
  });
}