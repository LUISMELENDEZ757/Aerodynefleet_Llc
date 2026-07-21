import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveAeroApiKey } from '../../shared/aeroApiKey.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, airport, airline_icao } = await req.json();
    const apiKey = await resolveAeroApiKey(base44);

    if (!apiKey) {
      return Response.json({ error: 'FlightAware API key not configured' }, { status: 500 });
    }

    const BASE = 'https://aeroapi.flightaware.com/aeroapi';
    const headers = { 'x-apikey': apiKey, 'Accept': 'application/json' };

    let url = '';

    if (type === 'airport_arrivals') {
      url = `${BASE}/airports/${airport}/flights/arrivals?max_pages=2${airline_icao ? `&airline=${airline_icao}` : ''}`;
    } else if (type === 'airport_departures') {
      url = `${BASE}/airports/${airport}/flights/departures?max_pages=2${airline_icao ? `&airline=${airline_icao}` : ''}`;
    } else if (type === 'airline_flights') {
      url = `${BASE}/operators/${airline_icao}/flights?max_pages=2`;
    } else {
      return Response.json({ error: 'Invalid request type' }, { status: 400 });
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`FlightAware AeroAPI error: ${response.status}`, errText);
      return Response.json({ error: `FlightAware API error: ${response.status} ${response.statusText}`, detail: errText }, { status: response.status });
    }

    const data = await response.json();

    let result = {};
    if (type === 'airport_arrivals') {
      result.arrivals = data.arrivals || [];
    } else if (type === 'airport_departures') {
      result.departures = data.departures || [];
    } else if (type === 'airline_flights') {
      result.flights = data.flights || [];
    }

    return Response.json(result);
  } catch (error) {
    console.error('flightAwareProxy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});