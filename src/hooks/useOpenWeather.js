import { useQuery } from '@tanstack/react-query';

const OPENMETEO_BASE = 'https://api.open-meteo.com/v1/forecast';

export function useWeatherByCoords(lat, lon, enabled = true) {
  return useQuery({
    queryKey: ['openmeteo', lat, lon],
    queryFn: async () => {
      const res = await fetch(
        `${OPENMETEO_BASE}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`
      );
      if (!res.ok) throw new Error('Failed to fetch weather');
      return res.json();
    },
    enabled: !!lat && !!lon && enabled,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

export function useWeatherByCity(city, enabled = true) {
  const coords = city ? AIRPORT_COORDS[city] : null;
  return useWeatherByCoords(coords?.lat, coords?.lon, enabled && !!city);
}

export function useForecast(lat, lon, enabled = true) {
  return useQuery({
    queryKey: ['openmeteo-forecast', lat, lon],
    queryFn: async () => {
      const res = await fetch(
        `${OPENMETEO_BASE}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`
      );
      if (!res.ok) throw new Error('Failed to fetch forecast');
      return res.json();
    },
    enabled: !!lat && !!lon && enabled,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });
}

// Airport coordinates mapping for quick lookup
export const AIRPORT_COORDS = {
  'KEWR': { lat: 40.6895, lon: -74.1745, name: 'Newark Liberty Intl' },
  'KJFK': { lat: 40.6413, lon: -73.7781, name: 'John F Kennedy Intl' },
  'KORD': { lat: 41.9742, lon: -87.9073, name: 'Chicago OHare Intl' },
  'KATL': { lat: 33.6407, lon: -84.4277, name: 'Hartsfield Jackson Intl' },
  'KLAX': { lat: 33.9425, lon: -118.4081, name: 'Los Angeles Intl' },
  'KDFW': { lat: 32.8975, lon: -97.0382, name: 'Dallas Fort Worth Intl' },
};