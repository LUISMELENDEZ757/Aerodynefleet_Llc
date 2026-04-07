import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FA_BASE = 'https://aeroapi.flightaware.com/aeroapi';
const API_KEY = Deno.env.get('FLIGHTAWARE_API_KEY');

async function faFetch(path) {
  const res = await fetch(`${FA_BASE}${path}`, {
    headers: { 'x-apikey': API_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FlightAware API error ${res.status}: ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, ident, airport, airline_icao } = body;

    // type: 'flight' | 'airport_arrivals' | 'airport_departures' | 'airline_flights' | 'tail'
    if (type === 'flight' && ident) {
      // Live flight info for a specific flight number or tail
      const data = await faFetch(`/flights/${encodeURIComponent(ident)}?max_pages=1`);
      return Response.json({ flights: data.flights || [] });
    }

    if (type === 'tail' && ident) {
      // Flights for a specific tail number
      const data = await faFetch(`/flights/${encodeURIComponent(ident)}?max_pages=1`);
      return Response.json({ flights: data.flights || [] });
    }

    if (type === 'airport_arrivals' && airport) {
      const suffix = airline_icao ? `&airline=${encodeURIComponent(airline_icao)}` : '';
      const data = await faFetch(`/airports/${encodeURIComponent(airport)}/flights/arrivals?max_pages=1${suffix}`);
      return Response.json({ arrivals: data.arrivals || [] });
    }

    if (type === 'airport_departures' && airport) {
      const suffix = airline_icao ? `&airline=${encodeURIComponent(airline_icao)}` : '';
      const data = await faFetch(`/airports/${encodeURIComponent(airport)}/flights/departures?max_pages=1${suffix}`);
      return Response.json({ departures: data.departures || [] });
    }

    if (type === 'airline_flights' && airline_icao) {
      // Get scheduled flights for an airline
      const data = await faFetch(`/operators/${encodeURIComponent(airline_icao)}/flights?max_pages=1`);
      return Response.json({ flights: data.flights || [] });
    }

    return Response.json({ error: 'Invalid request type or missing params' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});