import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { resolveAeroApiKey } from '../../shared/aeroApiKey.ts';

const FA_BASE = 'https://aeroapi.flightaware.com/aeroapi';
let API_KEY = '';

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
    API_KEY = await resolveAeroApiKey(base44);

    const body = await req.json();
    const { type, ident, airline_icao, airport, query } = body;

    // Search flights by airline — fetch from all hubs in parallel and filter by operator
    if (type === 'airline_enroute' && airline_icao) {
      const code = airline_icao.toUpperCase();

      const HUB_MAP = {
        UAL: ['KORD', 'KEWR', 'KIAH', 'KSFO', 'KDEN'],
        AAL: ['KDFW', 'KPHL', 'KLAX', 'KMIA', 'KORD'],
        DAL: ['KATL', 'KLAX', 'KJFK', 'KBOS', 'KSLC'],
        SWA: ['KMDW', 'KLAS', 'KBWI', 'KDAL', 'KHOU'],
        BAW: ['EGLL'],
        AFR: ['LFPG'],
        DLH: ['EDDF', 'EDDM'],
        UAE: ['OMDB'],
        QFA: ['YSSY', 'YMML'],
        SIA: ['WSSS'],
        CPA: ['VHHH'],
        KAL: ['RKSI'],
        ANA: ['RJTT', 'RJOO'],
        JAL: ['RJTT'],
        THY: ['LTFM'],
        ETH: ['HAAB'],
        QTR: ['OTHH'],
        ETD: ['OMAA'],
        ASA: ['KSEA', 'KPDX', 'KLAX'],
        JBU: ['KJFK', 'KBOS', 'KLAX', 'KFLL'],
      };

      const hubs = HUB_MAP[code] || ['KEWR', 'KLAX', 'KATL'];

      // Fetch all hubs in parallel
      const results = await Promise.allSettled(
        hubs.map(hub => faFetch(`/airports/${hub}/flights/departures?max_pages=1`))
      );

      const seen = new Set();
      const flights = [];
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        for (const f of (r.value.departures || [])) {
          const operatorMatch =
            (f.operator_icao || '').toUpperCase() === code ||
            (f.operator || '').toUpperCase() === code ||
            (f.ident_icao || f.ident || '').toUpperCase().startsWith(code);
          if (operatorMatch && !seen.has(f.fa_flight_id || f.ident)) {
            seen.add(f.fa_flight_id || f.ident);
            flights.push(f);
          }
        }
      }

      return Response.json({ flights });
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
        faFetch(`/airports/${code}/flights/departures?max_pages=2`),
        faFetch(`/airports/${code}/flights/arrivals?max_pages=2`),
      ]);
      return Response.json({
        departures: (depData.departures || []).slice(0, 50),
        arrivals: (arrData.arrivals || []).slice(0, 50),
      });
    }

    // Global enroute search (by text query — uses /flights/search)
    if (type === 'global_search' && query) {
      const data = await faFetch(`/flights/search?query=${encodeURIComponent(query)}&max_pages=1`);
      return Response.json({ flights: data.flights || [] });
    }

    // Single flight live position — extract last waypoint as current lat/lon
    if (type === 'flight_position' && ident) {
      const data = await faFetch(`/flights/${encodeURIComponent(ident)}/position`);
      // waypoints is a flat array: [lat0, lon0, lat1, lon1, ...]
      const wp = data.waypoints || [];
      let latitude = null, longitude = null;
      if (wp.length >= 2) {
        // Last pair is the most recent position
        latitude = wp[wp.length - 2];
        longitude = wp[wp.length - 1];
      }
      return Response.json({ position: { ...data, latitude, longitude } });
    }

    // Flight track — use /track endpoint, fall back to waypoints from /position
    if (type === 'flight_track' && ident) {
      try {
        const data = await faFetch(`/flights/${encodeURIComponent(ident.toUpperCase())}/track`);
        return Response.json({ track: data });
      } catch {
        // Fall back: return waypoints from position endpoint as track-like positions
        const posData = await faFetch(`/flights/${encodeURIComponent(ident)}/position`);
        const wp = posData.waypoints || [];
        const positions = [];
        for (let i = 0; i < wp.length - 1; i += 2) {
          positions.push({ latitude: wp[i], longitude: wp[i + 1] });
        }
        return Response.json({ track: { positions } });
      }
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});