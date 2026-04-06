import React from "react";

const Pill = ({ label, tone = "default" }) => {
  const toneClasses = {
    default: "bg-slate-800 text-slate-200",
    good: "bg-emerald-900/60 text-emerald-100",
    warn: "bg-amber-900/60 text-amber-100",
    bad: "bg-rose-900/60 text-rose-100",
    info: "bg-sky-900/60 text-sky-100",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClasses}`}>
      {label}
    </span>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-baseline justify-between">
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
      {title}
    </h2>
    {subtitle && (
      <span className="text-[11px] text-slate-500">
        {subtitle}
      </span>
    )}
  </div>
);

const FlightStrip = ({ flight }) => {
  const riskTone =
    flight.risk === "HIGH" ? "bad" : flight.risk === "MED" ? "warn" : "good";

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-100">
            {flight.flightNumber}
          </span>
          <span className="text-[11px] text-slate-400">
            {flight.origin} → {flight.destination}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Pill label={flight.status} tone={flight.statusTone} />
          <Pill label={`${flight.depTime}Z`} tone="info" />
          <Pill label={flight.risk} tone={riskTone} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span>Tail {flight.tail}</span>
        <span>ETOPS {flight.etops || "N/A"}</span>
        <span>ALT: {flight.alternate}</span>
        <span>Fuel: {flight.fuelPlan} / {flight.fuelExtra} extra</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        {flight.flags.map((f) => (
          <Pill key={f.label} label={f.label} tone={f.tone} />
        ))}
      </div>
    </div>
  );
};

const DispatchWorkstation = () => {
  // 🔧 Replace with real hooks / data later
  const dispatcher = {
    name: "System Dispatch",
    bankLabel: "Trans‑Atlantic PM Bank",
    utcTime: "23:15Z",
  };

  const flights = [
    {
      flightNumber: "ADY 102",
      origin: "EWR",
      destination: "LHR",
      depTime: "23:45",
      status: "RELEASED",
      statusTone: "good",
      risk: "MED",
      tail: "N782AD",
      etops: "330",
      alternate: "DUB",
      fuelPlan: "74.5",
      fuelExtra: "+3.0",
      flags: [
        { label: "WX ATLANTIC", tone: "warn" },
        { label: "ETOPS CRIT", tone: "warn" },
      ],
    },
    {
      flightNumber: "ADY 204",
      origin: "EWR",
      destination: "CDG",
      depTime: "00:05",
      status: "PENDING",
      statusTone: "warn",
      risk: "HIGH",
      tail: "N789AD",
      etops: "240",
      alternate: "BRU",
      fuelPlan: "68.2",
      fuelExtra: "+1.2",
      flags: [
        { label: "CREW MCT", tone: "bad" },
        { label: "MX DEFERRAL", tone: "warn" },
      ],
    },
    {
      flightNumber: "ADY 306",
      origin: "EWR",
      destination: "SFO",
      depTime: "23:30",
      status: "RELEASED",
      statusTone: "good",
      risk: "LOW",
      tail: "N761AD",
      etops: null,
      alternate: "OAK",
      fuelPlan: "39.8",
      fuelExtra: "+2.0",
      flags: [{ label: "RNP AR", tone: "info" }],
    },
  ];

  const weatherSummary = [
    { station: "EWR", condition: "OVC008 1SM -RA", risk: "MED" },
    { station: "LHR", condition: "BKN012 5SM", risk: "LOW" },
    { station: "CDG", condition: "TSRA VC", risk: "HIGH" },
  ];

  const atcPrograms = [
    { center: "ZNY", type: "GDP", detail: "EWR departures +25 avg", risk: "MED" },
    { center: "EGTT", type: "MIT", detail: "NAT track C 10 MIT", risk: "LOW" },
  ];

  const alerts = [
    "ETOPS 330 tail N782AD downgraded to 180 after arrival – re‑plan ADY 108.",
    "CDG convective SIGMET active 22:30–01:00Z – review alternates.",
    "Crew legality risk on ADY 204 if off‑gate after 00:40Z.",
  ];

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-slate-950 px-4 py-4 text-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Aerodyne Fleet
          </div>
          <h1 className="text-xl font-semibold text-slate-50">
            Dispatch Workstation
          </h1>
          <p className="text-xs text-slate-400">
            Flight‑centric control surface for releases, risk, and route decisions.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live ops link
          </div>
          <div className="text-[11px]">
            {dispatcher.bankLabel} · {dispatcher.utcTime}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="grid gap-4 lg:grid-cols-3">
        {/* Left: Flight stack */}
        <section className="lg:col-span-2 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <SectionHeader
            title="Active flight stack"
            subtitle="Bank‑scoped flights under your control"
          />
          <div className="flex flex-col gap-2">
            {flights.map((f) => (
              <FlightStrip key={f.flightNumber} flight={f} />
            ))}
          </div>
        </section>

        {/* Right: Risk, WX, ATC */}
        <section className="lg:col-span-1 flex flex-col gap-3">
          {/* Risk panel */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <SectionHeader
              title="Risk posture"
              subtitle="Dispatch‑level risk snapshot"
            />
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-900/40 px-2 py-2">
                <div className="text-[10px] uppercase tracking-wide text-emerald-200">
                  Low
                </div>
                <div className="text-lg font-semibold text-emerald-100">7</div>
              </div>
              <div className="rounded-xl border border-amber-700/60 bg-amber-900/40 px-2 py-2">
                <div className="text-[10px] uppercase tracking-wide text-amber-200">
                  Medium
                </div>
                <div className="text-lg font-semibold text-amber-100">4</div>
              </div>
              <div className="rounded-xl border border-rose-700/60 bg-rose-900/40 px-2 py-2">
                <div className="text-[10px] uppercase tracking-wide text-rose-200">
                  High
                </div>
                <div className="text-lg font-semibold text-rose-100">2</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              High‑risk flights require explicit dispatcher attention before release or off‑gate.
            </p>
          </div>

          {/* Weather */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <SectionHeader
              title="Critical weather"
              subtitle="Departure / destination / alternates"
            />
            <div className="flex flex-col gap-2 text-[11px]">
              {weatherSummary.map((w) => (
                <div
                  key={w.station}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-100">
                      {w.station}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {w.condition}
                    </div>
                  </div>
                  <Pill
                    label={w.risk === "HIGH" ? "SIG" : w.risk}
                    tone={w.risk === "HIGH" ? "bad" : w.risk === "MED" ? "warn" : "good"}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ATC programs */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <SectionHeader
              title="ATC programs"
              subtitle="Constraints impacting this bank"
            />
            <div className="flex flex-col gap-2 text-[11px] text-slate-300">
              {atcPrograms.map((p, idx) => (
                <div
                  key={`${p.center}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-100">
                      {p.center} · {p.type}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.detail}
                    </div>
                  </div>
                  <Pill
                    label={p.risk}
                    tone={p.risk === "HIGH" ? "bad" : p.risk === "MED" ? "warn" : "good"}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom: Alerts / actions */}
        <section className="lg:col-span-3 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <SectionHeader
            title="Dispatch action queue"
            subtitle="Items requiring explicit decision or re‑plan"
          />
          <ul className="flex flex-col gap-2 text-[11px] text-slate-300">
            {alerts.map((a, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DispatchWorkstation;