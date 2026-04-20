import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE = 'https://aeroapi.flightaware.com/aeroapi';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('FLIGHTAWARE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'FlightAware API key not configured' }, { status: 500 });
    }

    const headers = { 'x-apikey': apiKey, 'Accept': 'application/json' };

    // Search for in-air flights
    const flightsRes = await fetch(
      `${BASE}/flights/search?query=-inAir+1&max_pages=2`,
      { headers }
    );
    
    if (!flightsRes.ok) {
      const errText = await flightsRes.text();
      console.error('FlightAware flights error:', flightsRes.status, errText);
      return Response.json({ aircraft: [] });
    }

    const flightsData = await flightsRes.json();
    const flights = flightsData.flights || [];

    // Fetch positions for active flights (limit to avoid rate limits)
    const positions = [];
    for (const flight of flights.slice(0, 20)) {
      if (!flight.fa_flight_id) continue;

      try {
        const trackRes = await fetch(
          `${BASE}/flights/${flight.fa_flight_id}/track`,
          { headers }
        );

        if (trackRes.ok) {
          const trackData = await trackRes.json();
          const track = trackData.positions || [];
          
          if (track.length > 0) {
            const latest = track[track.length - 1];
            positions.push({
              id: flight.fa_flight_id,
              flight_number: flight.ident_iata || flight.ident,
              callsign: flight.callsign,
              airline: flight.operator_iata || flight.operator || 'UNK',
              aircraft_type: flight.aircraft_type,
              tail: flight.registration,
              latitude: latest.latitude,
              longitude: latest.longitude,
              altitude: latest.altitude,
              ground_speed: latest.groundspeed,
              heading: latest.heading,
              origin: flight.origin?.code_iata,
              destination: flight.destination?.code_iata,
              status: flight.status,
            });
          }
        }
      } catch (e) {
        console.error(`Failed to get track for ${flight.fa_flight_id}:`, e.message);
      }
    }

    return Response.json({ aircraft: positions });
  } catch (error) {
    console.error('Position fetch error:', error.message);
    return Response.json({ error: error.message, aircraft: [] }, { status: 500 });
  }
});