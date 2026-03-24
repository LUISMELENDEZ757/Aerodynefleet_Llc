import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * WiFi Status Backend — Provider-Agnostic
 * Supports: Viasat, Panasonic, Honeywell, or any custom WiFi system
 * 
 * Request payload:
 * - aircraft_tail: string (optional — for single aircraft)
 * - aircraft_tails: array (optional — for batch)
 * - provider: string (optional — filter by provider)
 * - custom_telemetry: object (optional — custom API endpoint config)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      aircraft_tail,
      aircraft_tails,
      provider,
      custom_telemetry,
    } = await req.json();

    // Determine which aircraft to query
    let query = {};
    if (aircraft_tail) {
      query.aircraft_tail = aircraft_tail;
    } else if (aircraft_tails && aircraft_tails.length > 0) {
      // Batch query — fetch all terminals for provided tails
      const terminals = await base44.entities.WiFiTerminal.list();
      const filtered = terminals.filter(t => aircraft_tails.includes(t.aircraft_tail));
      
      if (filtered.length === 0) {
        return Response.json({ error: 'No terminals found' }, { status: 404 });
      }

      // Process all and return batch
      const results = await Promise.all(
        filtered.map(t => processSingleTerminal(base44, t, custom_telemetry))
      );

      return Response.json({ success: true, count: results.length, statuses: results });
    }

    if (provider) {
      query.provider = provider;
    }

    // Fetch terminals matching query
    const terminals = await base44.entities.WiFiTerminal.filter(query);
    if (terminals.length === 0) {
      return Response.json({ error: 'No WiFi terminal found' }, { status: 404 });
    }

    // Process first matching terminal (or extend for batch)
    const terminal = terminals[0];
    const status = await processSingleTerminal(base44, terminal, custom_telemetry);

    return Response.json({ success: true, status });
  } catch (error) {
    console.error('WiFi Status Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Helper: Process a single terminal
 * Fetches from custom API endpoint if provided, otherwise uses stored data
 */
async function processSingleTerminal(base44, terminal, customTelemetry) {
  let telemetryData = {
    signal_strength: terminal.signal_strength || 85,
    download_mbps: terminal.download_mbps || 120,
    upload_mbps: terminal.upload_mbps || 25,
    latency_ms: terminal.latency_ms || 40,
    uptime_percent: terminal.uptime_percent || 99.2,
    connected_users: terminal.connected_users || 0,
  };

  // If custom telemetry endpoint provided, fetch live data
  if (customTelemetry && customTelemetry.endpoint) {
    try {
      const fetchResult = await fetch(customTelemetry.endpoint, {
        method: 'GET',
        headers: customTelemetry.headers || {},
      });

      if (fetchResult.ok) {
        const liveData = await fetchResult.json();
        // Merge with expected fields
        telemetryData = {
          signal_strength: liveData.signal_strength ?? telemetryData.signal_strength,
          download_mbps: liveData.download_mbps ?? telemetryData.download_mbps,
          upload_mbps: liveData.upload_mbps ?? telemetryData.upload_mbps,
          latency_ms: liveData.latency_ms ?? telemetryData.latency_ms,
          uptime_percent: liveData.uptime_percent ?? telemetryData.uptime_percent,
          connected_users: liveData.connected_users ?? telemetryData.connected_users,
        };
      }
    } catch (err) {
      console.warn(`Custom telemetry fetch failed for ${terminal.aircraft_tail}: ${err.message}`);
    }
  }

  // Build response
  const status = {
    id: terminal.id,
    aircraft_tail: terminal.aircraft_tail,
    aircraft_type: terminal.aircraft_type,
    terminal_id: terminal.terminal_id,
    provider: terminal.provider,
    activation_status: terminal.activation_status,
    ...telemetryData,
    last_seen: new Date().toISOString(),
  };

  // Update terminal with latest telemetry
  await base44.entities.WiFiTerminal.update(terminal.id, {
    signal_strength: telemetryData.signal_strength,
    download_mbps: telemetryData.download_mbps,
    upload_mbps: telemetryData.upload_mbps,
    latency_ms: telemetryData.latency_ms,
    uptime_percent: telemetryData.uptime_percent,
    connected_users: telemetryData.connected_users,
    last_seen: status.last_seen,
  });

  return status;
}