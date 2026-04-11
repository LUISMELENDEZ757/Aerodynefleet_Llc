import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, airport, airline_icao, airline } = await req.json();
    const apiKey = Deno.env.get('FLIGHTAWARE_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'FlightAware API key not configured' }, { status: 500 });
    }

    const baseUrl = 'https://apc.flightaware.com/apc/v3';
    let url = '';
    let params = { apikey: apiKey };

    if (type === 'airport_arrivals') {
      url = `${baseUrl}/json/AirportBoards/${airport}/arrivals`;
      params.howManyBefore = '10';
      if (airline_icao) params.filter = airline_icao;
    } else if (type === 'airport_departures') {
      url = `${baseUrl}/json/AirportBoards/${airport}/departures`;
      params.howManyBefore = '10';
      if (airline_icao) params.filter = airline_icao;
    } else if (type === 'airline_flights') {
      url = `${baseUrl}/json/AirlineFlightSchedules/${airline_icao}/departures`;
      params.howMany = '50';
    } else {
      return Response.json({ error: 'Invalid request type' }, { status: 400 });
    }

    // Build query string
    const queryStr = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${queryStr}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`FlightAware API error: ${response.status} ${response.statusText}`);
      return Response.json({ error: `FlightAware API error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();

    // Parse response based on type
    let result = {};
    if (type === 'airport_arrivals') {
      result.arrivals = data.AirportBoardsResult?.arrivals || [];
    } else if (type === 'airport_departures') {
      result.departures = data.AirportBoardsResult?.departures || [];
    } else if (type === 'airline_flights') {
      result.flights = data.AirlineFlightSchedulesResult?.next || [];
    }

    return Response.json(result);
  } catch (error) {
    console.error('flightAwareProxy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});