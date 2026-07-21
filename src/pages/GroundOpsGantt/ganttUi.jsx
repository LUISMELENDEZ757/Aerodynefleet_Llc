// Ground Ops Gantt — small UI primitives
import { C, MONO } from "./ganttUtils";

export const Chip = ({ on, color, children, onClick }) => (
  <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 999, fontFamily: MONO, fontSize: 10, letterSpacing: "0.04em", cursor: "pointer", background: on ? `${color}22` : "transparent", border: `1px solid ${on ? color : C.line}`, color: on ? color : C.mut }}>{children}</button>
);

export const Stat = ({ label, value, color }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
    <span style={{ fontFamily: MONO, color: color || C.text, fontSize: 22, fontWeight: 700 }}>{value}</span>
    <span style={{ color: C.dim, fontSize: 9.5, letterSpacing: "0.13em", textTransform: "uppercase" }}>{label}</span>
  </div>
);

export const inp = { width: "100%", background: "#060e1e", border: `1px solid ${C.line}`, borderRadius: 6, color: C.text, padding: "7px 9px", fontSize: 12, fontFamily: MONO, outline: "none" };

export const L = ({ label, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 9, color: C.dim, letterSpacing: "0.12em", fontFamily: MONO }}>{label}</span>
    {children}
  </label>
);

export const I = ({ v, set, ph, type = "text", dis }) => (
  <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} type={type} disabled={dis} style={{ ...inp, opacity: dis ? 0.4 : 1 }} />
);

export const tag = (color) => ({ fontFamily: MONO, fontSize: 8.5, fontWeight: 800, color, background: `${color}1a`, border: `1px solid ${color}55`, borderRadius: 999, padding: "3px 9px" });

export const linkBtn = (color) => ({ width: "100%", padding: "10px 12px", borderRadius: 8, background: `${color}14`, color, border: `1px solid ${color}55`, fontFamily: MONO, fontSize: 11, fontWeight: 800, cursor: "pointer", textAlign: "left" });