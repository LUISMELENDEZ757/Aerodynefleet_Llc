// OpenWeatherMap API integration
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function fetchWeather(lat, lon) {
  if (!API_KEY) {
    console.warn('OpenWeatherMap API key not configured. Set VITE_OPENWEATHER_API_KEY.');
    return null;
  }

  try {
    const response = await fetch(
      `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

export async function geocodeLocation(city, country) {
  if (!API_KEY) return null;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city},${country}&limit=1&appid=${API_KEY}`
    );
    
    if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);
    
    const data = await response.json();
    if (data.length === 0) return null;
    
    return { lat: data[0].lat, lon: data[0].lon };
  } catch (error) {
    console.error('Failed to geocode location:', error);
    return null;
  }
}

export function mapWeatherCondition(openWeatherMain) {
  const main = openWeatherMain.toLowerCase();
  if (main === 'clear') return { condition: 'sunny', icon: '☀️' };
  if (main === 'clouds') return { condition: 'partly_cloudy', icon: '⛅' };
  if (main === 'rain' || main === 'drizzle') return { condition: 'rainy', icon: '🌧️' };
  if (main === 'thunderstorm') return { condition: 'thunderstorm', icon: '⛈️' };
  if (main === 'snow') return { condition: 'cloudy', icon: '❄️' };
  return { condition: 'partly_cloudy', icon: '⛅' };
}