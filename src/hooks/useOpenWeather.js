import { useQuery } from '@tanstack/react-query';

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

export function useWeatherByCoords(lat, lon, enabled = true) {
  return useQuery({
    queryKey: ['openweather', lat, lon],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) throw new Error('OpenWeather API key not configured');
      
      const res = await fetch(
        `${OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      if (!res.ok) throw new Error('Failed to fetch weather');
      return res.json();
    },
    enabled,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

export function useWeatherByCity(city, enabled = true) {
  return useQuery({
    queryKey: ['openweather-city', city],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) throw new Error('OpenWeather API key not configured');
      
      const res = await fetch(
        `${OPENWEATHER_BASE}/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      if (!res.ok) throw new Error('Failed to fetch weather');
      return res.json();
    },
    enabled,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useForecast(lat, lon, enabled = true) {
  return useQuery({
    queryKey: ['openweather-forecast', lat, lon],
    queryFn: async () => {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) throw new Error('OpenWeather API key not configured');
      
      const res = await fetch(
        `${OPENWEATHER_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      if (!res.ok) throw new Error('Failed to fetch forecast');
      return res.json();
    },
    enabled,
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