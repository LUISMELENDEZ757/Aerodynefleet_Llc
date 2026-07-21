// AeroMOS Fleet Board — repair timeline store (mock).
// Each active timeline tracks ownership, last update, and ETR for the hourly-update rule.

const now = Date.now();
const ISO = (mins) => new Date(now + mins * 60000).toISOString();
const MIN = 60000;

const TL = {
  N105EG: { returnedToService: false, etr: ISO(120), ownerStation: "KEWR", owner: "J. Reyes", lastUpdate: now - 20 * MIN },
  N301EV: { returnedToService: false, etr: null,    ownerStation: "KORD", owner: "T. Bell",  lastUpdate: now - 125 * MIN }, // >1h → stale
  N505EG: { returnedToService: false, etr: ISO(90),  ownerStation: "KEWR", owner: "M. Okafor", lastUpdate: now - 15 * MIN },
  N722EG: { returnedToService: false, etr: ISO(30),  ownerStation: "KEWR", owner: null,       lastUpdate: now - 25 * MIN },
  N901EG: { returnedToService: false, etr: null,    ownerStation: "KORD", owner: "K. Singh", lastUpdate: now - 150 * MIN }, // stale
  N118EV: null,   // unassigned AOG — stale → AOG badge blinks
  N555EV: null,
};

const listeners = new Set();

export function getTimeline(tail) { return TL[tail] || null; }
export function subscribeTimelines(cb) { listeners.add(cb); return () => listeners.delete(cb); }
export function lastUpdateMs(tail) { const t = TL[tail]; return t ? t.lastUpdate : null; }

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtEtr(etr) {
  if (!etr) return null;
  const d = new Date(etr);
  const p = (n) => String(n).padStart(2, "0");
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}