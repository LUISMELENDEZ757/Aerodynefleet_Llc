const AWC_BASE = 'https://aviationweather.gov/api/data';

Deno.serve(async (req) => {
  try {
    let type, icao;
    try {
      const body = await req.json();
      type = body.type;
      icao = body.icao;
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let fetchUrl = '';
    if (type === 'metar' && icao) {
      fetchUrl = `${AWC_BASE}/metar?ids=${icao}&format=json&hours=2`;
    } else if (type === 'taf' && icao) {
      fetchUrl = `${AWC_BASE}/taf?ids=${icao}&format=json`;
    } else if (type === 'sigmet') {
      fetchUrl = `${AWC_BASE}/airsigmet?format=json&type=sigmet`;
    } else {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }
    
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('Weather proxy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});