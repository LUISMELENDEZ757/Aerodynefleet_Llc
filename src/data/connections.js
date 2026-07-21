// AeroMOS Fleet Board — server heartbeat / data-feed status (stub).
// Returns a map of feedName -> { at: epochMs } used to badge live data sources.
// When a real heartbeat endpoint exists, wire it here — consumers only use
// fetchServerHeartbeats() and heartbeatFreshness().

export async function fetchServerHeartbeats() {
  // No server heartbeat endpoint wired yet — report no feeds (consumers show OFFLINE).
  return {};
}

export function heartbeatFreshness(hb) {
  const at = typeof hb === "number" ? hb : hb?.at ? new Date(hb.at).getTime() : null;
  if (!at) return "unknown";
  const age = Date.now() - at;
  if (age < 5 * 60 * 1000) return "fresh";
  return "stale";
}