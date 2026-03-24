import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { aircraft_tail, simulate } = await req.json();

    // Fetch WiFi terminal
    const terminals = await base44.entities.WiFiTerminal.filter({ aircraft_tail });
    if (terminals.length === 0) {
      return Response.json({ error: 'No WiFi terminal found for aircraft' }, { status: 404 });
    }

    const terminal = terminals[0];

    // In production, this would call actual telemetry API
    // For now, simulate or use stored data
    let status = {
      aircraft_tail: terminal.aircraft_tail,
      terminal_id: terminal.terminal_id,
      activation_status: terminal.activation_status,
      signal_strength: terminal.signal_strength || 85,
      download_mbps: terminal.download_mbps || 120,
      upload_mbps: terminal.upload_mbps || 25,
      latency_ms: terminal.latency_ms || 40,
      uptime_percent: terminal.uptime_percent || 99.2,
      connected_users: terminal.connected_users || 0,
      last_seen: new Date().toISOString(),
    };

    // Update terminal with latest status
    await base44.entities.WiFiTerminal.update(terminal.id, {
      signal_strength: status.signal_strength,
      download_mbps: status.download_mbps,
      upload_mbps: status.upload_mbps,
      latency_ms: status.latency_ms,
      last_seen: status.last_seen,
    });

    return Response.json({ success: true, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});