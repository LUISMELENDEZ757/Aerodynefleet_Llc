/**
 * Starlink Aviation Connectivity Backend
 *
 * Provides terminal status, telemetry polling, and fleet-wide connectivity overview.
 * Currently returns demo/simulated data structured to match the real Starlink API format.
 * To connect to real Starlink API: set STARLINK_API_KEY and STARLINK_ACCOUNT_ID secrets
 * and replace the simulation block with live API calls to:
 *   https://api.starlink.com/enterprise/v1/account/{accountId}/terminals
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const STARLINK_API_BASE = 'https://api.starlink.com/enterprise/v1';

// Simulate realistic Starlink Aviation telemetry for demo purposes
function simulateTerminalTelemetry(terminalId) {
  const seed = terminalId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min, max, s = seed) => min + ((s * 9301 + 49297) % 233280) / 233280 * (max - min);

  return {
    terminal_id: terminalId,
    signal_quality: Math.round(rand(72, 98)),
    download_mbps: parseFloat(rand(85, 220).toFixed(1)),
    upload_mbps: parseFloat(rand(12, 35).toFixed(1)),
    latency_ms: Math.round(rand(20, 60)),
    uptime_percent: parseFloat(rand(97.5, 99.9).toFixed(2)),
    obstruction_percent: parseFloat(rand(0.1, 3.5).toFixed(2)),
    satellites_visible: Math.round(rand(8, 24)),
    last_seen: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'fleet_status', terminal_id, aircraft_tail } = body;

    const apiKey = Deno.env.get('STARLINK_API_KEY');
    const accountId = Deno.env.get('STARLINK_ACCOUNT_ID');
    const liveMode = !!(apiKey && accountId);

    // ── FLEET STATUS ─────────────────────────────────────────────────────────
    if (action === 'fleet_status') {
      const terminals = await base44.entities.StarlinkTerminal.list();

      if (liveMode) {
        // Live: fetch telemetry from Starlink API for each terminal
        const results = await Promise.all(terminals.map(async (t) => {
          try {
            const res = await fetch(
              `${STARLINK_API_BASE}/account/${accountId}/terminals/${t.terminal_id}/telemetry`,
              { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
            );
            const data = await res.json();
            return { ...t, ...data, live: true };
          } catch {
            return { ...t, live: false, error: 'Telemetry unavailable' };
          }
        }));
        return Response.json({ terminals: results, live: true, terminal_count: results.length });
      } else {
        // Demo: simulate telemetry for each registered terminal
        const results = terminals.map(t => ({
          ...t,
          ...simulateTerminalTelemetry(t.terminal_id),
          live: false,
          demo: true,
        }));
        return Response.json({ terminals: results, live: false, demo: true, terminal_count: results.length });
      }
    }

    // ── SINGLE TERMINAL STATUS ────────────────────────────────────────────────
    if (action === 'terminal_status') {
      if (!terminal_id) {
        return Response.json({ error: 'terminal_id required' }, { status: 400 });
      }

      if (liveMode) {
        const res = await fetch(
          `${STARLINK_API_BASE}/account/${accountId}/terminals/${terminal_id}/telemetry`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const data = await res.json();
        return Response.json({ ...data, live: true });
      } else {
        return Response.json({ ...simulateTerminalTelemetry(terminal_id), live: false, demo: true });
      }
    }

    // ── REFRESH ALL TERMINAL TELEMETRY INTO DB ────────────────────────────────
    if (action === 'sync_telemetry') {
      if (user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
      const terminals = await base44.entities.StarlinkTerminal.list();
      let updated = 0;

      for (const t of terminals) {
        const telemetry = liveMode
          ? await fetch(`${STARLINK_API_BASE}/account/${accountId}/terminals/${t.terminal_id}/telemetry`,
              { headers: { Authorization: `Bearer ${apiKey}` } }).then(r => r.json()).catch(() => null)
          : simulateTerminalTelemetry(t.terminal_id);

        if (telemetry) {
          await base44.entities.StarlinkTerminal.update(t.id, {
            signal_quality: telemetry.signal_quality,
            download_mbps: telemetry.download_mbps,
            upload_mbps: telemetry.upload_mbps,
            latency_ms: telemetry.latency_ms,
            uptime_percent: telemetry.uptime_percent,
            obstruction_percent: telemetry.obstruction_percent,
            satellites_visible: telemetry.satellites_visible,
            last_seen: new Date().toISOString(),
          });
          updated++;
        }
      }

      return Response.json({ synced: updated, live: liveMode });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});