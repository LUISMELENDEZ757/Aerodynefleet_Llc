import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeFleet } from "@/data/fleet.js";
import { setSelectedStation } from "@/data/stations.js";
import { subscribeRoster } from "@/data/manpower.js";
import { fetchServerHeartbeats, heartbeatFreshness } from "@/data/connections.js";
import {
  WINDOW_START_HH, WINDOW_HOURS, WINDOW_MIN, MIDNIGHTS, NIGHT_LEN, inStarWindow,
  C, MONO, fmt, dayTag, BASE, dateFor, fmtDate, ZONES, zoneTime,
  wlOf, effArr, effEnd, hasDelay, isTight, DELAY_CODES, codeLabel, depWatch,
  MIN_TURN, computeCascade, findOpportunities, laneify, findConflictPairs,
  capacityByStation, capacityForBoard, nextSeq, buildFleet,
} from "./ganttUtils";
import { Chip, Stat, inp, L, I, tag, linkBtn } from "./ganttUi";

export default function GroundOpsGantt({ onOpenAircraft, onNavigate }) {
  const routerNav = useNavigate();
  const NAV_MAP = { "world-stations": "/GlobalStations", manpower: "/ManpowerStaffing", mcc: "/MaintenanceControl", "admin-settings": "/Settings" };
  onNavigate = onNavigate || ((k) => NAV_MAP[k] && routerNav(NAV_MAP[k]));
  onOpenAircraft = onOpenAircraft || ((ac) => routerNav(`/AircraftDetail?tail=${ac.tail}`));

  const [manual, setManual] = useState([]);           // operator-added turnarounds
  const [patches, setPatches] = useState({});         // evtId -> { arrDelay, depDelay, tasks, msgs }
  const [, force] = useState(0);
  useEffect(() => subscribeFleet(() => force((n) => n + 1)), []);
  useEffect(() => subscribeRoster(() => force((n) => n + 1)), []);

  const [pxMin, setPxMin] = useState(0.7);
  const [filter, setFilter] = useState("ALL");
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [cascade, setCascade] = useState(true);
  const [focus, setFocus] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showOpty, setShowOpty] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [copied, setCopied] = useState(false);
  const [assigned, setAssigned] = useState(new Set());
  const [ooT, setOoT] = useState("12:00");
  const [ooD, setOoD] = useState("D0");
  const [ooF, setOoF] = useState("actualIn");
  const [stnSel, setStnSel] = useState(new Set());
  const [stnOpen, setStnOpen] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [clock, setClock] = useState(new Date());
  const [fa, setFa] = useState({ state: "checking", label: "checking…" });

  // Drag-to-pan the timeline horizontally with the mouse
  const scrollRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  function onPanDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest("button, input, select, a, svg")) return;
    const el = scrollRef.current; if (!el) return;
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }
  function onPanMove(e) {
    const d = drag.current; if (!d.active) return;
    const el = scrollRef.current; if (!el) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true;
    el.scrollLeft = d.startLeft - dx;
  }
  function onPanUp() {
    const el = scrollRef.current;
    if (el) { el.style.cursor = "grab"; el.style.userSelect = ""; }
    drag.current.active = false;
  }
  useEffect(() => {
    window.addEventListener("mousemove", onPanMove);
    window.addEventListener("mouseup", onPanUp);
    return () => { window.removeEventListener("mousemove", onPanMove); window.removeEventListener("mouseup", onPanUp); };
  }, []);

  useEffect(() => { const c = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(c); }, []);
  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const map = await fetchServerHeartbeats();
        const hb = map?.["flightdata-flightaware"] || map?.["flightaware"];
        if (!alive) return;
        if (hb && heartbeatFreshness(hb) === "fresh") setFa({ state: "live", label: "LIVE · AeroAPI" });
        else if (hb) setFa({ state: "stale", label: "STALE HEARTBEAT" });
        else setFa({ state: "offline", label: "OFFLINE · generated data" });
      } catch { if (alive) setFa({ state: "offline", label: "OFFLINE · generated data" }); }
    })();
    return () => { alive = false; };
  }, []);

  const nowMin = useMemo(() => {
    const d = new Date(nowMs);
    let m = (d.getHours() - WINDOW_START_HH) * 60 + d.getMinutes();
    if (m < 0) m += 1440;
    return m >= 0 && m <= WINDOW_MIN ? m : null;
  }, [nowMs]);

  // Apply per-event patches (delays / tasks / msgs) onto the built fleet
  const fleet = useMemo(() => {
    const base = buildFleet(manual);
    return base.map((a) => ({ ...a, events: a.events.map((e) => patches[e.id] ? { ...e, ...patches[e.id] } : e) }));
  }, [manual, patches, nowMs, force]);

  const confPairs = useMemo(() => findConflictPairs(fleet), [fleet]);
  const tailConf = new Set(), gateConf = new Set();
  confPairs.forEach((p) => { const s = p.kind === "TAIL" ? tailConf : gateConf; s.add(p.a.e.id); s.add(p.b.e.id); });

  const proj = useMemo(() => computeCascade(fleet), [fleet]);
  const optys = useMemo(() => findOpportunities(fleet).filter((o) => !assigned.has(o.item.id)), [fleet, assigned]);
  const optyEvt = new Set(optys.filter((o) => o.best).map((o) => o.best.e.id));
  const starRisk = fleet.flatMap((a) => a.events).filter((e) => e.star && (proj[e.id]?.pDep || 0) > 0).length;
  const depAlert = nowMin == null ? 0
    : fleet.flatMap((a) => a.events).filter((e) => ["amber", "red"].includes(depWatch(e, nowMin) || "")).length;

  const stats = useMemo(() => {
    let aog = 0, ron = 0, thru = 0, wl = 0, dly = 0, starTotal = 0, starOk = 0, starFail = 0, starRiskN = 0;
    fleet.forEach((a) => a.events.forEach((e) => {
      if (e.aog) aog++; if (e.ron) ron++; if (e.thru) thru++; wl += wlOf(e); if (hasDelay(e)) dly++;
      if (e.starState) { starTotal++; if (e.starState === "fail") starFail++; else if (e.starState === "risk") starRiskN++; else starOk++; }
    }));
    const starRate = starTotal ? Math.round((starOk / starTotal) * 100) : null;
    return { tails: fleet.length, aog, ron, thru, wl, dly, conf: new Set([...tailConf, ...gateConf]).size, starTotal, starOk, starFail, starRisk: starRiskN, starRate };
  }, [fleet, confPairs]);

  const stations = useMemo(() => [...new Set(fleet.flatMap((a) => a.events.map((e) => e.stn)))].sort(), [fleet]);
  const capacity = useMemo(() => capacityForBoard(fleet), [fleet, force]);
  const capOverloaded = capacity.filter((c) => c.state === "over").length;
  const [showCap, setShowCap] = useState(true);
  const toggleStn = (s) => setStnSel((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  const stnOk = (e) => stnSel.size === 0 || stnSel.has(e.stn);

  const visible = fleet
    .map((a) => ({ ...a, events: a.events.filter((e) => {
      if (!stnOk(e)) return false;
      if (filter === "AOG") return e.aog;
      if (filter === "RON") return e.ron;
      if (filter === "STAR") return !!e.starState;
      if (filter === "DLY") return hasDelay(e) || e.depRisk;
      if (filter === "CONF") return tailConf.has(e.id) || gateConf.has(e.id);
      return true;
    }) }))
    .filter((a) => a.events.length > 0)
    .sort((x, y) => (y.events.some((e) => e.aog) - x.events.some((e) => e.aog)))
    .slice(0, 120);

  const W = WINDOW_MIN * pxMin;
  const BAR_H = 40, LANE_STEP = 46, ROW_PAD = 12;
  const geo = {};
  { let accTop = 0; visible.forEach((a) => { const li = laneify(a.events); const h = ROW_PAD + LANE_STEP * li.laneCount; geo[a.tail] = { top: accTop, h, laneOf: li.laneOf }; accTop += h; }); }

  /* patch helpers */
  function patchEvent(id, fn) {
    setPatches((prev) => {
      const cur = prev[id] || {};
      const evt = fleet.flatMap((a) => a.events).find((e) => e.id === id) || {};
      const merged = fn({ ...evt, ...cur });
      return { ...prev, [id]: {
        arrDelay: merged.arrDelay, depDelay: merged.depDelay,
        arrDelayCode: merged.arrDelayCode, depDelayCode: merged.depDelayCode,
        actualOn: merged.actualOn, actualIn: merged.actualIn, actualOut: merged.actualOut, actualOff: merged.actualOff,
        tasks: merged.tasks, msgs: merged.msgs,
      } };
    });
  }

  // Assign a due opportunity-MX item into a turnaround as a task (session-local)
  function assignOpty(tail, itemId, evtId) {
    const row = fleet.find((a) => a.tail === tail);
    const item = (row?.dueList || []).find((d) => d.id === itemId);
    if (!item) return;
    patchEvent(evtId, (e) => ({ ...e, tasks: [...(e.tasks || []), { id: nextSeq(), desc: `[${item.ref}] ${item.desc}`, mh: item.mh, done: false }] }));
    setAssigned((prev) => new Set(prev).add(itemId));
  }

  /* add-turnaround form */
  const [f, setF] = useState({ tail: "", type: "B737-8", stn: "EWR", fromS: "", toS: "", gate: "", inFlt: "", outFlt: "",
    arrT: "12:00", arrD: "D0", depT: "14:00", depD: "D0", thru: false, ron: false, star: false, aog: false, wlHrs: 2, etrT: "", etrD: "D0", arrDly: "0", depDly: "0" });
  const toMin = (t, d) => { const [h, m] = t.split(":").map(Number); const dayIdx = Number(String(d).slice(1)) || 0; return Math.min(Math.max(dayIdx * 1440 + h * 60 + m - WINDOW_START_HH * 60, 0), WINDOW_MIN); };
  function addFlight() {
    if (!f.tail || !f.gate || !f.arrT) return;
    const arr = toMin(f.arrT, f.arrD);
    const dep = f.aog ? null : toMin(f.depT, f.depD);
    const etr = f.aog && f.etrT ? toMin(f.etrT, f.etrD) : undefined;
    const event = { id: "M-" + nextSeq(), stn: (f.stn || "EWR").toUpperCase(), from: (f.fromS || "—").toUpperCase(), to: f.aog ? null : (f.toS || "—").toUpperCase(),
      gate: f.gate.toUpperCase(), inFlt: f.inFlt || "—", outFlt: f.aog ? null : f.outFlt || "—", arr, dep, etr,
      thru: f.thru, ron: f.ron, star: f.star, aog: f.aog, wlHrs: Number(f.wlHrs) || 0,
      arrDelay: Math.max(Number(f.arrDly) || 0, 0), depDelay: Math.max(Number(f.depDly) || 0, 0), tasks: [], msgs: [] };
    setManual((prev) => [...prev, { tail: f.tail.toUpperCase(), type: f.type, event }]);
    setShowAdd(false);
  }

  const [tDesc, setTDesc] = useState(""); const [tMh, setTMh] = useState("1"); const [msgTxt, setMsgTxt] = useState("");
  function addTask() { if (!sel || !tDesc.trim()) return; patchEvent(sel.id, (e) => ({ ...e, tasks: [...(e.tasks || []), { id: nextSeq(), desc: tDesc.trim(), mh: Number(tMh) || 0, done: false }] })); setTDesc(""); setTMh("1"); }
  function toggleTask(tid) { patchEvent(sel.id, (e) => ({ ...e, tasks: (e.tasks || []).map((t) => t.id === tid ? { ...t, done: !t.done } : t) })); }
  function delTask(tid) { patchEvent(sel.id, (e) => ({ ...e, tasks: (e.tasks || []).filter((t) => t.id !== tid) })); }
  function addMsg() { if (!sel || !msgTxt.trim()) return; patchEvent(sel.id, (e) => ({ ...e, msgs: [...(e.msgs || []), { id: nextSeq(), at: nowMin ?? 0, user: "MOC", text: msgTxt.trim() }] })); setMsgTxt(""); }
  function delManual(id) { setManual((prev) => prev.filter((m) => m.event.id !== id)); setSel(null); }

  // ── Shift handover brief: a copy-ready MOC snapshot of the board ──
  function buildHandover() {
    const Ls = [];
    const p = (s = "") => Ls.push(s);
    p("═══ AERODYNE FLEET OS — MOC SHIFT HANDOVER ═══");
    p(`GENERATED ${fmtDate(clock)} ${zoneTime(clock, "America/New_York")} EAST / ${zoneTime(clock, "UTC")}Z`);
    p(`WINDOW ${fmtDate(BASE)} 05:00 → ${fmtDate(dateFor(WINDOW_MIN))} 05:00`);

    p(""); p("── 1. AOG / OUT OF SERVICE ──");
    let n = 0;
    fleet.forEach((a) => a.events.forEach((e) => {
      if (!e.aog) return; n++;
      const slip = Number(e.depDelay) || 0;
      p(`• ${a.tail} (${a.type}) ${e.stn}·${e.gate} — IN ${e.inFlt} ex ${e.from}, ON GND ${fmt(e.arr)} ${dayTag(e.arr)}`);
      p(`  ETR ${e.etr ? `${fmt(e.etr + slip)} ${dayTag(e.etr + slip)}` : "TBD"}${slip ? ` (SLIPPED +${slip}′${e.depDelayCode ? ` · CODE ${codeLabel(e.depDelayCode)}` : ""})` : ""}`);
      p(`  WORK ${(e.tasks || []).filter((t) => t.done).length}/${(e.tasks || []).length} TASKS · ${wlOf(e).toFixed(1)} MH`);
      (e.tasks || []).filter((t) => !t.done).forEach((t) => p(`    ○ ${t.desc} (${t.mh} MH)`));
    }));
    if (!n) p("• NIL");

    p(""); p("── 2. DEPARTURE ALERTS (LIVE) ──"); n = 0;
    fleet.forEach((a) => a.events.forEach((e) => {
      const wch = depWatch(e, nowMin);
      if (wch !== "amber" && wch !== "red") return; n++;
      p(`• ${wch.toUpperCase()} — ${a.tail} ${e.outFlt} ${e.stn}·${e.gate} ETD ${fmt(Math.min(e.dep + (Number(e.depDelay) || 0), WINDOW_MIN))} · NO OUT RECEIVED`);
    }));
    if (!n) p("• NIL");

    p(""); p("── 3. STAR MORNING DEPARTURES (0400–0900) ──"); n = 0;
    fleet.forEach((a) => a.events.forEach((e) => {
      if (!e.starState) return; n++;
      const tg = e.starState === "fail" ? "FAIL" : e.starState === "risk" ? "AT RISK" : "ON TIME";
      p(`• ${a.tail} ${e.outFlt} ${e.stn} — STAR ${tg} · sched ${fmt(e.dep)}${e.openDisc ? ` · ${e.openDisc} open` : ""}`);
    }));
    if (!n) p("• NIL");

    p(""); p("── 4. DELAYS ──"); n = 0;
    fleet.forEach((a) => a.events.forEach((e) => {
      if (!hasDelay(e)) return; n++;
      const parts = [];
      if (Number(e.arrDelay) > 0) parts.push(`ARR +${e.arrDelay}′${e.arrDelayCode ? ` (${codeLabel(e.arrDelayCode)})` : ""}`);
      if (Number(e.depDelay) > 0) parts.push(`${e.aog ? "ETR SLIP" : "DEP"} +${e.depDelay}′${e.depDelayCode ? ` (${codeLabel(e.depDelayCode)})` : ""}`);
      p(`• ${a.tail} ${e.outFlt ?? e.inFlt} ${e.stn} — ${parts.join(" · ")}`);
      const P = proj[e.id];
      const knock = P ? Math.max(P.pDep - (Number(e.depDelay) || 0), 0) : 0;
      if (cascade && knock > 0) p(`  PROJ KNOCK-ON +${knock}′ (93 ROTATION)`);
    }));
    if (!n) p("• NIL");

    p(""); p("── 5. CONFLICTS ──");
    if (!confPairs.length) p("• NIL");
    confPairs.forEach((c) => p(`• ${c.kind} — ${c.a.tail} vs ${c.b.tail} at ${c.a.e.stn}·${c.a.e.gate}`));

    p(""); p("── 6. MANPOWER — OVER CAPACITY STATIONS ──"); n = 0;
    capacity.filter((c) => c.state === "over").forEach((c) => { n++; p(`• ${c.station} — ${c.committed.toFixed(0)} MH vs ${c.techHours.toFixed(0)} tech-hrs (${isFinite(c.ratio) ? Math.round(c.ratio * 100) : "∞"}%) · ${c.avail}/${c.techs} avail`); });
    if (!n) p("• NIL");

    p(""); p("── 7. OPEN MX OPPORTUNITIES ──");
    if (!optys.length) p("• NIL — ALL DUE ITEMS ASSIGNED");
    optys.forEach((o) => {
      if (o.best) p(`• ${o.tail} ${o.item.ref} (${o.item.mh} MH) — FITS ${o.best.e.stn}·${o.best.e.gate} ${fmt(effArr(o.best.e))}–${fmt(effEnd(o.best.e))} ${dayTag(effArr(o.best.e))}`);
      else p(`• ⚠ ${o.tail} ${o.item.ref} (${o.item.mh} MH) — NO FIT, ESCALATE`);
    });

    p(""); p("── 8. RON PLAN ──"); n = 0;
    fleet.forEach((a) => a.events.forEach((e) => {
      if (!e.ron) return; n++;
      p(`• ${a.tail} ${e.stn}·${e.gate} ${fmt(effArr(e))} ${dayTag(effArr(e))} · ${wlOf(e).toFixed(1)} MH · ${(e.tasks || []).length} TASKS${e.starState ? " · STAR AM DEP" : ""}`);
    }));
    if (!n) p("• NIL");
    p(""); p("═══ END HANDOVER ═══");
    return Ls.join("\n");
  }
  async function copyHandover() {
    try { await navigator.clipboard.writeText(buildHandover()); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard unavailable — text remains selectable */ }
  }

  const selAc = sel ? fleet.find((a) => a.tail === sel.tail) : null;
  const selEvt = selAc ? selAc.events.find((e) => e.id === sel.id) : null;

  function openStation(icao) { setSelectedStation(icao); if (onNavigate) onNavigate("world-stations"); }

  const bar = (ac, e, lane) => {
    const schedEnd = e.dep ?? (e.etr ?? WINDOW_MIN);
    const arrD = Number(e.arrDelay) || 0, depD = Number(e.depDelay) || 0;
    const P = cascade ? (proj[e.id] || { pArr: arrD, pDep: depD }) : { pArr: arrD, pDep: depD };
    const pArrX = Math.max(P.pArr - arrD, 0), pDepX = Math.max(P.pDep - depD, 0);
    const end = Math.min(effEnd(e) + pDepX, WINDOW_MIN);
    const x = e.arr * pxMin, w = Math.max((Math.min(end, WINDOW_MIN) - e.arr) * pxMin, 26);
    const col = e.aog ? C.aog : e.ron ? C.ron : e.thru ? C.thru : C.turn;
    const tC = tailConf.has(e.id), gC = gateConf.has(e.id);
    const wlPct = Math.min((wlOf(e) / 12) * 100, 100);
    const nTasks = (e.tasks || []).length, nMsgs = (e.msgs || []).length;
    const departed = e.actualOut != null;
    const watch = depWatch(e, nowMin);
    return (
      <div key={e.id} onClick={() => { if (drag.current.moved) return; setSel({ tail: ac.tail, id: e.id }); }} title={`${ac.tail} ${e.inFlt}→${e.outFlt ?? "AOG"}`}
        style={{ position: "absolute", left: x, width: w, top: 6 + lane * LANE_STEP, height: BAR_H, cursor: "pointer", opacity: departed ? 0.55 : 1 }}>
        <div style={{ position: "relative", height: "100%", borderRadius: 6, overflow: "hidden",
          background: e.aog ? `${C.aog}1F` : `${col}1A`,
          border: tC ? `1.5px dashed ${C.aog}` : gC ? `1.5px dashed ${C.delay}` : `1px solid ${col}${e.aog ? "" : "AA"}`,
          boxShadow: tC ? `0 0 12px ${C.aog}55` : gC ? `0 0 12px ${C.delay}44` : (e.depRisk ? `0 0 0 1px ${C.aog}` : "none"),
          animation: (e.aog || e.depRisk) && !tC && !gC ? "aogPulse 2.4s ease-in-out infinite" : "none",
          backgroundImage: e.ron ? `repeating-linear-gradient(135deg, ${C.ron}26 0 6px, transparent 6px 12px)` : "none" }}>
          {arrD > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: arrD * pxMin, backgroundImage: `repeating-linear-gradient(45deg, ${C.delay}33 0 4px, transparent 4px 8px)`, borderRight: `1px dashed ${C.delay}` }} />}
          {depD > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: (Math.min(schedEnd, WINDOW_MIN) - e.arr) * pxMin, width: (Math.min(effEnd(e), WINDOW_MIN) - Math.min(schedEnd, WINDOW_MIN)) * pxMin, backgroundImage: `repeating-linear-gradient(45deg, ${C.delay}44 0 4px, transparent 4px 8px)`, borderLeft: `1px dashed ${C.delay}` }} />}
          {pArrX > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: arrD * pxMin, width: pArrX * pxMin, backgroundImage: `repeating-linear-gradient(45deg, ${C.delay}1C 0 3px, transparent 3px 7px)`, borderRight: `1px dotted ${C.delay}` }} />}
          {pDepX > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: (Math.min(effEnd(e), WINDOW_MIN) - e.arr) * pxMin, width: pDepX * pxMin, backgroundImage: `repeating-linear-gradient(45deg, ${C.delay}1C 0 3px, transparent 3px 7px)`, borderLeft: `1px dotted ${C.delay}` }} />}
          <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, width: `${wlPct}%`, background: col }} />
          {e.actualIn != null && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: C.swap }} title={`BLOCK IN ${fmt(e.actualIn)}`} />}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", height: "100%", minWidth: 0, position: "relative" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.text, whiteSpace: "nowrap" }}><strong>{e.stn}</strong>·{e.gate}</span>
            {w > 90 && <span style={{ fontSize: 10, color: C.mut, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: MONO }}>{e.from} {e.inFlt}{e.outFlt ? ` → ${e.outFlt} ${e.to}` : " → NO OUTBND"}</span>}
            {w > 130 && (nTasks > 0 || nMsgs > 0) && <span style={{ fontFamily: MONO, fontSize: 9, color: C.mut, whiteSpace: "nowrap" }}>{nTasks > 0 && `⚒${nTasks}`}{nTasks > 0 && nMsgs > 0 && " "}{nMsgs > 0 && `✉${nMsgs}`}</span>}
            {isTight(e) && w > 40 && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.delay, whiteSpace: "nowrap" }}>TIGHT</span>}
            {e.aog && w > 60 && <span style={{ fontFamily: MONO, fontSize: 10, color: C.aog, marginLeft: "auto", whiteSpace: "nowrap" }}>AOG{e.etr ? ` · ETR ${fmt(e.etr + depD)}${depD > 0 ? "▲" : ""}` : ""}</span>}
          </div>
        </div>
        {watch && <div style={{ position: "absolute", right: -6, top: BAR_H / 2 - 5, width: 10, height: 10, borderRadius: 9999, zIndex: 5, background: watch === "red" ? C.aog : C.delay, boxShadow: `0 0 8px ${watch === "red" ? C.aog : C.delay}`, border: `1px solid ${C.bg}`, animation: watch === "watch" ? "none" : `blinkDot ${watch === "red" ? "0.6s" : "1.1s"} step-end infinite` }} title={watch === "red" ? "IN DELAY 15+ MIN — NO OUT RECEIVED" : watch === "amber" ? "ETD PASSED — NO OUT RECEIVED" : "D-10 TO PUSH"} />}
        {departed && <div style={{ position: "absolute", right: -4, bottom: -9, fontFamily: MONO, fontSize: 9, color: "#04150C", background: C.swap, borderRadius: 3, padding: "0 4px", fontWeight: 700 }}>{e.actualOff != null ? `OFF ${fmt(e.actualOff)}` : `OUT ${fmt(e.actualOut)}`}</div>}
        {!departed && (arrD > 0 || depD > 0 || pArrX > 0 || pDepX > 0) && <div style={{ position: "absolute", right: -4, bottom: -9, fontFamily: MONO, fontSize: 9, color: "#1A1204", background: C.delay, borderRadius: 3, padding: "0 4px", fontWeight: 700 }}>{arrD + depD > 0 && (e.aog ? `ETR+${depD}` : `D+${arrD + depD}`)}{(e.depDelayCode || e.arrDelayCode) && arrD + depD > 0 && `·${e.depDelayCode || e.arrDelayCode}`}{pArrX + pDepX > 0 && `${arrD + depD > 0 ? " " : ""}P+${pArrX + pDepX}·93`}</div>}
        {optyEvt.has(e.id) && <div style={{ position: "absolute", left: -4, bottom: -9, fontFamily: MONO, fontSize: 9, color: "#04150F", background: C.thru, borderRadius: 3, padding: "0 4px", fontWeight: 700 }}>⚒OPTY</div>}
        {(tC || gC) && <div style={{ position: "absolute", right: -4, top: -9, fontFamily: MONO, fontSize: 9, color: "#FFF", background: tC ? C.aog : C.delay, borderRadius: 3, padding: "0 4px", fontWeight: 700 }}>⚠{tC ? "TAIL" : "GATE"}</div>}
        {e.star && e.dep != null && (() => {
          const risk = e.starState === "fail" || e.starState === "risk" || (P.pDep > 0);
          const sc = e.starState === "fail" ? C.aog : (e.starState === "risk" || P.pDep > 0) ? C.delay : C.star;
          return (
            <div style={{ position: "absolute", right: tC || gC ? 42 : -7, top: -8, display: "flex", alignItems: "center", gap: 2 }} title={risk ? "STAR DEPARTURE AT RISK" : "STAR DEPARTURE"}>
              {(e.starState === "fail" || e.starState === "risk") && <span style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 800, color: sc, background: `${sc}22`, border: `1px solid ${sc}`, borderRadius: 3, padding: "0 3px" }}>{e.starState === "fail" ? "STAR✗" : "STAR?"}</span>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill={sc} style={risk ? { filter: `drop-shadow(0 0 4px ${sc})` } : undefined}><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8z"/></svg>
            </div>
          );
        })()}
      </div>
    );
  };

  const faColor = fa.state === "live" ? C.swap : fa.state === "stale" ? C.star : C.mut;

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.text }}>
      <style>{`
        @keyframes aogPulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes blinkDot { 0%,49%{opacity:1} 50%,100%{opacity:.12} }
        @media (prefers-reduced-motion: reduce){ *{animation:none!important} }
      `}</style>

      {/* header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 24px" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.02em" }}>📅 Ground Ops <span style={{ color: C.turn }}>Gantt</span></div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>AERODYNE FLEET OS · {fmtDate(BASE)} 05:00 → {fmtDate(dateFor(WINDOW_MIN))} 05:00 · 72H {nowMin != null && `· NOW ${fmt(nowMin)}`}</div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {ZONES.map(([label, tz]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 8.5, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO }}>{label}</span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: label === "UTC" ? C.star : C.text }}>{zoneTime(clock, tz)}{label === "UTC" && "Z"}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginLeft: "auto", alignItems: "center" }}>
            <span onClick={() => onNavigate && onNavigate("admin-settings")} title="FlightAware AeroAPI feed status — click to manage the connector"
              style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: faColor, border: `1px solid ${faColor}55`, background: `${faColor}14`, borderRadius: 999, padding: "4px 11px", cursor: "pointer" }}>📡 {fa.label}</span>
            {focus ? (
              <>
                <Stat label="AOG" value={stats.aog} color={C.aog} />
                <Stat label="dep alert" value={depAlert} color={depAlert ? C.aog : undefined} />
                <Stat label="star risk" value={starRisk} color={starRisk ? C.aog : undefined} />
                <span style={{ fontSize: 10, color: C.dim, fontFamily: MONO }}>ZOOM</span>
                <input type="range" min="0.2" max="2.4" step="0.05" value={pxMin} onChange={(e) => setPxMin(Number(e.target.value))} style={{ accentColor: C.turn, width: 110, cursor: "pointer" }} />
                <button onClick={() => setFocus(false)} title="Show filters, stats & legend"
                  style={{ padding: "5px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: MONO, background: `${C.star}18`, border: `1px solid ${C.star}`, color: C.star, cursor: "pointer" }}>⛶ EXIT FOCUS</button>
              </>
            ) : (
              <>
                <Stat label="tails" value={stats.tails} />
                <Stat label="AOG" value={stats.aog} color={C.aog} />
                <Stat label="RON" value={stats.ron} color={C.ron} />
                <Stat label="delays" value={stats.dly} color={C.delay} />
                <Stat label="conflicts" value={stats.conf} color={stats.conf ? C.aog : undefined} />
                <Stat label="dep alert" value={depAlert} color={depAlert ? C.aog : undefined} />
                <Stat label="mx opty" value={`${optys.filter((o) => o.best).length}/${optys.length}`} color={C.thru} />
                <Stat label="star risk" value={starRisk} color={starRisk ? C.aog : undefined} />
                <Stat label="over-cap stns" value={capOverloaded} color={capOverloaded ? C.aog : C.swap} />
                <Stat label={`STAR ${stats.starOk}/${stats.starTotal}`} value={stats.starRate != null ? stats.starRate + "%" : "—"} color={stats.starRate == null ? C.mut : stats.starRate >= 90 ? C.swap : stats.starRate >= 75 ? C.star : C.aog} />
                <Stat label="wkld hrs" value={stats.wl.toFixed(0)} color={C.thru} />
              </>
            )}
          </div>
        </div>
        {/* filters */}
        {!focus && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 12 }}>
          <Chip on={filter === "ALL"} color={C.turn} onClick={() => setFilter("ALL")}>ALL</Chip>
          <Chip on={filter === "AOG"} color={C.aog} onClick={() => setFilter("AOG")}>AOG</Chip>
          <Chip on={filter === "RON"} color={C.ron} onClick={() => setFilter("RON")}>RON</Chip>
          <Chip on={filter === "STAR"} color={C.star} onClick={() => setFilter("STAR")}>STAR</Chip>
          <Chip on={filter === "DLY"} color={C.delay} onClick={() => setFilter("DLY")}>DLY/RISK</Chip>
          <Chip on={filter === "CONF"} color={C.aog} onClick={() => setFilter("CONF")}>CONF</Chip>
          <span style={{ width: 1, height: 18, background: C.line }} />
          <Chip on={showCap} color={C.swap} onClick={() => setShowCap((v) => !v)}>👥 MANPOWER</Chip>
          <span style={{ width: 1, height: 18, background: C.line }} />
          <div style={{ position: "relative" }}>
            <button onClick={() => setStnOpen((o) => !o)} style={{ padding: "5px 11px", borderRadius: 6, fontFamily: MONO, fontSize: 10.5, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: stnSel.size ? `${C.turn}18` : "transparent", border: `1px solid ${stnSel.size ? C.turn : C.line}`, color: stnSel.size ? C.turn : C.mut }}>
              STN: {stnSel.size === 0 ? "ALL" : [...stnSel].slice(0, 3).join("·") + (stnSel.size > 3 ? ` +${stnSel.size - 3}` : "")}
              <span style={{ fontSize: 8 }}>{stnOpen ? "▲" : "▼"}</span>
            </button>
            {stnOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setStnOpen(false)} />
                <div style={{ position: "absolute", zIndex: 40, marginTop: 4, borderRadius: 8, padding: "4px 0", overflow: "hidden", minWidth: 190, maxHeight: 340, overflowY: "auto", background: C.panel2, border: `1px solid ${C.line}`, boxShadow: "0 8px 24px #0008" }}>
                  <button onClick={() => setStnSel(new Set())} style={{ width: "100%", textAlign: "left", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11, background: "transparent", border: "none", color: stnSel.size === 0 ? C.turn : C.text, cursor: "pointer" }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${stnSel.size === 0 ? C.turn : C.line}`, fontSize: 9 }}>{stnSel.size === 0 ? "✓" : ""}</span>ALL STATIONS
                  </button>
                  <div style={{ height: 1, background: C.lineSoft }} />
                  {stations.map((s) => {
                    const on = stnSel.has(s);
                    const n = fleet.reduce((k, a) => k + a.events.filter((e) => e.stn === s).length, 0);
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center" }}>
                        <button onClick={() => toggleStn(s)} style={{ flex: 1, textAlign: "left", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11, background: on ? `${C.turn}12` : "transparent", border: "none", color: on ? C.turn : C.text, cursor: "pointer" }}>
                          <span style={{ width: 14, height: 14, borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${on ? C.turn : C.line}`, background: on ? `${C.turn}22` : "transparent", fontSize: 9 }}>{on ? "✓" : ""}</span>
                          {s}<span style={{ marginLeft: "auto", color: C.dim, fontSize: 9 }}>{n}</span>
                        </button>
                        <button onClick={() => { openStation(s); setStnOpen(false); }} title={`Open ${s} on World Stations`} style={{ background: "transparent", border: "none", color: C.mut, cursor: "pointer", fontSize: 11, padding: "0 10px" }}>🌐</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
            <Chip on={cascade} color={C.delay} onClick={() => setCascade((c) => !c)}>CASCADE</Chip>
            <button onClick={() => setShowOpty(true)} style={{ padding: "5px 11px", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: MONO, background: `${C.thru}18`, border: `1px solid ${C.thru}`, color: C.thru, cursor: "pointer" }}>⚒ MX OPTY {optys.length > 0 && `(${optys.filter((o) => o.best).length}/${optys.length})`}</button>
            <button onClick={() => setShowHandover(true)} style={{ padding: "5px 11px", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: MONO, background: `${C.ron}18`, border: `1px solid ${C.ron}`, color: C.ron, cursor: "pointer" }}>⇪ HANDOVER</button>
            <span style={{ fontSize: 10, color: C.dim, fontFamily: MONO }}>ZOOM</span>
            <input type="range" min="0.2" max="2.4" step="0.05" value={pxMin} onChange={(e) => setPxMin(Number(e.target.value))}
              title={`${pxMin.toFixed(2)} px/min`}
              style={{ accentColor: C.turn, width: 110, cursor: "pointer" }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.mut, width: 46 }}>{pxMin.toFixed(2)} px/m</span>
            {[[0.35, "3D"], [0.7, "72H"], [1.15, "24H"], [1.7, "DTL"]].map(([z, l]) => <Chip key={z} on={Math.abs(pxMin - z) < 0.03} color={C.mut} onClick={() => setPxMin(z)}>{l}</Chip>)}
            <button onClick={() => setShowAdd(true)} style={{ marginLeft: 4, padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: MONO, background: C.turn, color: "#06121F", border: "none", cursor: "pointer" }}>+ FLIGHT</button>
            <button onClick={() => setFocus(true)} title="Hide filters, stats & legend for a clean board" style={{ padding: "6px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: MONO, background: "transparent", border: `1px solid ${C.star}`, color: C.star, cursor: "pointer" }}>⛶ FOCUS</button>
          </div>
        </div>
        )}
      </div>

      {/* legend */}
      {!focus && (
      <div style={{ padding: showLegend ? "8px 20px" : "5px 20px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", borderBottom: `1px solid ${C.lineSoft}` }}>
        <button onClick={() => setShowLegend((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontSize: 8 }}>{showLegend ? "▾" : "▸"}</span> LEGEND
        </button>
        {showLegend && (<>
        {[["TURN", C.turn], ["THRU", C.thru], ["RON", C.ron], ["AOG", C.aog]].map(([l, c]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.mut, fontFamily: MONO }}><span style={{ width: 11, height: 11, borderRadius: 3, background: `${c}33`, border: `1px solid ${c}` }} />{l}</span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.mut, fontFamily: MONO }}><svg width="12" height="12" viewBox="0 0 24 24" fill={C.star}><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8z"/></svg>STAR DEP</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.mut, fontFamily: MONO }}><span style={{ width: 11, height: 11, borderRadius: 3, backgroundImage: `repeating-linear-gradient(45deg, ${C.delay}55 0 2px, transparent 2px 4px)`, border: `1px dashed ${C.delay}` }} />DELAY / ETR SLIP</span>
        <span style={{ fontSize: 10, color: C.aog, fontFamily: MONO }}>⚠TAIL = double-booked tail</span>
        <span style={{ fontSize: 10, color: C.delay, fontFamily: MONO }}>⚠GATE = gate overlap</span>
        <span style={{ fontSize: 10, color: C.delay, fontFamily: MONO }}>● BLINK = ETD PASSED, NO OUT (RED 15′+)</span>
        <span style={{ fontSize: 10, color: C.swap, fontFamily: MONO }}>┃ = BLOCK IN · DIM+OUT = DEPARTED</span>
        <span style={{ fontSize: 10, color: C.dim, fontFamily: MONO }}>▁ bottom bar = MX workload</span>
        </>)}
      </div>
      )}

      {/* ── Manpower capacity lane ── committed MX hours vs available techs ── */}
      {showCap && !focus && (
        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.lineSoft}`, background: C.panel }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.mut, fontFamily: MONO, letterSpacing: "0.1em", fontWeight: 700 }}>👥 MANPOWER CAPACITY · COMMITTED MX HRS vs AVAILABLE TECH-HRS ON SHIFT</span>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9, color: C.dim }}>click a station to open Manpower →</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {capacity.map((c) => {
              const col = c.state === "over" ? C.aog : c.state === "tight" ? C.delay : C.swap;
              const pct = Math.min(c.ratio * 100, 100);
              const label = c.state === "over" ? "OVER" : c.state === "tight" ? "TIGHT" : "OK";
              return (
                <button key={c.station} onClick={() => onNavigate && onNavigate("manpower")}
                  title={`${c.station}: ${c.committed.toFixed(1)} MH committed across ${c.events} open turnarounds · ${c.techs} techs on shift (${c.avail} available, ${c.onTask} on task) · ${c.techHours.toFixed(0)} tech-hrs`}
                  style={{ flex: "1 1 150px", minWidth: 150, maxWidth: 230, textAlign: "left", background: C.bg, border: `1px solid ${col}${c.state === "over" ? "" : "55"}`, borderRadius: 9, padding: "9px 11px", cursor: "pointer", boxShadow: c.state === "over" ? `0 0 10px ${C.aog}33` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color: C.text }}>{c.station}</span>
                    <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 800, color: col, background: `${col}1a`, border: `1px solid ${col}66`, borderRadius: 999, padding: "1px 6px" }}>{label}</span>
                    {c.aogMh > 0 && <span style={{ fontFamily: MONO, fontSize: 8, color: C.aog }}>⬤ {c.aogMh.toFixed(0)}h AOG</span>}
                    <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: col }}>{isFinite(c.ratio) ? `${Math.round(c.ratio * 100)}%` : "—"}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: "hidden", marginBottom: 5 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: col, animation: c.state === "over" ? "aogPulse 2.4s ease-in-out infinite" : "none" }} />
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 8.5, color: C.mut }}>
                    {c.committed.toFixed(0)} MH work · {c.techHours.toFixed(0)} tech-hrs · {c.avail}/{c.techs} avail
                  </div>
                </button>
              );
            })}
            {capacity.length === 0 && <span style={{ fontFamily: MONO, fontSize: 10, color: C.mut }}>No open MX workload on the board.</span>}
          </div>
        </div>
      )}

      {/* timeline */}
      <div ref={scrollRef} onMouseDown={onPanDown} style={{ overflowX: "auto", cursor: "grab" }}>
        <div style={{ width: W + 150, minWidth: "100%" }}>
          {/* ruler */}
          <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 20, background: C.bg }}>
            <div style={{ width: 150, flexShrink: 0, position: "sticky", left: 0, zIndex: 10, background: C.bg, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }} />
            <div style={{ position: "relative", width: W, height: 44, borderBottom: `1px solid ${C.line}` }}>
              {Array.from({ length: WINDOW_HOURS + 1 }, (_, i) => {
                const m = i * 60; const isMid = MIDNIGHTS.includes(m); const showDate = isMid || i === 0;
                const step = pxMin < 0.5 ? 3 : pxMin < 1 ? 2 : 1;
                return (
                  <div key={i} style={{ position: "absolute", top: 0, height: "100%", left: m * pxMin }}>
                    <div style={{ width: isMid ? 2 : 1, height: "100%", background: isMid ? C.ron : C.lineSoft }} />
                    {showDate && <span style={{ position: "absolute", left: 4, top: 5, fontSize: 9, fontWeight: 700, color: isMid ? C.ron : C.star, fontFamily: MONO, whiteSpace: "nowrap", letterSpacing: "0.06em" }}>{fmtDate(dateFor(m))} · {dayTag(m)}</span>}
                    {(showDate || i % step === 0) && <span style={{ position: "absolute", left: 4, top: 24, fontSize: 9, color: isMid ? C.ron : C.dim, fontFamily: MONO, whiteSpace: "nowrap" }}>{fmt(m)}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* rows */}
          <div style={{ position: "relative" }}>
            {visible.map((ac) => {
              const g = geo[ac.tail];
              return (
                <div key={ac.tail} style={{ display: "flex", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <button onClick={() => setSel({ tail: ac.tail, id: ac.events[0].id })} style={{ width: 150, flexShrink: 0, position: "sticky", left: 0, zIndex: 10, padding: "0 12px", display: "flex", flexDirection: "column", justifyContent: "center", height: g.h, background: C.panel, borderRight: `1px solid ${C.line}`, textAlign: "left", cursor: "pointer" }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: ac.events.some((e) => e.aog) ? C.aog : C.text }}>{ac.tail}</span>
                    <span style={{ fontSize: 10, color: C.mut, fontFamily: MONO }}>{ac.type}{ac.events.some((e) => e.aog) && <span style={{ color: C.aog }}> · AOG</span>}{ac.events.some((e) => tailConf.has(e.id)) && <span style={{ color: C.aog }}> · ⚠</span>}</span>
                  </button>
                  <div style={{ position: "relative", width: W, height: g.h }}>
                    {MIDNIGHTS.map((mm) => <div key={mm} style={{ position: "absolute", top: 0, bottom: 0, left: mm * pxMin, width: NIGHT_LEN * pxMin, background: `${C.ron}0A` }} />)}
                    {ac.events.map((e) => bar(ac, e, g.laneOf[e.id] ?? 0))}
                  </div>
                </div>
              );
            })}
            {visible.length === 0 && <div style={{ padding: "30px 150px", fontFamily: MONO, fontSize: 11, color: C.mut }}>No turnarounds match this filter.</div>}

            {/* now line */}
            {nowMin != null && <div style={{ position: "absolute", top: 0, bottom: 0, zIndex: 10, pointerEvents: "none", left: 150 + nowMin * pxMin }}><div style={{ width: 2, height: "100%", background: C.swap, boxShadow: `0 0 8px ${C.swap}` }} /><span style={{ position: "absolute", top: 0, left: 3, fontFamily: MONO, fontSize: 8, color: C.swap, fontWeight: 800 }}>NOW</span></div>}
          </div>
        </div>
      </div>

      {/* detail drawer */}
      {selAc && selEvt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "flex-end", background: "#0009" }} onClick={() => setSel(null)}>
          <div style={{ height: "100%", width: 384, maxWidth: "100%", padding: 20, overflowY: "auto", background: C.panel2, borderLeft: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700 }}>{selAc.tail}</span>
              {selEvt.depRisk && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, color: C.aog, border: `1px solid ${C.aog}`, borderRadius: 4, padding: "2px 6px" }}>🚩 DEP RISK T{selEvt.depRisk.past ? "+" : "-"}{Math.abs(selEvt.depRisk.minsToDep)}m</span>}
              <button onClick={() => setSel(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.mut, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: 11, color: C.mut, marginBottom: 16, fontFamily: MONO }}>{selAc.type} · {selEvt.stn} GATE {selEvt.gate}</div>
            {[
              ["INBOUND", `${selEvt.inFlt} EX ${selEvt.from}`],
              ["OUTBOUND", selEvt.outFlt ? `${selEvt.outFlt} TO ${selEvt.to}` : "NONE — AOG"],
              ["ON BLOCKS", `${fmt(selEvt.arr)} ${dayTag(selEvt.arr)}${(selEvt.arrDelay || 0) > 0 ? ` → EST ${fmt(effArr(selEvt))}` : ""}`],
              ["OFF BLOCKS", selEvt.dep != null ? `${fmt(selEvt.dep)} ${dayTag(selEvt.dep)}${(selEvt.depDelay || 0) > 0 ? ` → EST ${fmt(effEnd(selEvt))}` : ""}` : "—"],
              ["GROUND TIME", selEvt.dep != null ? `${Math.floor((effEnd(selEvt) - effArr(selEvt)) / 60)}h ${(effEnd(selEvt) - effArr(selEvt)) % 60}m${isTight(selEvt) ? " · TIGHT" : ""}` : "OPEN"],
              ["ETR", selEvt.etr ? `${fmt(selEvt.etr)} ${dayTag(selEvt.etr)}` : "—"],
              ["OPEN DISCREP", selEvt.openDisc != null ? String(selEvt.openDisc) : "—"],
              ["MX WORKLOAD", `${wlOf(selEvt).toFixed(1)} MH`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 12 }}>
                <span style={{ color: C.dim, fontFamily: MONO, fontSize: 10 }}>{k}</span>
                <span style={{ fontFamily: MONO }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {selEvt.thru && <span style={tag(C.thru)}>THRU</span>}
              {selEvt.ron && <span style={tag(C.ron)}>RON · OVERNIGHT</span>}
              {selEvt.starState === "ontime" && <span style={tag(C.star)}>★ STAR · ON TIME</span>}
              {selEvt.starState === "risk" && <span style={tag(C.delay)}>★ STAR · AT RISK</span>}
              {selEvt.starState === "fail" && <span style={tag(C.aog)}>★ STAR · FAIL</span>}
              {selEvt.aog && <span style={tag(C.aog)}>AOG</span>}
              {selEvt.mccOwner && <span style={tag("#FF9E2C")}>👤 MCC · {selEvt.mccOwner.name}</span>}
            </div>

            {/* STAR readiness panel */}
            {selEvt.starState && (() => {
              const sc = selEvt.starState === "fail" ? C.aog : selEvt.starState === "risk" ? C.delay : C.swap;
              const label = selEvt.starState === "fail" ? "STAR FAILURE — MISSED SCHEDULED DEPARTURE" : selEvt.starState === "risk" ? "STAR AT RISK — BLOCKER OPEN" : "STAR ON TIME";
              const items = [
                ["Logbook clean · no open write-ups blocking dispatch", (selEvt.openDisc || 0) === 0],
                ["MEL / CDL compliance verified", !selEvt.maint],
                ["Not out of service (aircraft in operational custody)", !selEvt.aog],
                ["Scheduled inside STAR window 0400–0900", inStarWindow(selEvt.dep)],
                ["Departing on scheduled slot (no slip)", (selEvt.depDelay || 0) === 0],
              ];
              return (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, border: `1px solid ${sc}`, background: `${sc}0e` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={sc}><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8z"/></svg>
                    <span style={{ fontSize: 10, color: sc, fontFamily: MONO, fontWeight: 800 }}>{label}</span>
                    <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9, color: C.mut }}>STAR · Start The Aircraft Right</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: C.ice, margin: "6px 0 8px", lineHeight: 1.5 }}>
                    First-wave morning departure. IOC scores this pass/fail — {selEvt.starState === "fail" ? "this aircraft missed its scheduled STAR slot; first-wave slip cascades into downline delays, crew resequencing, and misconnects." : selEvt.starState === "risk" ? "an open blocker could cause it to miss its slot — clear it before crew reports." : "on track to depart its scheduled slot on time."}
                  </div>
                  {items.map(([txt, ok]) => (
                    <div key={txt} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0", fontSize: 11 }}>
                      <span style={{ color: ok ? C.swap : C.aog, fontFamily: MONO, fontSize: 11, width: 12 }}>{ok ? "✓" : "✗"}</span>
                      <span style={{ color: ok ? C.ice : C.text }}>{txt}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* OOOI block times */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO, marginBottom: 6 }}>
                BLOCK TIMES · OOOI{depWatch(selEvt, nowMin) && (
                  <span style={{ color: depWatch(selEvt, nowMin) === "red" ? C.aog : C.delay, marginLeft: 8, fontWeight: 700 }}>
                    ● {depWatch(selEvt, nowMin) === "red" ? "IN DELAY — NO OUT" : depWatch(selEvt, nowMin) === "amber" ? "ETD PASSED — NO OUT" : "D-10 TO PUSH"}
                  </span>
                )}
              </div>
              {[["ON · WHEELS ON", "actualOn"], ["IN · BLOCK IN", "actualIn"], ["OUT · BLOCK OUT", "actualOut"], ["OFF · WHEELS OFF", "actualOff"]].map(([lab, key]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <span style={{ color: C.dim, fontFamily: MONO, fontSize: 10, width: 104 }}>{lab}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, flex: 1, color: selEvt[key] != null ? C.swap : C.dim }}>{selEvt[key] != null ? `${fmt(selEvt[key])} ${dayTag(selEvt[key])}` : "—"}</span>
                  <button onClick={() => nowMin != null && patchEvent(selEvt.id, (e) => ({ ...e, [key]: nowMin }))} disabled={nowMin == null}
                    style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: nowMin != null ? C.swap : C.line, color: "#04150C", border: "none", fontFamily: MONO, cursor: nowMin != null ? "pointer" : "default", opacity: nowMin != null ? 1 : 0.5 }}>NOW</button>
                  {selEvt[key] != null && <button onClick={() => patchEvent(selEvt.id, (e) => ({ ...e, [key]: null }))} style={{ color: C.dim, fontSize: 12, background: "none", border: "none", cursor: "pointer" }}>✕</button>}
                </div>
              ))}
              {(() => {
                const d = [];
                if (selEvt.actualOn != null && selEvt.actualIn != null) d.push(`TAXI-IN ${selEvt.actualIn - selEvt.actualOn}′`);
                if (selEvt.actualIn != null && selEvt.actualOut != null) d.push(`ACTUAL GROUND ${Math.floor((selEvt.actualOut - selEvt.actualIn) / 60)}h ${(selEvt.actualOut - selEvt.actualIn) % 60}m`);
                if (selEvt.actualOut != null && selEvt.actualOff != null) d.push(`TAXI-OUT ${selEvt.actualOff - selEvt.actualOut}′`);
                return d.length ? <div style={{ fontSize: 10, color: C.thru, marginTop: 6, fontFamily: MONO }}>{d.join(" · ")}</div> : null;
              })()}
              <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select value={ooF} onChange={(e) => setOoF(e.target.value)} style={{ ...inp, width: 72 }}>
                  {[["ON", "actualOn"], ["IN", "actualIn"], ["OUT", "actualOut"], ["OFF", "actualOff"]].map(([l, k]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <I v={ooT} set={setOoT} type="time" />
                <select value={ooD} onChange={(e) => setOoD(e.target.value)} style={{ ...inp, width: 58 }}>{["D0", "D1", "D2", "D3"].map((d) => <option key={d}>{d}</option>)}</select>
                <button onClick={() => patchEvent(selEvt.id, (e) => ({ ...e, [ooF]: toMin(ooT, ooD) }))} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: `1px solid ${C.swap}`, color: C.swap, background: "transparent", fontFamily: MONO, cursor: "pointer" }}>SET</button>
              </div>
              <div style={{ fontSize: 9, color: C.dim, marginTop: 6, fontFamily: MONO }}>PROD: AUTO-FED BY ACARS OOOI (DOOR CLOSE + BRAKE RELEASE) / DATALINK</div>
            </div>

            {/* delay editor */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO, marginBottom: 6 }}>DELAYS (MIN) + IATA CODE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <L label="ARR DELAY"><I v={selEvt.arrDelay ?? 0} type="number" set={(v) => patchEvent(selEvt.id, (e) => ({ ...e, arrDelay: Math.max(Number(v) || 0, 0) }))} /></L>
                <L label="ARR CODE"><select value={selEvt.arrDelayCode || ""} style={inp} onChange={(ev2) => patchEvent(selEvt.id, (e) => ({ ...e, arrDelayCode: ev2.target.value || null }))}><option value="">—</option>{DELAY_CODES.map(([c, l]) => <option key={c} value={c}>{c} {l}</option>)}</select></L>
                <L label={selEvt.aog ? "ETR SLIP" : "DEP DELAY"}><I v={selEvt.depDelay ?? 0} type="number" set={(v) => patchEvent(selEvt.id, (e) => ({ ...e, depDelay: Math.max(Number(v) || 0, 0) }))} /></L>
                <L label={selEvt.aog ? "SLIP CODE" : "DEP CODE"}><select value={selEvt.depDelayCode || ""} style={inp} onChange={(ev2) => patchEvent(selEvt.id, (e) => ({ ...e, depDelayCode: ev2.target.value || null }))}><option value="">—</option>{DELAY_CODES.map(([c, l]) => <option key={c} value={c}>{c} {l}</option>)}</select></L>
              </div>
            </div>

            {/* conflicts */}
            {confPairs.filter((p) => p.a.e.id === selEvt.id || p.b.e.id === selEvt.id).map((p, i) => {
              const other = p.a.e.id === selEvt.id ? p.b : p.a;
              const col = p.kind === "TAIL" ? C.aog : C.delay;
              return (
                <div key={i} style={{ marginTop: 16, padding: 12, borderRadius: 8, border: `1px solid ${col}`, background: `${col}10` }}>
                  <div style={{ color: col, fontSize: 10, fontFamily: MONO, fontWeight: 700 }}>⚠ {p.kind === "TAIL" ? "TAIL CONFLICT — AIRCRAFT DOUBLE-BOOKED" : "GATE CONFLICT"}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Overlaps <b style={{ fontFamily: MONO }}>{other.tail}</b> {other.e.inFlt}{other.e.outFlt ? `→${other.e.outFlt}` : " (AOG)"} at {other.e.stn}·{other.e.gate}, {fmt(effArr(other.e))}–{fmt(effEnd(other.e))} {dayTag(effArr(other.e))}.{p.kind === "TAIL" ? " Verify schedule — one turnaround must move." : " Re-gate one aircraft or stagger occupancy."}</div>
                </div>
              );
            })}

            {/* workload tasks */}
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO, marginBottom: 8 }}>DOWNTIME WORKLOAD · {(selEvt.tasks || []).filter((t) => t.done).length}/{(selEvt.tasks || []).length} COMPLETE</div>
              {(selEvt.tasks || []).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <button onClick={() => toggleTask(t.id)} style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, border: `1px solid ${t.done ? C.thru : C.line}`, background: t.done ? `${C.thru}33` : "transparent", color: C.thru, fontSize: 10, cursor: "pointer" }}>{t.done ? "✓" : ""}</button>
                  <span style={{ fontSize: 12, flex: 1, color: t.done ? C.dim : C.text, textDecoration: t.done ? "line-through" : "none" }}>{t.desc}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.mut }}>{t.mh} MH</span>
                  <button onClick={() => delTask(t.id)} style={{ color: C.dim, fontSize: 12, background: "none", border: "none", cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={tDesc} onChange={(e) => setTDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Add task — e.g. Brake wear check (ATA 32)" style={{ ...inp, flex: 1 }} />
                <input value={tMh} onChange={(e) => setTMh(e.target.value)} type="number" step="0.5" min="0" style={{ ...inp, width: 58 }} />
                <button onClick={addTask} style={{ padding: "0 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: C.turn, color: "#06121F", border: "none", fontFamily: MONO, cursor: "pointer" }}>+</button>
              </div>
            </div>

            {/* messages */}
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO, marginBottom: 8 }}>MESSAGES · {(selEvt.msgs || []).length}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(selEvt.msgs || []).map((m) => (
                  <div key={m.id} style={{ padding: 8, borderRadius: 8, background: C.panel, border: `1px solid ${C.lineSoft}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9, color: C.dim }}><span style={{ color: C.turn }}>{m.user}</span><span>{fmt(m.at)} {dayTag(m.at)}</span></div>
                    <div style={{ fontSize: 12, marginTop: 3 }}>{m.text}</div>
                  </div>
                ))}
                {(selEvt.msgs || []).length === 0 && <div style={{ fontSize: 11, color: C.dim }}>No messages on this turnaround yet.</div>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={msgTxt} onChange={(e) => setMsgTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMsg()} placeholder="Message MOC / line crew" style={{ ...inp, flex: 1 }} />
                <button onClick={addMsg} style={{ padding: "0 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: C.turn, color: "#06121F", border: "none", fontFamily: MONO, cursor: "pointer" }}>SEND</button>
              </div>
            </div>

            {/* station manpower capacity for this turnaround's station */}
            {(() => {
              const cap = capacityByStation(fleet, selEvt.stn);
              const col = cap.state === "over" ? C.aog : cap.state === "tight" ? C.delay : C.swap;
              return (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, border: `1px solid ${col}55`, background: `${col}0e` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: col, fontFamily: MONO, fontWeight: 700 }}>👥 {selEvt.stn} MANPOWER</span>
                    <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, fontWeight: 800, color: col }}>{cap.state === "over" ? "OVER CAPACITY" : cap.state === "tight" ? "TIGHT" : "OK"} · {isFinite(cap.ratio) ? Math.round(cap.ratio * 100) + "%" : "—"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.ice, marginTop: 4, lineHeight: 1.5 }}>
                    {cap.committed.toFixed(0)} MH committed across {cap.events} open turnaround{cap.events === 1 ? "" : "s"} vs {cap.techHours.toFixed(0)} tech-hrs on shift ({cap.avail} available / {cap.techs} clocked in).
                    {cap.state === "over" && " Work exceeds available crew — pull techs from another shift/station or defer non-critical tasks."}
                  </div>
                </div>
              );
            })()}

            {/* cross-links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
              {selEvt._ac && <button onClick={() => onOpenAircraft && onOpenAircraft(selEvt._ac)} style={linkBtn(C.turn)}>✈ Open on Fleet Dashboard</button>}
              <button onClick={() => openStation(selEvt.stn)} style={linkBtn(C.ice)}>🌐 View {selEvt.stn} on World Stations</button>
              {(selEvt.aog || selEvt.depRisk) && <button onClick={() => onNavigate && onNavigate("mcc")} style={linkBtn(C.aog)}>🎯 Escalate to MCC Ops Hub</button>}
              {String(selEvt.id).startsWith("M-") && <button onClick={() => delManual(selEvt.id)} style={{ ...linkBtn(C.aog), textAlign: "center" }}>REMOVE TURNAROUND</button>}
            </div>
          </div>
        </div>
      )}

      {/* MX opportunity panel */}
      {showOpty && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end", background: "#0009" }} onClick={() => setShowOpty(false)}>
          <div style={{ height: "100%", width: 400, maxWidth: "92vw", padding: 20, overflowY: "auto", background: C.panel2, borderLeft: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>⚒ Opportunity MX</span>
              <button onClick={() => setShowOpty(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.mut, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: 10, color: C.dim, fontFamily: MONO, marginBottom: 14 }}>DUE ITEMS vs AVAILABLE GROUND TIME · MIN TURN {MIN_TURN}′ PROTECTED</div>
            {optys.length === 0 && <div style={{ fontSize: 12, color: C.dim }}>No open due items — everything's planned or assigned.</div>}
            {optys.map((o) => (
              <div key={o.item.id} style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: `1px solid ${o.best ? C.line : C.aog}`, background: o.best ? C.panel : `${C.aog}0C` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{o.tail}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.thru }}>{o.item.ref}</span>
                  {o.item.cat && <span style={{ fontFamily: MONO, fontSize: 9, color: C.delay }}>CAT {o.item.cat}</span>}
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>{o.item.desc} · {o.item.mh} MH{o.item.dueBy && <span style={{ color: C.delay }}> · expires {fmt(o.item.dueBy)} {dayTag(o.item.dueBy)}</span>}</div>
                {o.best ? (
                  <>
                    <div style={{ fontSize: 11, color: C.mut, marginTop: 6, fontFamily: MONO }}>BEST FIT: {o.best.e.stn}·{o.best.e.gate} · {fmt(effArr(o.best.e))}–{fmt(effEnd(o.best.e))} {dayTag(effArr(o.best.e))} · {o.best.avail} MH avail{o.fits.length > 1 && <span style={{ color: C.dim }}> (+{o.fits.length - 1} alt)</span>}</div>
                    <button onClick={() => assignOpty(o.tail, o.item.id, o.best.e.id)} style={{ marginTop: 8, padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: C.thru, color: "#04150F", border: "none", fontFamily: MONO, cursor: "pointer" }}>ASSIGN</button>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: C.aog, marginTop: 6, fontFamily: MONO, fontWeight: 700 }}>⚠ NO FIT{o.item.dueBy ? " BEFORE EXPIRY" : ""} — ESCALATE: EXTEND A TURN, RE-ROUTE, OR SCHEDULE OOS TIME</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* handover brief */}
      {showHandover && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#000B" }} onClick={() => setShowHandover(false)}>
          <div style={{ width: "100%", maxWidth: 720, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden", background: C.panel2, border: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 17, fontWeight: 800 }}>⇪ Shift Handover Brief</span>
              <button onClick={copyHandover} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: copied ? C.swap : C.turn, color: "#06121F", border: "none", fontFamily: MONO, cursor: "pointer" }}>{copied ? "✓ COPIED" : "COPY"}</button>
              <button onClick={() => setShowHandover(false)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, border: `1px solid ${C.line}`, color: C.mut, background: "transparent", fontFamily: MONO, cursor: "pointer" }}>CLOSE</button>
            </div>
            <pre style={{ padding: 18, overflow: "auto", margin: 0, fontFamily: MONO, fontSize: 11, lineHeight: 1.6, color: C.text, whiteSpace: "pre-wrap" }}>{buildHandover()}</pre>
          </div>
        </div>
      )}

      {/* add modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#000A" }} onClick={() => setShowAdd(false)}>
          <div style={{ width: "100%", maxWidth: 460, padding: 20, borderRadius: 12, background: C.panel2, border: `1px solid ${C.line}`, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.03em", marginBottom: 14 }}>ADD TURNAROUND</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
              <L label="TAIL"><I v={f.tail} set={(v) => setF({ ...f, tail: v })} ph="N123AD" /></L>
              <L label="TYPE"><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} style={inp}>{["B737-8", "B737-9", "A320N", "A321N", "E190-E2", "E195-E2", "M90"].map((t) => <option key={t}>{t}</option>)}</select></L>
              <L label="STATION (IATA)"><I v={f.stn} set={(v) => setF({ ...f, stn: v })} ph="EWR" /></L>
              <L label="GATE"><I v={f.gate} set={(v) => setF({ ...f, gate: v })} ph="C12" /></L>
              <L label="MX WORKLOAD (MH)"><I v={f.wlHrs} set={(v) => setF({ ...f, wlHrs: v })} type="number" /></L>
              <L label="INBOUND FLT"><I v={f.inFlt} set={(v) => setF({ ...f, inFlt: v })} ph="AD214" /></L>
              <L label="OUTBOUND FLT"><I v={f.outFlt} set={(v) => setF({ ...f, outFlt: v })} ph="AD215" dis={f.aog} /></L>
              <L label="INBOUND EX (IATA)"><I v={f.fromS} set={(v) => setF({ ...f, fromS: v })} ph="BOS" /></L>
              <L label="OUTBOUND TO (IATA)"><I v={f.toS} set={(v) => setF({ ...f, toS: v })} ph="MCO" dis={f.aog} /></L>
              <L label="ON BLOCKS"><div style={{ display: "flex", gap: 4 }}><I v={f.arrT} set={(v) => setF({ ...f, arrT: v })} type="time" /><select value={f.arrD} onChange={(e) => setF({ ...f, arrD: e.target.value })} style={{ ...inp, width: 58 }}>{["D0", "D1", "D2", "D3"].map((d) => <option key={d}>{d}</option>)}</select></div></L>
              <L label="OFF BLOCKS"><div style={{ display: "flex", gap: 4 }}><I v={f.depT} set={(v) => setF({ ...f, depT: v })} type="time" dis={f.aog} /><select value={f.depD} onChange={(e) => setF({ ...f, depD: e.target.value })} disabled={f.aog} style={{ ...inp, width: 58 }}>{["D0", "D1", "D2", "D3"].map((d) => <option key={d}>{d}</option>)}</select></div></L>
              <L label="ARR DELAY (MIN)"><I v={f.arrDly} set={(v) => setF({ ...f, arrDly: v })} type="number" /></L>
              <L label={f.aog ? "ETR SLIP (MIN)" : "DEP DELAY (MIN)"}><I v={f.depDly} set={(v) => setF({ ...f, depDly: v })} type="number" /></L>
              {f.aog && <L label="ETR"><div style={{ display: "flex", gap: 4 }}><I v={f.etrT} set={(v) => setF({ ...f, etrT: v })} type="time" /><select value={f.etrD} onChange={(e) => setF({ ...f, etrD: e.target.value })} style={{ ...inp, width: 58 }}>{["D0", "D1", "D2", "D3"].map((d) => <option key={d}>{d}</option>)}</select></div></L>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {[["thru", "THRU", C.thru], ["ron", "RON", C.ron], ["star", "STAR DEP", C.star], ["aog", "AOG", C.aog]].map(([k, l, c]) => <Chip key={k} on={f[k]} color={c} onClick={() => setF({ ...f, [k]: !f[k] })}>{l}</Chip>)}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button onClick={addFlight} style={{ flex: 1, padding: "9px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: C.turn, color: "#06121F", border: "none", fontFamily: MONO, cursor: "pointer" }}>ADD TO BOARD</button>
              <button onClick={() => setShowAdd(false)} style={{ padding: "9px 16px", borderRadius: 6, fontSize: 12, border: `1px solid ${C.line}`, color: C.mut, background: "transparent", fontFamily: MONO, cursor: "pointer" }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}