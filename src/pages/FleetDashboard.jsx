import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FLEET, BOARD_FILTERS, subscribeFleet, departureRisk } from "../data/fleet.js";
import { getSelectedStation, clearSelectedStation, subscribeStation, getStation } from "../data/stations.js";
import { getTimeline, subscribeTimelines, lastUpdateMs, fmtEtr } from "./RepairTimeline.jsx";
import { isServiceCleared, subscribeServiceStatus } from "../data/serviceStatus.js";
import { effectiveCat, catBadgeColor, levelMeta, subscribeCat } from "../data/cat.js";
import { getMcc, subscribeMcc } from "../data/mccControls.js";

// Reference palette (AeroMOS Fleet Board)
const C = {
  green: "#00D48A", red: "#F03252", amber: "#F5A623", blue: "#3D8EF0",
  cyan: "#00D4F5", muted: "#8296B8", ice: "#A7BAD8", white: "#EEF3FF",
  card: "#131929", border: "#1E2A42", purple: "#C084FC",
};

function useZuluClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (v) => String(v).padStart(2, "0");
  return `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} Z`;
}

function fuelColor(pct) {
  if (pct > 0.55) return C.green;
  if (pct > 0.28) return C.amber;
  return C.red;
}

// Status-driven styling
const STATUS_STYLE = {
  released: { stripe: C.green, reg: C.green, sb: C.green, label: "RELEASED" },
  oos: { stripe: C.red, reg: C.red, sb: C.red, label: "OUT OF SVC" },
  maint: { stripe: C.blue, reg: C.blue, sb: C.blue, label: "MAINT" },
};

// ── flag chip ──
function chip(label, color, opts = {}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 5, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: opts.heavy ? 800 : 700, letterSpacing: "0.06em", background: `${color}1a`, color, border: `1px solid ${color}44`, whiteSpace: "nowrap", animation: opts.anim }}>
      {opts.dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />}
      {label}
    </span>
  );
}

