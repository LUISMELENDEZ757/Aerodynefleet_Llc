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

// ── MCC Dashboard → Fleet Board bridge ────────────────────────────────────
// Called from the Fleet Dashboard with the current active MccLock records from
// the OS database. Mirrors MCC control (positive-fix locks + who placed them)
// onto each aircraft's fleet card so the board reflects live MCC control.
export function applyMccLocks(lockRecords) {
  const locked = {};
  (lockRecords || []).forEach((l) => { if (l && l.aircraft_tail) locked[l.aircraft_tail] = l; });
  const allTails = new Set([...Object.keys(MCC), ...Object.keys(locked)]);
  allTails.forEach((tail) => {
    if (locked[tail]) {
      MCC[tail] = {
        ...EMPTY, ...(MCC[tail] || {}),
        locked: true,
        ots: false,
        lockReason: locked[tail].reason || null,
        lockBy: locked[tail].placed_by || null,
        mccOwner: locked[tail].placed_by ? { name: locked[tail].placed_by } : (MCC[tail]?.mccOwner || null),
      };
    } else {
      MCC[tail] = {
        ...EMPTY, ...(MCC[tail] || {}),
        locked: false,
        lockReason: null,
        lockBy: null,
        mccOwner: null,
      };
    }
  });
  notifyMcc();
}