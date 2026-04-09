import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { station, direction } = await req.json();

    if (!station || !['arrivals', 'departures'].includes(direction)) {
      return Response.json(
        { error: 'Missing or invalid station/direction' },
        { status: 400 }
      );
    }

    const apiKey = Deno.env.get('FLIGHTAWARE_API_KEY');
    if (!apiKey) {
      return Response.json(
        { error: 'FlightAware API key not configured' },
        { status: 500 }
      );
    }

    // Use FlightAware FlightBox endpoint
    const url = `https://flightxml.flightaware.com/json/FlightXML2/ArrivalInfo?airport=${station}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FlightAware error response:', response.status, errorText);
      // Return empty array instead of error for better UX
      return Response.json({
        success: true,
        station,
        direction,
        flights: [],
        error: 'FlightAware API unavailable',
        timestamp: new Date().toISOString(),
      });
    }

    const data = await response.json();

    // FlightXML returns flights differently
    const flights = data.ArrivalInfo?.flights?.item || [];

    return Response.json({
      success: true,
      station,
      direction,
      flights: flights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('FlightAware station ops error:', error);
    // Return empty array for better UX
    return Response.json({
      success: true,
      station: await req.json().then(r => r.station).catch(() => 'UNK'),
      direction: await req.json().then(r => r.direction).catch(() => 'arrivals'),
      flights: [],
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});