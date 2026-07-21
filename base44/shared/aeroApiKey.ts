// Resolves the active AeroAPI (FlightAware) key: prefers the key saved via the
// Integration Hub (IntegrationConfig entity), falls back to the FLIGHTAWARE_API_KEY env secret.
export async function resolveAeroApiKey(base44) {
  try {
    const configs = await base44.asServiceRole.entities.IntegrationConfig.filter({ provider: 'aeroapi' });
    if (configs[0]?.api_key) return configs[0].api_key;
  } catch (_e) {
    // fall through to env secret
  }
  return Deno.env.get('FLIGHTAWARE_API_KEY') || '';
}