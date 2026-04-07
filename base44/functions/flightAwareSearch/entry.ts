import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FA_BASE = 'https://aeroapi.flightaware.com/aeroapi';
const API_KEY = Deno.env.get('FLIGHTAWARE_API_KEY');

async function faFetch(path) {
  const res = await fetch(`${FA_BASE}${path}`, {
    headers: { 'x-apikey': API_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FlightAware ${res.status}: ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, ident, airline_icao, airport, query } = body;

    // Search flights by airline (operator)
    if (type === 'airline_enroute' && airline_icao) {
      const data = await faFetch(`/operators/${encodeURIComponent(airline_icao)}/flights/enroute`);
      return Response.json({ flights: data.flights || [] });
    }

    // Search a specific flight number or tail
    if (type === 'search_flight' && ident) {
      const data = await faFetch(`/flights/${encodeURIComponent(ident.toUpperCase())}?max_pages=1`);
      return Response.json({ flights: data.flights || [] });
    }

    // Airport board (arrivals + departures combined)
    if (type === 'airport_board' && airport) {
      const code = airport.toUpperCase();
      const [depData, arrData] = await Promise.all([
        faFetch(`/airports/${code}/flights/departures?max_pages=1`),
        faFetch(`/airports/${code}/flights/arrivals?max_pages=1`),
      ]);
      return Response.json({
        departures: depData.departures || [],
        arrivals: arrData.arrivals || [],
      });
    }

    // Global enroute search (by text query — uses /flights/search)
    if (type === 'global_search' && query) {
      const data = await faFetch(`/flights/search?query=${encodeURIComponent(query)}&max_pages=1`);
      return Response.json({ flights: data.flights || [] });
    }

    // Live position for a specific flight (most recent)
    if (type === 'flight_track' && ident) {
      const data = await faFetch(`/flights/${encodeURIComponent(ident.toUpperCase())}/track`);
      return Response.json({ track: data });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});