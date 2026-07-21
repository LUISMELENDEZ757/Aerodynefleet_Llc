/* ────────────────────────────────────────────────────────────
   AERODYNE FLEET OS — GROUND OPS GANTT · engine & constants
   Turnaround timeline · RON · AOG · STAR departures
   Built on the ONE data spine (FLEET).
   ──────────────────────────────────────────────────────────── */
import { FLEET, departureRisk } from "@/data/fleet.js";
import { getMcc } from "@/data/mccControls.js";
import { TECHNICIANS } from "@/data/manpower.js";

export const WINDOW_START_HH = 5;
export const WINDOW_HOURS = 72;                 // 05:00 D0 → 05:00 D3
export const WINDOW_MIN = WINDOW_HOURS * 60;
export const MIDNIGHTS = [1140, 2580, 4020];    // 00:00 D1 / D2 / D3
export const NIGHT_LEN = WINDOW_START_HH * 60;

// ── Operational STAR ("Start The Aircraft Right") morning-readiness window ──
const STAR_WIN_START_HH = 4;   // 04:00 local
const STAR_WIN_END_HH = 9;     // 09:00 local
export const localHourOf = (m) => Math.floor(((WINDOW_START_HH * 60 + m) % 1440) / 60);
export const inStarWindow = (m) => { const h = localHourOf(m); return h >= STAR_WIN_START_HH && h < STAR_WIN_END_HH; };

export const C = {
  bg: "#0a1120", panel: "#0d1526", panel2: "#111c30", line: "#2b4b78",
  lineSoft: "#1a2942", text: "#EEF3FF", mut: "#8296B8", dim: "#6079a0",
  turn: "#3D8EF0", thru: "#00D4F5", ron: "#C084FC", aog: "#F03252",
  star: "#F5A623", delay: "#F59E0B", swap: "#00D48A", ice: "#A7BAD8",
};
export const MONO = "'JetBrains Mono', monospace";