function FleetCard({ a, onOpen, nowMs }) {
  const ss = STATUS_STYLE[a.boardStatus] || STATUS_STYLE.released;
  const fobPct = a.fob / a.fobMax;
  const fc = fuelColor(fobPct);

  // Indicators in reference order: MX, AOG, MEL, O2, OIL, MOC
  const inds = [];
  // Wrench: red = open discrepancy with no maintenance assigned; blue = assigned/in work.
  const hasOpenWork = a.openDiscrepancies > 0 || a.boardStatus === "maint" || a.grounded;
  const tl = getTimeline(a.tail);
  const assigned = tl && !tl.returnedToService;

  // ── Staleness: an aircraft actively in a repair flow (grounded / in maintenance)
  // flashes red if unassigned, or if assigned but no timeline update for 1h+.
  // The AOG badge follows the same rule: it blinks while nobody owns the event,
  // STOPS blinking once ownership is taken, and resumes blinking each time the
  // hourly update comes due (or the update is overdue). ──
  const HOUR = 3600 * 1000;
  const inRepairFlow = a.grounded || a.boardStatus === "maint";
  const last = lastUpdateMs(a.tail); // null if no active timeline
  let stale = false;
  let staleMins = 0;
  if (inRepairFlow) {
    if (!assigned) {
      stale = true; // in a repair flow but nobody has taken ownership yet
    } else if (last && nowMs - last >= HOUR) {
      stale = true;
      staleMins = Math.floor((nowMs - last) / 60000);
    }
  }
  const aogBlink = stale ? "blink 1s step-end infinite" : undefined;
  // T-20 departure-risk: maintenance still open inside the departure window
  const depRisk = departureRisk(a, nowMs);
  // Minutes until the next hourly update is due (owned, fresh AOG events only)
  const dueInMins = assigned && last && !stale ? Math.max(0, Math.ceil((HOUR - (nowMs - last)) / 60000)) : null;

  if (hasOpenWork) {
    inds.push(chip(assigned ? "🔧 MX ASSIGNED" : "🔧 MX OPEN", assigned ? C.blue : C.red));
  }
  if (a.grounded) inds.push(chip(assigned && !stale ? "⬤ AOG · OWNED" : "⬤ AOG", C.red, { heavy: true, anim: aogBlink }));
  if (a.openMel > 0) inds.push(chip(`⚠ MEL ${a.openMel}`, C.amber));
  else inds.push(chip("MEL CLR", C.muted));
  // O₂ / OIL badges glow on-and-off while the service is outstanding; the glow
  // stops once the service entry is signed off & closed in the eLogbook.
  if (a.flags.some((f) => f.key === "O2")) {
    const cleared = isServiceCleared(a.tail, "O2");
    inds.push(chip("O₂ REQ", C.cyan, { heavy: true, anim: cleared ? undefined : "o2glow 1.6s ease-in-out infinite" }));
  }
  if (a.flags.some((f) => f.key === "OIL")) {
    const cleared = isServiceCleared(a.tail, "OIL");
    inds.push(chip("🛢 OIL SVC", "#FFD166", { heavy: true, anim: cleared ? undefined : "oilglow 2s ease-in-out infinite" }));
  }
  if (a.flags.some((f) => f.key === "MOC")) inds.push(chip("🔒 MOC CONCUR", C.purple));

  // ── MCC operational controls (placed from the MCC Ops Hub control board)
  // transfer directly onto the main fleet card ──
  const mcc = getMcc(a.tail);
  if (mcc.mccOwner) inds.push(chip("👤 MCC OWNED", "#FF9E2C", { heavy: true }));
  if (mcc.ots) inds.push(chip("⛔ OTS·MCC", C.red, { heavy: true }));
  if (mcc.locked) inds.push(chip("🔒 LOCKED", C.amber, { heavy: true }));
  if (mcc.watch) inds.push(chip("👁 WATCH", C.cyan));
  if (mcc.ferry) inds.push(chip("✈ FERRY AUTH", C.purple, { heavy: true }));

  // ETR for the card front — repair-timeline ETR first, else MCC-set ETR
  const mccEtrText = mcc.etr ? new Date(mcc.etr).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
  const etrText = assigned && tl.etr ? fmtEtr(tl.etr) : mccEtrText;
  const etrOverdue = !((assigned && tl.etr)) && mcc.etr && new Date(mcc.etr).getTime() < nowMs;

  // Gate display — AOG gate marker follows the same blink rule as the badge:
  // solid while owned & fresh, blinking while unowned or update overdue.
  let gateEl;
  if (a.gate === "AOG") gateEl = <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: C.red, animation: aogBlink }}>⬤ AOG</span>;
  else if (a.gate === "MX") gateEl = <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: C.blue }}>MX BAY</span>;
  else gateEl = <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: C.amber }}>Gate {a.gate}</span>;

  const baseBorder = stale ? C.red : `${ss.stripe}40`;

  return (
    <button onClick={() => onOpen(a)} style={{ position: "relative", textAlign: "left", background: C.card, borderRadius: 12, border: `1.5px solid ${baseBorder}`, overflow: "hidden", cursor: "pointer", transition: "transform .12s", padding: 0, animation: stale ? "staleflash 1.1s ease-in-out infinite" : "none" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
      {/* Left accent stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: stale ? C.red : ss.stripe, borderRadius: "12px 0 0 12px" }} />

      {/* T-20 departure-risk banner — maintenance running against departure time */}
      {depRisk && (
        <div style={{ background: depRisk.past ? "rgba(240,50,82,.2)" : "rgba(245,166,35,.16)", borderBottom: `1px solid ${depRisk.past ? "#7f1d3a" : "#854d0e"}`, padding: "4px 14px 4px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: depRisk.past ? "#fca5a5" : "#fcd34d", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: "0.06em", animation: "blink 1s step-end infinite" }}>
            🚩 MX vs DEP {depRisk.depTime} · {depRisk.past ? `${Math.abs(depRisk.minsToDep)}m PAST DEPARTURE` : `T-${depRisk.minsToDep}m`} — MCC NOTIFIED
          </span>
        </div>
      )}
      {/* Stale alert banner */}
      {stale && (
        <div style={{ background: "rgba(240,50,82,.16)", borderBottom: "1px solid #7f1d3a", padding: "4px 14px 4px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#fca5a5", fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, letterSpacing: "0.06em" }}>
            ⚠ {assigned ? `NO UPDATE ${staleMins >= 60 ? Math.floor(staleMins / 60) + "h " : ""}${staleMins % 60}m — UPDATE TIMELINE` : "UNASSIGNED — TAKE OWNERSHIP"}
          </span>
        </div>
      )}
      {/* Owned & current: quiet strip with countdown to the next hourly update */}
      {!stale && inRepairFlow && assigned && dueInMins !== null && (
        <div style={{ background: "rgba(0,212,138,.10)", borderBottom: "1px solid #14532d", padding: "4px 14px 4px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#6ee7b7", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: "0.06em" }}>
            ✓ OWNED · {mcc.mccOwner ? "MCC PRIORITY · " + mcc.mccOwner.name.toUpperCase() : (tl.ownerStation ? tl.ownerStation + " · " : "") + (tl.owner ? tl.owner.toUpperCase() : "MCC")} — NEXT UPDATE DUE IN {dueInMins}m
          </span>
        </div>
      )}

      {/* Head */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "13px 14px 10px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 800, color: ss.reg, lineHeight: 1 }}>{a.tail}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.08em", marginTop: 3 }}>{a.variant}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", background: `${ss.sb}1a`, color: ss.sb, border: `1px solid ${ss.sb}33` }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ss.sb, animation: a.boardStatus === "oos" ? "blink 1s step-end infinite" : a.boardStatus === "released" ? "sbpulse 2s ease-in-out infinite" : "none" }} />
            {ss.label}
          </span>
          {etrText && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color: etrOverdue ? "#fca5a5" : "#fcd34d", padding: "2px 8px", borderRadius: 5, background: etrOverdue ? "rgba(240,50,82,.12)" : "rgba(245,166,35,.1)", border: `1px solid ${etrOverdue ? "#7f1d3a" : "#854d0e"}`, whiteSpace: "nowrap" }}>⏱ ETR {etrText}{etrOverdue ? " · OVERDUE" : ""}</span>
          )}
          {(() => {
            const eff = effectiveCat(a);
            const col = catBadgeColor(eff);
            return (
              <span title={`CAT capability: ${levelMeta(eff.level).label}${eff.downgraded ? ` (downgraded from ${levelMeta(eff.baseline).label})` : ""}`} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 800, color: col, padding: "2px 8px", borderRadius: 5, background: `${col}1a`, border: `1px solid ${col}55`, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                🛬 {levelMeta(eff.level).label}{eff.downgraded ? " ▼" : ""}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Indicators + fuel */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px 7px 16px", borderBottom: `1px solid ${C.border}`, minHeight: 34, flexWrap: "wrap" }}>
        {inds.map((el, i) => <span key={i}>{el}</span>)}
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.muted, letterSpacing: "0.08em" }}>FUEL ON BOARD</div>
          <div style={{ width: 72, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${Math.round(fobPct * 100)}%`, height: "100%", background: fc, borderRadius: 3 }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, color: fc }}>{a.fuelOnBoard}</div>
        </div>
      </div>

      {/* Movement */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: "9px 14px 9px 16px", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: "0.12em", color: C.muted }}>↑ ARR</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: C.white, lineHeight: 1 }}>{a.arr.time}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.ice }}>{a.arr.port}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted }}>{a.arr.flight}</div>
        </div>
        <div style={{ padding: "9px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 600, letterSpacing: "0.12em", color: C.muted }}>↓ DEP</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: a.dep.time === "—" ? C.red : C.white, lineHeight: 1 }}>{a.dep.time}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.ice }}>{a.dep.port}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: a.grounded ? C.red : C.muted, fontWeight: a.grounded ? 700 : 400 }}>{a.dep.flight}</div>
        </div>
      </div>

      {/* Location */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px 9px 16px", borderTop: `1px solid ${C.border}` }}>
        <span style={{ color: C.muted, fontSize: 11 }}>📍</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.ice, letterSpacing: "0.04em" }}>{a.location}</span>
        {gateEl}
      </div>
    </button>
  );
}

// Topbar legend item
function Leg({ color, label, round }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.ice, letterSpacing: "0.06em" }}>
      <span style={{ width: 8, height: 8, borderRadius: round ? "50%" : 2, background: color }} />{label}
    </span>
  );
}

export default function FleetDashboard({ onOpenAircraft }) {
  const navigate = useNavigate();
  // Default: SPA-navigate straight to the aircraft's maintenance timeline,
  // carrying tail + type + base so the correct record is opened/registered.
  const openAircraft = onOpenAircraft || ((a) =>
    navigate(`/AircraftTimeline?tail=${encodeURIComponent(a.tail)}&type=${encodeURIComponent(a.variant || "")}&base=${encodeURIComponent(a.base || "")}`));
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [, forceTl] = useState(0);
  const [fleetVer, setFleetVer] = useState(0);
  const [stationVer, setStationVer] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const zulu = useZuluClock();

  useEffect(() => subscribeTimelines(() => forceTl((n) => n + 1)), []);
  useEffect(() => subscribeServiceStatus(() => forceTl((n) => n + 1)), []);
  useEffect(() => subscribeCat(() => forceTl((n) => n + 1)), []);
  useEffect(() => subscribeMcc(() => forceTl((n) => n + 1)), []);
  useEffect(() => subscribeFleet(() => setFleetVer((n) => n + 1)), []);
  useEffect(() => subscribeStation(() => setStationVer((n) => n + 1)), []);
  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 30000); return () => clearInterval(t); }, []);

  const station = getSelectedStation();
  const activeFilter = BOARD_FILTERS.find((f) => f.key === filter) || BOARD_FILTERS[0];
  const filtered = useMemo(() => FLEET.filter((a) => {
    if (station && a.base !== station) return false;   // station selection filter
    if (!activeFilter.match(a)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.tail.toLowerCase().includes(q) || a.variant.toLowerCase().includes(q) || a.base.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
    }
    return true;
  }), [filter, search, activeFilter, fleetVer, station, stationVer]);

  return (
    <div style={{ padding: "0 0 28px" }}>
      <style>{`
        @keyframes sbpulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink { 50%{opacity:.2} }
        @keyframes staleflash { 0%,100%{ border-color:#F03252; box-shadow:0 0 0 0 rgba(240,50,82,0);} 50%{ border-color:#7f1d3a; box-shadow:0 0 14px 1px rgba(240,50,82,.35);} }
        @keyframes o2glow { 0%,100%{ box-shadow:0 0 0 0 rgba(0,212,245,0);} 50%{ box-shadow:0 0 8px 2px rgba(0,212,245,.4);} }
        @keyframes oilglow { 0%,100%{ box-shadow:0 0 0 0 rgba(245,166,35,0);} 50%{ box-shadow:0 0 8px 2px rgba(245,166,35,.4);} }
      `}</style>

      {/* Legend bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 24px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        <Leg color={C.green} label="RELEASED" />
        <Leg color={C.red} label="OUT OF SVC" />
        <Leg color={C.blue} label="MAINTENANCE" />
        <span style={{ width: 1, height: 16, background: C.border }} />
        <Leg color={C.amber} label="MEL ACTIVE" round />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.cyan, letterSpacing: "0.06em" }}>O₂ REQ</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#FFD166", letterSpacing: "0.06em" }}>🛢 OIL SVC</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.red, letterSpacing: "0.06em" }}>🔧 MX OPEN</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.blue, letterSpacing: "0.06em" }}>🔧 MX ASSIGNED</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.red, fontWeight: 800, letterSpacing: "0.08em" }}>⬤ AOG</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.purple, letterSpacing: "0.06em" }}>🔒 MOC CONCUR</span>
        <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: C.white }}>{zulu}</span>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 4 }}>Show</span>
        {BOARD_FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, padding: "4px 11px", borderRadius: 20, border: `1px solid ${on ? C.amber : C.border}`, color: on ? C.amber : C.muted, background: on ? "rgba(245,166,35,.07)" : "transparent", cursor: "pointer", fontWeight: 500, letterSpacing: "0.05em", transition: "all .12s" }}>
              {f.label}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted }}>
          <span style={{ color: C.white, fontWeight: 600 }}>{filtered.length}</span> of <span style={{ color: C.white, fontWeight: 600 }}>{FLEET.length}</span> aircraft shown
        </span>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 24px 0" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tail, type, base, gate…"
          style={{ width: "100%", boxSizing: "border-box", background: "#0d1526", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", color: C.white, fontSize: 13, outline: "none", fontFamily: "'Inter',sans-serif" }} />
      </div>

      {/* Active station filter banner */}
      {station && (() => {
        const s = getStation(station);
        return (
          <div style={{ margin: "12px 24px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(61,142,240,.1)", border: "1px solid #1e4d7a", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>🌐</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#7dd3fc", fontWeight: 700 }}>STATION FILTER · {station}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{s ? `${s.name} — ${s.city}` : ""}</span>
            <button onClick={() => clearSelectedStation()} style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 999, background: "transparent", color: C.muted, border: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>Clear ✕</button>
          </div>
        );
      })()}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 12, padding: "16px 24px 0" }}>
        {filtered.slice(0, 60).map((a) => <FleetCard key={a.id} a={a} onOpen={openAircraft} nowMs={nowMs} />)}
      </div>
      {filtered.length > 60 && (
        <div style={{ textAlign: "center", padding: 22, color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
          + {filtered.length - 60} more aircraft (showing first 60 for performance)
        </div>
      )}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 50, color: C.muted, fontSize: 14 }}>No aircraft match this filter.</div>}
    </div>
  );
}