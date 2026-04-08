import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FA_BASE = 'https://aeroapi.flightaware.com/aeroapi';
const API_KEY = Deno.env.get('FLIGHTAWARE_API_KEY');

async function faFetch(path) {
  const res = await fetch(`${FA_BASE}${path}`, {
    headers: { 'x-apikey': API_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

// Great-circle distance in nautical miles from lat/lon pairs
function haversineNm(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // Earth radius in NM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { origin, destination, flight_number } = await req.json();
    if (!origin || !destination) {
      return Response.json({ error: 'origin and destination required' }, { status: 400 });
    }

    const orig = origin.toUpperCase();
    const dest = destination.toUpperCase();

    // Fetch airports and METARs in parallel
    const [origAirport, destAirport, origMetar, destMetar, flightData] = await Promise.all([
      faFetch(`/airports/${orig}`),
      faFetch(`/airports/${dest}`),
      faFetch(`/airports/${orig}/weather/observations?max_pages=1`),
      faFetch(`/airports/${dest}/weather/observations?max_pages=1`),
      flight_number ? faFetch(`/flights/${encodeURIComponent(flight_number.toUpperCase())}?max_pages=1&per_page=1`) : null,
    ]);

    // Distance
    let distanceNm = null;
    if (origAirport?.latitude && destAirport?.latitude) {
      distanceNm = Math.round(haversineNm(
        origAirport.latitude, origAirport.longitude,
        destAirport.latitude, destAirport.longitude
      ));
    }

    // Parse latest METARs
    const latestOrigObs = origMetar?.observations?.[0] || null;
    const latestDestObs = destMetar?.observations?.[0] || null;

    // Wind at origin (headwind component) — use surface wind direction/speed
    const origWind = latestOrigObs ? {
      direction: latestOrigObs.wind_direction,
      speed_kts: latestOrigObs.wind_speed,
      gusts_kts: latestOrigObs.wind_gust,
      raw_metar: latestOrigObs.raw_data,
    } : null;

    const destWind = latestDestObs ? {
      direction: latestDestObs.wind_direction,
      speed_kts: latestDestObs.wind_speed,
      gusts_kts: latestDestObs.wind_gust,
      raw_metar: latestDestObs.raw_data,
    } : null;

    // Flight conditions (flight category)
    const origCategory = latestOrigObs?.flight_category || 'UNKNOWN';
    const destCategory = latestDestObs?.flight_category || 'UNKNOWN';

    // Any active alternate recommendation from filed flight
    const filedFlight = flightData?.flights?.[0] || null;
    const filedRoute = filedFlight?.route || null;
    const filedAlt = filedFlight?.filed_altitude || null;
    const filedSpeed = filedFlight?.filed_speed || null;

    return Response.json({
      origin: orig,
      destination: dest,
      distance_nm: distanceNm,
      origin_airport: {
        name: origAirport?.name,
        elevation_ft: origAirport?.elevation,
        lat: origAirport?.latitude,
        lon: origAirport?.longitude,
      },
      destination_airport: {
        name: destAirport?.name,
        elevation_ft: destAirport?.elevation,
        lat: destAirport?.latitude,
        lon: destAirport?.longitude,
      },
      origin_weather: origWind,
      destination_weather: destWind,
      origin_flight_category: origCategory,
      destination_flight_category: destCategory,
      filed_route: filedRoute,
      filed_altitude: filedAlt,
      filed_speed: filedSpeed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});