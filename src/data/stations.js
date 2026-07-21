// AeroMOS Fleet Board — station selection store (mock).

export const STATIONS = [
  { code: "KEWR", name: "Newark Liberty Intl", city: "Newark" },
  { code: "KORD", name: "Chicago O'Hare Intl", city: "Chicago" },
  { code: "KDFW", name: "Dallas/Fort Worth Intl", city: "Dallas" },
  { code: "KDEN", name: "Denver Intl", city: "Denver" },
];

let selected = null;
const listeners = new Set();

export function getSelectedStation() { return selected; }
export function setSelectedStation(code) { selected = code; listeners.forEach((f) => f()); }
export function clearSelectedStation() { selected = null; listeners.forEach((f) => f()); }
export function subscribeStation(cb) { listeners.add(cb); return () => listeners.delete(cb); }
export function getStation(code) { return STATIONS.find((s) => s.code === code) || null; }