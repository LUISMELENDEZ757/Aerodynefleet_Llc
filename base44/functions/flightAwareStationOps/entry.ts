import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveAeroApiKey } from '../../shared/aeroApiKey.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { station } = await req.json();

    if (!station) {
      return Response.json({ error: 'Station code required' }, { status: 400 });
    }

    const apiKey = await resolveAeroApiKey(base44);
    if (!apiKey) {
      return Response.json({ error: 'FlightAware API not configured' }, { status: 500 });
    }

    // Fetch airport operations for the station
    // FlightAware AeroAPI endpoint: /airports/{station}/scheduled_arrivals and /scheduled_departures
    const now = new Date();
    const nowUtc = now.toISOString();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Get scheduled arrivals
    const arrivalsRes = await fetch(
      `https://aeroapi.flightaware.com/aeroapi/airports/${station}/scheduled_arrivals?start=${nowUtc}&end=${in24h}`,
      {
        headers: {
          'x-apikey': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    // Get scheduled departures
    const departuresRes = await fetch(
      `https://aeroapi.flightaware.com/aeroapi/airports/${station}/scheduled_departures?start=${nowUtc}&end=${in24h}`,
      {
        headers: {
          'x-apikey': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!arrivalsRes.ok || !departuresRes.ok) {
      return Response.json({ 
        error: 'Failed to fetch FlightAware data',
        flights: [] 
      }, { status: 200 });
    }

    const arrivalsData = await arrivalsRes.json();
    const departuresData = await departuresRes.json();

    // Transform FlightAware data into unified format
    const arrivals = (arrivalsData.scheduled_arrivals || []).map(flight => ({
      id: flight.id || flight.flight_id,
      flight_number: flight.ident,
      aircraft_type: flight.aircraft_type,
      origin: flight.origin?.code || flight.origin,
      destination: station,
      direction: 'arrival',
      scheduled_arrival: flight.scheduled_in,
      actual_arrival: flight.actual_in,
      status: flight.status === 'Landed' ? 'arrived' : 'scheduled',
      gate: flight.gate_dest || null,
    }));

    const departures = (departuresData.scheduled_departures || []).map(flight => ({
      id: flight.id || flight.flight_id,
      flight_number: flight.ident,
      aircraft_type: flight.aircraft_type,
      origin: station,
      destination: flight.destination?.code || flight.destination,
      direction: 'departure',
      scheduled_departure: flight.scheduled_out,
      actual_departure: flight.actual_out,
      status: flight.status === 'Departed' ? 'departed' : 'scheduled',
      gate: flight.gate_origin || null,
    }));

    return Response.json({
      success: true,
      station,
      flights: [...arrivals, ...departures],
      summary: {
        total_flights: arrivals.length + departures.length,
        arrivals_count: arrivals.length,
        departures_count: departures.length,
      },
    });
  } catch (error) {
    console.error('FlightAware station ops error:', error);
    return Response.json({ 
      error: error.message || 'Failed to fetch station operations',
      flights: []
    }, { status: 200 });
  }
});