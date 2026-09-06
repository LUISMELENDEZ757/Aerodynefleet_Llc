// AeroMOS Fleet Board — MCC operational controls store (mock).
// Controls placed from the MCC Ops Hub transfer directly onto each fleet card.

const now = Date.now();
const ISO = (mins) => new Date(now + mins * 60000).toISOString();

const MCC = {
  N105EG: { mccOwner: { name: "J. Reyes" }, ots: false, locked: true,  watch: false, ferry: false, etr: null },
  N301EV: { mccOwner: null,               ots: true,  locked: false, watch: true,  ferry: false, etr: null },
  N505EG: { mccOwner: { name: "M. Okafor" }, ots: false, locked: false, watch: false, ferry: true,  etr: ISO(90) },
  N722EG: { mccOwner: null,               ots: false, locked: false, watch: true,  ferry: false, etr: null },
  N901EG: { mccOwner: null,               ots: false, locked: true,  watch: false, ferry: false, etr: ISO(-12) }, // ETR overdue
  N555EV: { mccOwner: null,               ots: true,  locked: false, watch: false, ferry: false, etr: null },
};

const EMPTY = { mccOwner: null, ots: false, locked: false, watch: false, ferry: false, etr: null };

const listeners = new Set();
export function getMcc(tail) { return MCC[tail] ? { ...EMPTY, ...MCC[tail] } : { ...EMPTY }; }
export function subscribeMcc(cb) { listeners.add(cb); return () => listeners.delete(cb); }
export function notifyMcc() { listeners.forEach((f) => f()); }