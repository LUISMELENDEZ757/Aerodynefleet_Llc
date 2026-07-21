// AeroMOS Fleet Board — O₂ / OIL service-status store (mock).
// `true` = the service entry has been signed off & closed in the eLogbook.

const STATUS = {
  N722EG: { O2: true, OIL: true },   // O₂ cleared → badge stops glowing
  N118EV: { O2: false, OIL: false },
  N301EV: { O2: false, OIL: false },
  N901EG: { O2: false, OIL: false },
};

const listeners = new Set();

export function isServiceCleared(tail, key) {
  return !!(STATUS[tail] && STATUS[tail][key]);
}

export function setServiceCleared(tail, key, cleared) {
  if (!STATUS[tail]) STATUS[tail] = {};
  STATUS[tail][key] = cleared;
  listeners.forEach((f) => f());
}

export function subscribeServiceStatus(cb) { listeners.add(cb); return () => listeners.delete(cb); }