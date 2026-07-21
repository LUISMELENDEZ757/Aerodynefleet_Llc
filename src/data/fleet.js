// AeroMOS Fleet Board — standalone mock fleet (disconnected from production DB).
// In-memory pub/sub so the Fleet Board re-renders when something changes.

const _now = new Date();
const z = (n) => String(n).padStart(2, "0");
// Departure times are anchored relative to load time so the T-20 / past-dep
// banners are always live when the prototype is opened.
const depIn = (mins) => {
  const d = new Date(_now.getTime() + mins * 60000);
  return `${z(d.getUTCHours())}:${z(d.getUTCMinutes())}`;
};

export const FLEET = [
  {
    id: "N102EG", tail: "N102EG", variant: "B737-800", base: "KEWR",
    boardStatus: "released", grounded: false,
    openDiscrepancies: 0, openMel: 0,
    fob: 17200, fobMax: 26000, fuelOnBoard: "17,200 lb",
    gate: "B12", location: "Terminal A · Gate B12",
    arr: { time: "08:15", port: "KMCO", flight: "AX 2210" },
    dep: { time: depIn(220), port: "KMCO", flight: "AX 2210" },
    flags: [],
  },
  {
    id: "N105EG", tail: "N105EG", variant: "B737 MAX 8", base: "KEWR",
    boardStatus: "maint", grounded: false,
    openDiscrepancies: 2, openMel: 1,
    fob: 6100, fobMax: 26000, fuelOnBoard: "6,100 lb",
    gate: "MX", location: "Hangar 2 · Bay 4",
    arr: { time: "07:40", port: "KEWR", flight: "AX 882" },
    dep: { time: depIn(25), port: "KATL", flight: "AX 318" },
    flags: [{ key: "MOC" }],
  },
  {
    id: "N118EV", tail: "N118EV", variant: "A320", base: "KEWR",
    boardStatus: "oos", grounded: true,
    openDiscrepancies: 1, openMel: 1,
    fob: 9400, fobMax: 23860, fuelOnBoard: "9,400 lb",
    gate: "AOG", location: "Remote Pad R3",
    arr: { time: "06:55", port: "KEWR", flight: "AX 1142" },
    dep: { time: depIn(12), port: "KDFW", flight: "AX 1142" },
    flags: [{ key: "O2" }],
  },
  {
    id: "N203EV", tail: "N203EV", variant: "B737-800", base: "KORD",
    boardStatus: "released", grounded: false,
    openDiscrepancies: 0, openMel: 1,
    fob: 15800, fobMax: 26000, fuelOnBoard: "15,800 lb",
    gate: "A7", location: "Terminal 3 · Gate A7",
    arr: { time: "09:05", port: "KDEN", flight: "AX 552" },
    dep: { time: depIn(140), port: "KBOS", flight: "AX 552" },
    flags: [],
  },
  {
    id: "N301EV", tail: "N301EV", variant: "CRJ900", base: "KORD",
    boardStatus: "maint", grounded: true,
    openDiscrepancies: 1, openMel: 0,
    fob: 4200, fobMax: 19000, fuelOnBoard: "4,200 lb",
    gate: "MX", location: "Line MX · Bay 2",
    arr: { time: "06:30", port: "KORD", flight: "AX 4474" },
    dep: { time: depIn(-8), port: "KMSP", flight: "AX 4474" },
    flags: [{ key: "OIL" }],
  },
  {
    id: "N402EG", tail: "N402EG", variant: "B737-700", base: "KDFW",
    boardStatus: "released", grounded: false,
    openDiscrepancies: 0, openMel: 0,
    fob: 20100, fobMax: 23860, fuelOnBoard: "20,100 lb",
    gate: "C3", location: "Terminal D · Gate C3",
    arr: { time: "08:40", port: "KPHX", flight: "AX 712" },
    dep: { time: depIn(95), port: "KLAX", flight: "AX 712" },
    flags: [],
  },
  {
    id: "N505EG", tail: "N505EG", variant: "A320", base: "KEWR",
    boardStatus: "maint", grounded: false,
    openDiscrepancies: 1, openMel: 0,
    fob: 8800, fobMax: 23860, fuelOnBoard: "8,800 lb",
    gate: "MX", location: "Hangar 1 · Bay 2",
    arr: { time: "07:10", port: "KEWR", flight: "AX 990" },
    dep: { time: depIn(200), port: "KSEA", flight: "AX 990" },
    flags: [{ key: "MOC" }],
  },
  {
    id: "N611EV", tail: "N611EV", variant: "B737 MAX 8", base: "KDEN",
    boardStatus: "released", grounded: false,
    openDiscrepancies: 0, openMel: 2,
    fob: 14300, fobMax: 26000, fuelOnBoard: "14,300 lb",
    gate: "B4", location: "Terminal C · Gate B4",
    arr: { time: "08:58", port: "KSFO", flight: "AX 320" },
    dep: { time: depIn(110), port: "KLAX", flight: "AX 320" },
    flags: [],
  },
  {
    id: "N722EG", tail: "N722EG", variant: "B777-300ER", base: "KEWR",
    boardStatus: "oos", grounded: true,
    openDiscrepancies: 1, openMel: 0,
    fob: 32000, fobMax: 145000, fuelOnBoard: "32,000 lb",
    gate: "AOG", location: "Hardstand H9",
    arr: { time: "06:20", port: "KEWR", flight: "AX 007" },
    dep: { time: depIn(45), port: "EGLL", flight: "AX 007" },
    flags: [{ key: "O2" }],
  },
  {
    id: "N833EV", tail: "N833EV", variant: "A350-900", base: "KDFW",
    boardStatus: "released", grounded: false,
    openDiscrepancies: 0, openMel: 0,
    fob: 41000, fobMax: 165000, fuelOnBoard: "41,000 lb",
    gate: "A2", location: "International · Gate A2",
    arr: { time: "09:12", port: "EHAM", flight: "AX 901" },
    dep: { time: "—", port: "EHAM", flight: "—" },
    flags: [],
  },
  {
    id: "N901EG", tail: "N901EG", variant: "E175", base: "KORD",
    boardStatus: "maint", grounded: true,
    openDiscrepancies: 3, openMel: 1,
    fob: 2400, fobMax: 12000, fuelOnBoard: "2,400 lb",
    gate: "MX", location: "Regional MX · Bay 1",
    arr: { time: "05:50", port: "KORD", flight: "AX 5560" },
    dep: { time: depIn(3), port: "KMSP", flight: "AX 5560" },
    flags: [{ key: "OIL" }],
  },
  {
    id: "N444EV", tail: "N444EV", variant: "B737-800", base: "KDFW",
    boardStatus: "released", grounded: false,
    openDiscrepancies: 0, openMel: 0,
    fob: 22500, fobMax: 26000, fuelOnBoard: "22,500 lb",
    gate: "C1", location: "Terminal D · Gate C1",
    arr: { time: "09:25", port: "KMCI", flight: "AX 644" },
    dep: { time: "—", port: "KSLC", flight: "—" },
    flags: [],
  },
  {
    id: "N555EV", tail: "N555EV", variant: "B737-700", base: "KDEN",
    boardStatus: "oos", grounded: true,
    openDiscrepancies: 1, openMel: 0,
    fob: 5600, fobMax: 23860, fuelOnBoard: "5,600 lb",
    gate: "AOG", location: "Remote Pad R1",
    arr: { time: "06:10", port: "KDEN", flight: "AX 221" },
    dep: { time: depIn(60), port: "KPHX", flight: "AX 221" },
    flags: [],
  },
  {
    id: "N666EG", tail: "N666EG", variant: "B737 MAX 8", base: "KEWR",
    boardStatus: "released", grounded: false,
    openDiscrepancies: 0, openMel: 0,
    fob: 19000, fobMax: 26000, fuelOnBoard: "19,000 lb",
    gate: "B9", location: "Terminal A · Gate B9",
    arr: { time: "09:40", port: "KEWR", flight: "AX 55" },
    dep: { time: depIn(300), port: "KIAH", flight: "AX 55" },
    flags: [],
  },
];

