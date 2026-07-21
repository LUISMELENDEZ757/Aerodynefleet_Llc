import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi';

async function pingAeroApi(key) {
  const start = Date.now();
  const res = await fetch(`${AEROAPI_BASE}/airports/KJFK`, {
    headers: { 'x-apikey': key, 'Accept': 'application/json' },
  });
  const latency = Date.now() - start;
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, latency, status: res.status, error: res.status === 401 ? 'Invalid API key (401 Unauthorized)' : `AeroAPI returned ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = await res.json();
  return { ok: true, latency, status: res.status, sample: { airport: data.code || 'KJFK', name: data.name } };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, api_key } = await req.json();
    const configs = await base44.asServiceRole.entities.IntegrationConfig.filter({ provider: 'aeroapi' });
    const config = configs[0] || null;
    const envKey = Deno.env.get('FLIGHTAWARE_API_KEY') || '';
    const activeKey = config?.api_key || envKey;
    const mask = (k) => (k ? `${k.slice(0, 4)}••••••••${k.slice(-4)}` : null);

    if (action === 'status') {
      return Response.json({
        configured: !!activeKey,
        source: config?.api_key ? 'saved' : envKey ? 'secret' : null,
        masked_key: mask(activeKey),
        last_tested_at: config?.last_tested_at || null,
        last_latency_ms: config?.last_latency_ms || null,
        last_status: config?.last_status || 'untested',
        last_error: config?.last_error || null,
      });
    }

    if (action === 'save_key') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required to save API keys' }, { status: 403 });
      if (!api_key || api_key.trim().length < 10) return Response.json({ error: 'Please provide a valid AeroAPI key' }, { status: 400 });

      const ping = await pingAeroApi(api_key.trim());
      if (!ping.ok) return Response.json({ error: `Key validation failed — ${ping.error}` }, { status: 400 });

      const payload = {
        provider: 'aeroapi',
        api_key: api_key.trim(),
        is_active: true,
        last_tested_at: new Date().toISOString(),
        last_latency_ms: ping.latency,
        last_status: 'ok',
        last_error: '',
      };
      if (config) await base44.asServiceRole.entities.IntegrationConfig.update(config.id, payload);
      else await base44.asServiceRole.entities.IntegrationConfig.create(payload);

      return Response.json({ saved: true, latency_ms: ping.latency, masked_key: mask(api_key.trim()) });
    }

    if (action === 'test') {
      if (!activeKey) return Response.json({ error: 'No AeroAPI key configured — add one first' }, { status: 400 });
      const ping = await pingAeroApi(activeKey);
      if (config) {
        await base44.asServiceRole.entities.IntegrationConfig.update(config.id, {
          last_tested_at: new Date().toISOString(),
          last_latency_ms: ping.ok ? ping.latency : config.last_latency_ms,
          last_status: ping.ok ? 'ok' : 'error',
          last_error: ping.ok ? '' : ping.error,
        });
      }
      if (!ping.ok) return Response.json({ error: ping.error, latency_ms: ping.latency }, { status: 502 });
      return Response.json({ ok: true, latency_ms: ping.latency, sample: ping.sample });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});