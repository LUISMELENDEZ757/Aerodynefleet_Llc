import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

function isEnRoute(status) {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('en route') || s.includes('departed') || s.includes('airborne');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, ident, airline_icao, airport } = body;

    // Get live positions for flights by airline using /operators/:id/flights
    if (type === 'airline_positions' && airline_icao) {
      const code = airline_icao.toUpperCase();
      const data = await faFetch(`/operators/${code}/flights?max_pages=2`);
      const flights = (data.flights || []).filter(f => isEnRoute(f.status));

      // Attach positions
      const withPositions = await Promise.allSettled(
        flights.slice(0, 20).map(async (f) => {
          try {
            const id = f.fa_flight_id || f.ident;
            const posData = await faFetch(`/flights/${encodeURIComponent(id)}/position`);
            return {
              ...f,
              lat: posData.latitude,
              lon: posData.longitude,
              heading: posData.heading,
              altitude: posData.altitude,
              groundspeed: posData.groundspeed,
            };
          } catch {
            return f;
          }
        })
      );

      return Response.json({
        flights: withPositions.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
      });
    }

    // Get track for a single flight
    if (type === 'flight_track' && ident) {
      const data = await faFetch(`/flights/${encodeURIComponent(ident)}/track`);
      return Response.json({ track: data });
    }

    // Get airport en-route flights
    if (type === 'airport_enroute' && airport) {
      const code = airport.toUpperCase();
      const data = await faFetch(`/airports/${code}/flights/enroute?max_pages=2`);
      const flights = (data.arrivals || data.enroute || []);

      const withPositions = await Promise.allSettled(
        flights.slice(0, 20).map(async (f) => {
          try {
            const id = f.fa_flight_id || f.ident;
            const posData = await faFetch(`/flights/${encodeURIComponent(id)}/position`);
            return {
              ...f,
              lat: posData.latitude,
              lon: posData.longitude,
              heading: posData.heading,
              altitude: posData.altitude,
              groundspeed: posData.groundspeed,
            };
          } catch {
            return f;
          }
        })
      );

      return Response.json({
        flights: withPositions.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
      });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});