export const BOARD_FILTERS = [
  { key: "ALL", label: "All", match: () => true },
  { key: "AOG", label: "AOG", match: (a) => a.grounded },
  { key: "MAINT", label: "Maintenance", match: (a) => a.boardStatus === "maint" && !a.grounded },
  { key: "MEL", label: "MEL Active", match: (a) => a.openMel > 0 },
  { key: "RELEASED", label: "Released", match: (a) => a.boardStatus === "released" && !a.grounded },
  { key: "GROUND", label: "Grounded", match: (a) => a.grounded || a.boardStatus === "oos" || a.boardStatus === "maint" },
];

// T-20 departure risk — only fires when maintenance is still open against a
// scheduled departure within the 90-minute window, or already past departure.
export function departureRisk(a, nowMs) {
  if (a.dep.time === "—") return null;
  const hasOpenWork = a.grounded || a.openDiscrepancies > 0 || a.boardStatus === "maint";
  if (!hasOpenWork) return null;
  const [h, m] = a.dep.time.split(":").map(Number);
  const d = new Date(nowMs);
  const depTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0).getTime();
  const mins = Math.round((depTs - nowMs) / 60000);
  const past = mins < 0;
  if (!past && mins > 90) return null; // outside the live departure window
  return { depTime: a.dep.time, past, minsToDep: Math.abs(mins) };
}

const listeners = new Set();
export function subscribeFleet(cb) { listeners.add(cb); return () => listeners.delete(cb); }
export function notifyFleet() { listeners.forEach((f) => f()); }