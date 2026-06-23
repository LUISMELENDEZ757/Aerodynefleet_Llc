import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const { station } = await req.json();
    if (!station) {
      return Response.json({ error: 'Station code required' }, { status: 400 });
    }

    const stationCode = station.toUpperCase();

    // Fetch departures from FlightAware
    const depData = await faFetch(`/airports/${stationCode}/flights/departures?max_pages=2`);
    const departures = depData.departures || [];

    // Get all gates for this station
    const gates = await base44.entities.Gate.filter({ station_icao: stationCode }, 'code', 500);
    
    // Create a map of gate code to gate entity
    const gateMap = new Map();
    gates.forEach(g => {
      gateMap.set(g.code.toUpperCase(), g);
    });

    // Clear all gates first (mark as unoccupied)
    const gatesToUpdate = [];
    gates.forEach(g => {
      if (g.occupied || g.flight) {
        gatesToUpdate.push({
          id: g.id,
          occupied: false,
          flight: null,
          aircraft_tail: null,
        });
      }
    });

    // Update gates with FlightAware data
    const gateAssignments = [];
    for (const flight of departures) {
      const gateCode = flight.gate_origin?.toUpperCase();
      if (!gateCode) continue;

      const gate = gateMap.get(gateCode);
      if (!gate) continue;

      // Update gate with flight info
      await base44.entities.Gate.update(gate.id, {
        occupied: true,
        flight: flight.ident || flight.flight_number,
        aircraft_tail: flight.tailnumber || null,
        scheduled_departure: flight.scheduled_out || null,
      });

      gateAssignments.push({
        gate_code: gateCode,
        flight: flight.ident,
        tail: flight.tailnumber,
        destination: flight.destination?.code || flight.destination,
        scheduled_time: flight.scheduled_out,
      });
    }

    return Response.json({
      success: true,
      station: stationCode,
      total_gates: gates.length,
      assignments: gateAssignments,
      message: `Updated ${gateAssignments.length} gate assignments`,
    });
  } catch (error) {
    console.error('FlightAware gate sync error:', error);
    return Response.json({ 
      error: error.message,
      success: false,
    }, { status: 500 });
  }
});