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

    const url = `https://apc-api.flightaware.com/apc/v2/query?query=prefix ${station} -${direction.slice(0, -1)} limit 50`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-APIKey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FlightAware API error: ${response.status}`);
    }

    const data = await response.json();

    return Response.json({
      success: true,
      station,
      direction,
      flights: data.flights || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('FlightAware station ops error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});