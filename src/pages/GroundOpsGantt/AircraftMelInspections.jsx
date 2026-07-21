// Restrictive MELs + daily/repetitive inspections for the Gantt detail drawer — live from the system DB.
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { C, MONO } from "./ganttUtils";

export default function AircraftMelInspections({ tail }) {
  const { data: mels = [] } = useQuery({
    queryKey: ["gantt-mel", tail],
    queryFn: () => base44.entities.MELItem.filter({ aircraft_tail: tail }),
    enabled: !!tail,
  });
  const { data: inspections = [] } = useQuery({
    queryKey: ["gantt-insp", tail],
    queryFn: () => base44.entities.ScheduledInspection.filter({ aircraft_tail: tail }),
    enabled: !!tail,
  });

  const openMels = mels.filter((m) => m.status !== "cleared");
  const restrictive = openMels.filter((m) =>
    m.flight_restrictions || m.placard_required || m.etops_critical ||
    (m.etops_impact && m.etops_impact !== "OK")
  );
  const openInsp = inspections.filter((i) => ["scheduled", "in_progress", "overdue"].includes(i.status));

  return (
    <>
      {/* Restrictive MELs */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO, marginBottom: 6 }}>
          RESTRICTIVE MEL · {restrictive.length} OF {openMels.length} OPEN
        </div>
        {restrictive.length === 0 ? (
          <div style={{ fontSize: 11, color: C.dim }}>{openMels.length === 0 ? "No open MEL items on this tail." : "Open MELs carry no operational restrictions."}</div>
        ) : restrictive.map((m) => (
          <div key={m.id} style={{ marginBottom: 8, padding: 10, borderRadius: 8, border: `1px solid ${C.aog}55`, background: `${C.aog}0e` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, color: C.aog, background: `${C.aog}22`, border: `1px solid ${C.aog}66`, borderRadius: 3, padding: "1px 5px" }}>CAT {m.category}{m.ata_chapter ? ` · ATA ${m.ata_chapter}` : ""}</span>
              {m.etops_impact === "NO_ETOPS" && <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 800, color: C.delay }}>NO ETOPS</span>}
              {m.etops_impact === "ETOPS_WITH_LIMITS" && <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 800, color: C.delay }}>ETOPS LIMITED</span>}
              {m.placard_required && <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 800, color: C.star }}>PLACARD</span>}
              {m.expiry_date && <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9, color: C.mut }}>EXP {new Date(m.expiry_date).toLocaleDateString()}</span>}
            </div>
            <div style={{ fontSize: 11.5, color: C.text, marginTop: 4 }}>{m.description}</div>
            {m.flight_restrictions && <div style={{ fontSize: 10, color: C.delay, marginTop: 3 }}>⚠ {m.flight_restrictions}</div>}
          </div>
        ))}
      </div>

      {/* Daily / repetitive inspections */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.14em", fontFamily: MONO, marginBottom: 6 }}>
          DAILY / REPETITIVE INSPECTIONS · {openInsp.length} DUE
        </div>
        {openInsp.length === 0 ? (
          <div style={{ fontSize: 11, color: C.dim }}>No inspections scheduled against this tail.</div>
        ) : openInsp.map((i) => {
          const overdue = i.status === "overdue";
          const col = overdue ? C.aog : i.status === "in_progress" ? C.thru : C.ice;
          return (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: col, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: C.text, flex: 1, minWidth: 0 }}>
                {i.title || i.inspection_type?.replace(/_/g, " ").toUpperCase()}
                {i.recurring && <span style={{ fontFamily: MONO, fontSize: 8, color: C.ron, marginLeft: 6 }}>REPETITIVE</span>}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: col, whiteSpace: "nowrap" }}>
                {overdue ? "OVERDUE" : i.status === "in_progress" ? "IN WORK" : i.scheduled_date ? new Date(i.scheduled_date).toLocaleDateString() : "SCHED"}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}