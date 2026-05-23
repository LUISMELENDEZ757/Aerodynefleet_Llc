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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, ident, airline_icao, airport } = body;

    // Get live positions for multiple flights by airline at a hub
    if (type === 'airline_positions' && airline_icao) {
      const code = airline_icao.toUpperCase();
      const HUB_MAP = {
        UAL: ['KORD', 'KEWR', 'KIAH'],
        AAL: ['KDFW', 'KPHL', 'KLAX'],
        DAL: ['KATL', 'KLAX', 'KJFK'],
        SWA: ['KMDW', 'KLAS', 'KBWI'],
        BAW: ['EGLL'], AFR: ['LFPG'], DLH: ['EDDF'],
        UAE: ['OMDB'], QTR: ['OTHH'], ETD: ['OMAA'],
        SIA: ['WSSS'], CPA: ['VHHH'], KAL: ['RKSI'],
        ANA: ['RJTT'], JAL: ['RJTT'],
      };
      const hubs = HUB_MAP[code] || ['KEWR', 'KLAX'];
      const results = await Promise.allSettled(
        hubs.map(hub => faFetch(`/airports/${hub}/flights/departures?max_pages=1&per_page=20`))
      );
      const seen = new Set();
      const flights = [];
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        for (const f of (r.value.departures || [])) {
          const operatorMatch =
            (f.operator_icao || '').toUpperCase() === code ||
            (f.ident_icao || f.ident || '').toUpperCase().startsWith(code);
          const isEnRoute = f.status === 'En Route' || f.status === 'Departed';
          if (operatorMatch && isEnRoute && !seen.has(f.fa_flight_id || f.ident)) {
            seen.add(f.fa_flight_id || f.ident);
            flights.push(f);
          }
        }
      }
      // Attach last known positions
      const withPositions = await Promise.allSettled(
        flights.slice(0, 15).map(async (f) => {
          try {
            const id = f.fa_flight_id || f.ident;
            const trackData = await faFetch(`/flights/${encodeURIComponent(id)}/track`);
            const positions = trackData.positions || [];
            const last = positions[positions.length - 1];
            return { ...f, lat: last?.latitude, lon: last?.longitude, heading: last?.groundspeed ? last.heading : null, altitude: last?.altitude, groundspeed: last?.groundspeed };
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
      const data = await faFetch(`/flights/${encodeURIComponent(ident.toUpperCase())}/track`);
      return Response.json({ track: data });
    }

    // Get airport departures with positions
    if (type === 'airport_enroute' && airport) {
      const code = airport.toUpperCase();
      const depData = await faFetch(`/airports/${code}/flights/departures?max_pages=1&per_page=30`);
      const enroute = (depData.departures || []).filter(f => f.status === 'En Route' || f.status === 'Departed');
      const withPositions = await Promise.allSettled(
        enroute.slice(0, 20).map(async (f) => {
          try {
            const id = f.fa_flight_id || f.ident;
            const trackData = await faFetch(`/flights/${encodeURIComponent(id)}/track`);
            const positions = trackData.positions || [];
            const last = positions[positions.length - 1];
            return { ...f, lat: last?.latitude, lon: last?.longitude, heading: last?.heading, altitude: last?.altitude, groundspeed: last?.groundspeed };
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