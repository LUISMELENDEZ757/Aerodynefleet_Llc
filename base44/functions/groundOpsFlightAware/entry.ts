import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveAeroApiKey } from '../../shared/aeroApiKey.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { airport, limit = 50 } = await req.json();
    if (!airport) {
      return Response.json({ error: 'Airport code required' }, { status: 400 });
    }

    const apiKey = await resolveAeroApiKey(base44);
    if (!apiKey) {
      return Response.json({ error: 'FlightAware API key not configured' }, { status: 500 });
    }

    // Fetch arrivals and departures from FlightAware aeroAPI
    const [arrivalsRes, departuresRes] = await Promise.all([
      fetch(`https://aeroapi.flightaware.com/aeroapi/airports/${airport}/flights/arrivals?limit=${limit}`, {
        headers: { 'x-apikey': apiKey, 'Accept': 'application/json' }
      }),
      fetch(`https://aeroapi.flightaware.com/aeroapi/airports/${airport}/flights/departures?limit=${limit}`, {
        headers: { 'x-apikey': apiKey, 'Accept': 'application/json' }
      })
    ]);

    if (!arrivalsRes.ok || !departuresRes.ok) {
      return Response.json({ 
        error: 'FlightAware API error',
        arrivals_status: arrivalsRes.status,
        departures_status: departuresRes.status
      }, { status: 500 });
    }

    const arrivalsData = await arrivalsRes.json();
    const departuresData = await departuresRes.json();

    // Format arrivals
    const arrivals = (arrivalsData.arrivals || []).map(f => ({
      id: f.id,
      ident_iata: f.ident_iata,
      ident: f.ident,
      operator: f.operator,
      origin: {
        code_icao: f.origin?.code_icao,
        code: f.origin?.code
      },
      destination: {
        code_icao: f.destination?.code_icao,
        code: f.destination?.code
      },
      scheduled_in: f.scheduled_in,
      estimated_in: f.estimated_in,
      actual_in: f.actual_in,
      arrival_delay: f.arrival_delay,
      cancelled: f.cancelled,
      aircraft_type: f.aircraft_type,
      gate: f.gate,
      terminal: f.terminal
    }));

    // Format departures
    const departures = (departuresData.departures || []).map(f => ({
      id: f.id,
      ident_iata: f.ident_iata,
      ident: f.ident,
      operator: f.operator,
      origin: {
        code_icao: f.origin?.code_icao,
        code: f.origin?.code
      },
      destination: {
        code_icao: f.destination?.code_icao,
        code: f.destination?.code
      },
      scheduled_out: f.scheduled_out,
      estimated_out: f.estimated_out,
      actual_out: f.actual_out,
      departure_delay: f.departure_delay,
      cancelled: f.cancelled,
      aircraft_type: f.aircraft_type,
      gate: f.gate,
      terminal: f.terminal
    }));

    return Response.json({
      airport,
      arrivals,
      departures,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});