// AeroMOS Fleet Board — technician roster store (mock).
// Feeds the Ground Ops Gantt manpower capacity lane. Bases use ICAO codes to match FLEET.

export const TECHNICIANS = [
  // KEWR
  { id: "T-001", name: "R. Alvarez",   base: "KEWR", cert: "A&P",      status: "ON TASK",   shiftHoursRemaining: 5 },
  { id: "T-002", name: "K. Donnelly",  base: "KEWR", cert: "A&P/IA",   status: "AVAILABLE", shiftHoursRemaining: 7 },
  { id: "T-003", name: "S. Park",      base: "KEWR", cert: "Avionics", status: "AVAILABLE", shiftHoursRemaining: 6 },
  { id: "T-004", name: "M. Osei",      base: "KEWR", cert: "A&P",      status: "ON TASK",   shiftHoursRemaining: 3 },
  { id: "T-005", name: "D. Kowalski",  base: "KEWR", cert: "A&P",      status: "OFF SHIFT", shiftHoursRemaining: 0 },
  // KORD
  { id: "T-101", name: "J. Whitfield", base: "KORD", cert: "A&P/IA",   status: "AVAILABLE", shiftHoursRemaining: 8 },
  { id: "T-102", name: "L. Nguyen",    base: "KORD", cert: "A&P",      status: "ON TASK",   shiftHoursRemaining: 4 },
  { id: "T-103", name: "P. Castillo",  base: "KORD", cert: "Avionics", status: "AVAILABLE", shiftHoursRemaining: 6 },
  // KDFW
  { id: "T-201", name: "A. Brooks",    base: "KDFW", cert: "A&P",      status: "AVAILABLE", shiftHoursRemaining: 7 },
  { id: "T-202", name: "H. Sato",      base: "KDFW", cert: "A&P/IA",   status: "ON TASK",   shiftHoursRemaining: 2 },
  // KDEN
  { id: "T-301", name: "C. Meyer",     base: "KDEN", cert: "A&P",      status: "AVAILABLE", shiftHoursRemaining: 6 },
  { id: "T-302", name: "F. Ibrahim",   base: "KDEN", cert: "A&P",      status: "OFF SHIFT", shiftHoursRemaining: 0 },
];

const listeners = new Set();
export function subscribeRoster(cb) { listeners.add(cb); return () => listeners.delete(cb); }
export function notifyRoster() { listeners.forEach((f) => f()); }