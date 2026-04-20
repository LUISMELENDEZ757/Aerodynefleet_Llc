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