export const fmt = (m) => {
  const abs = (WINDOW_START_HH * 60 + m) % 1440;
  return `${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
};
export const dayTag = (m) => "D" + Math.floor((m + WINDOW_START_HH * 60) / 1440);
export const BASE = (() => { const d = new Date(); d.setHours(WINDOW_START_HH, 0, 0, 0); return d; })();
export const dateFor = (m) => new Date(BASE.getTime() + m * 60000);
export const fmtDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase().replace(/,/g, "");
export const ZONES = [["EAST", "America/New_York"], ["CENT", "America/Chicago"], ["MTN", "America/Denver"], ["PAC", "America/Los_Angeles"], ["UTC", "UTC"]];
export const zoneTime = (d, tz) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d);

export const wlOf = (e) => (Number(e.wlHrs) || 0) + (e.tasks || []).reduce((s, t) => s + (Number(t.mh) || 0), 0);
export const effArr = (e) => Math.min(e.arr + (Number(e.arrDelay) || 0), WINDOW_MIN);
export const effEnd = (e) => Math.min((e.dep ?? e.etr ?? WINDOW_MIN) + (Number(e.depDelay) || 0), WINDOW_MIN);
export const hasDelay = (e) => (Number(e.arrDelay) || 0) > 0 || (Number(e.depDelay) || 0) > 0;
export const isTight = (e) => !e.aog && e.dep != null && effEnd(e) - effArr(e) < 45;

export const parseHHMM = (t) => {
  if (!t || t === "—") return null;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  let v = (h - WINDOW_START_HH) * 60 + m;
  if (v < 0) v += 1440;
  return v;
};

/* curated IATA delay codes for MOC use */
export const DELAY_CODES = [
  ["06", "NO GATE/STAND"], ["09", "SKED GROUND TIME"], ["11", "LATE CHECK-IN"], ["15", "BOARDING"],
  ["17", "CATERING"], ["18", "BAGGAGE"], ["31", "DOCUMENTATION/W&B"], ["32", "LOADING/UNLOADING"],
  ["36", "FUELING"], ["41", "AIRCRAFT DEFECT"], ["43", "NON-SKED MX"], ["44", "SPARES/MX EQUIP"],
  ["45", "AOG SPARES"], ["46", "A/C CHANGE (TECH)"], ["51", "DAMAGE FLT OPS"], ["52", "DAMAGE GRND OPS"],
  ["61", "FLIGHT PLAN"], ["62", "OPS REQUIREMENTS"], ["63", "LATE CREW"], ["71", "DEP STN WX"],
  ["73", "ENROUTE WX"], ["75", "DE-ICING"], ["81", "ATFM ENROUTE"], ["83", "ATFM DEST"],
  ["87", "AIRPORT FACILITIES"], ["89", "ATC RESTRICTIONS"], ["93", "A/C ROTATION"], ["95", "CREW ROTATION"],
];
export const codeLabel = (c) => { const f = DELAY_CODES.find(([k]) => k === c); return f ? `${f[0]} ${f[1]}` : c; };

/* departure watch: no OUT received vs current ETD */
export function depWatch(e, nowMin) {
  if (nowMin == null || e.aog || e.dep == null || e.actualOut != null) return null;
  const etd = Math.min(e.dep + (Number(e.depDelay) || 0), WINDOW_MIN);
  if (nowMin > etd + 15) return "red";
  if (nowMin > etd) return "amber";
  if (nowMin > etd - 10) return "watch";
  return null;
}

/* ── delay cascade ───────────────────────────────────────── */
export const MIN_TURN = 45, ENROUTE_RECOVERY = 10;
export function computeCascade(fleet) {
  const proj = {};
  fleet.forEach((ac) => {
    const evs = [...ac.events].sort((a, b) => a.arr - b.arr);
    let inherit = 0;
    evs.forEach((e) => {
      if (e.aog) { proj[e.id] = { pArr: 0, pDep: Number(e.depDelay) || 0 }; inherit = 0; return; }
      const pArr = Math.max(Number(e.arrDelay) || 0, inherit);
      const schedGround = (e.dep ?? WINDOW_MIN) - e.arr;
      const slack = Math.max(schedGround - MIN_TURN, 0);
      const pDep = (Number(e.depDelay) || 0) + Math.max(0, pArr - slack);
      proj[e.id] = { pArr, pDep };
      inherit = Math.max(0, pDep - ENROUTE_RECOVERY);
    });
  });
  return proj;
}

/* ── opportunity MX engine ───────────────────────────────── */
export function findOpportunities(fleet) {
  const out = [];
  fleet.forEach((ac) => (ac.dueList || []).forEach((item) => {
    const fits = [];
    ac.events.forEach((e) => {
      const avail = (effEnd(e) - effArr(e)) / 60 - wlOf(e);
      const stnOk = !item.stn || item.stn === e.stn;
      const expiryOk = !item.dueBy || effEnd(e) <= item.dueBy;
      if (avail >= item.mh + 0.5 && stnOk && expiryOk) fits.push({ e, avail: Math.round(avail * 10) / 10 });
    });
    fits.sort((a, b) => b.avail - a.avail);
    out.push({ tail: ac.tail, item, best: fits[0] ?? null, fits });
  }));
  return out;
}

/* stack overlapping events on one tail into lanes */
export function laneify(events) {
  const sorted = [...events].sort((a, b) => effArr(a) - effArr(b));
  const laneEnds = [], laneOf = {};
  sorted.forEach((e) => {
    const s = effArr(e), en = effEnd(e);
    let l = laneEnds.findIndex((le) => le <= s);
    if (l === -1) { l = laneEnds.length; laneEnds.push(en); }
    else laneEnds[l] = en;
    laneOf[e.id] = l;
  });
  return { laneOf, laneCount: Math.max(laneEnds.length, 1) };
}

/* TAIL = same aircraft double-booked; GATE = two tails one gate */
export function findConflictPairs(fleet) {
  const pairs = [];
  const ov = (a, b) => effArr(a) < effEnd(b) && effArr(b) < effEnd(a);
  fleet.forEach((ac) => {
    for (let i = 0; i < ac.events.length; i++)
      for (let j = i + 1; j < ac.events.length; j++)
        if (ov(ac.events[i], ac.events[j]))
          pairs.push({ kind: "TAIL", a: { tail: ac.tail, e: ac.events[i] }, b: { tail: ac.tail, e: ac.events[j] } });
  });
  const flat = fleet.flatMap((ac) => ac.events.map((e) => ({ tail: ac.tail, e })));
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++) {
      const A = flat[i], B = flat[j];
      if (A.tail === B.tail) continue;
      if (A.e.stn === B.e.stn && A.e.gate === B.e.gate && ov(A.e, B.e))
        pairs.push({ kind: "GATE", a: A, b: B });
    }
  return pairs;
}

/* ── Manpower capacity per station ───────────────────────── */
export function capacityByStation(fleet, station) {
  let committed = 0, aogMh = 0, events = 0;
  fleet.forEach((a) => a.events.forEach((e) => {
    if (e.stn !== station) return;
    const w = wlOf(e);
    if (e.aog || e.maint || (e.openDisc || 0) > 0 || (e.tasks || []).some((t) => !t.done)) {
      committed += w; events++;
      if (e.aog) aogMh += w;
    }
  }));
  const techs = TECHNICIANS.filter((t) => t.base === station && t.status !== "OFF SHIFT");
  const onTask = techs.filter((t) => t.status === "ON TASK").length;
  const avail = techs.filter((t) => t.status === "AVAILABLE").length;
  const techHours = techs.reduce((s, t) => s + (Number(t.shiftHoursRemaining) || 4), 0);
  const ratio = techHours > 0 ? committed / techHours : (committed > 0 ? Infinity : 0);
  let state = "ok";
  if (ratio >= 1) state = "over";
  else if (ratio >= 0.8) state = "tight";
  return { station, committed, aogMh, events, techs: techs.length, onTask, avail, techHours, ratio, state };
}
export function capacityForBoard(fleet) {
  const stns = [...new Set(fleet.flatMap((a) => a.events.map((e) => e.stn)))];
  return stns.map((s) => capacityByStation(fleet, s)).sort((a, b) => b.ratio - a.ratio);
}

/* session-unique id sequence */
let SEQ = 5000;
export const nextSeq = () => ++SEQ;

/* ── build gantt fleet from the real FLEET spine ─────────── */
export function buildFleet(manual) {
  const rows = FLEET.map((a) => {
    const arr = parseHHMM(a.arr?.time) ?? 0;
    let dep = parseHHMM(a.dep?.time);
    const mcc = getMcc(a.tail);
    const aog = a.grounded || a.boardStatus === "oos";
    const maint = a.boardStatus === "maint";
    let etr = null;
    if (mcc.etr) { const d = new Date(mcc.etr); etr = (d.getHours() - WINDOW_START_HH) * 60 + d.getMinutes(); if (etr < 0) etr += 1440; }
    if (aog) dep = null;
    const dr = departureRisk(a, Date.now());
    const groundMin = dep != null ? (dep >= arr ? dep - arr : dep + 1440 - arr) : null;
    const thru = !aog && !maint && groundMin != null && groundMin <= 90;

    const arrLocalHr = localHourOf(arr);
    const depLocalDay = dep != null ? Math.floor((WINDOW_START_HH * 60 + dep) / 1440) : null;
    const arrLocalDay = Math.floor((WINDOW_START_HH * 60 + arr) / 1440);
    const crossesMidnight = dep != null && (depLocalDay > arrLocalDay);
    const ron = !aog && (crossesMidnight || (dep == null && !maint && arrLocalHr >= 20));

    const isStarDep = !aog && dep != null && inStarWindow(dep);
    const depSlipMin = dr && dr.past ? Math.abs(dr.minsToDep) : 0;
    let starState = null; // null | "ontime" | "risk" | "fail"
    if (isStarDep) {
      const effDep = dep + depSlipMin;
      if (depSlipMin > 0 || !inStarWindow(effDep)) starState = "fail";
      else if (maint || (a.openDiscrepancies || 0) > 0) starState = "risk";
      else starState = "ontime";
    }
    const star = isStarDep;
    const dueList = [];
    if ((a.openDiscrepancies || 0) > 0 && !aog) {
      dueList.push({ id: "D-" + a.tail, ref: `MX ${a.openDiscrepancies} OPEN`, desc: `${a.openDiscrepancies} open discrepanc${a.openDiscrepancies === 1 ? "y" : "ies"} to clear`, mh: Math.max(a.openDiscrepancies * 1.5, 1.5) });
    }
    return {
      tail: a.tail, type: a.variant, dueList,
      events: [{
        id: "F-" + a.tail, stn: a.base, gate: a.gate,
        from: a.arr?.port || "—", to: aog ? null : a.dep?.port || "—",
        inFlt: a.arr?.flight || "—", outFlt: aog ? null : a.dep?.flight || "—",
        arr, dep, etr, thru, ron, star, starState, aog, maint,
        arrDelay: 0, depDelay: dr && dr.past ? Math.abs(dr.minsToDep) : 0,
        arrDelayCode: null, depDelayCode: dr && dr.past ? "93" : null,
        wlHrs: aog ? 8 : maint ? 4 : 1.5,
        openDisc: a.openDiscrepancies || 0, mccOwner: mcc.mccOwner, depRisk: dr,
        actualOn: null, actualIn: null, actualOut: null, actualOff: null,
        tasks: [], msgs: [], _ac: a,
      }],
    };
  });
  // merge manual turnarounds onto existing tails or as new rows
  manual.forEach((m) => {
    const existing = rows.find((r) => r.tail === m.tail);
    if (existing) existing.events.push(m.event);
    else rows.push({ tail: m.tail, type: m.type, events: [m.event] });
  });
  return rows;
}