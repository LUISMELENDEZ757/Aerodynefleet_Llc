import React, { useState } from "react";
import EtopsMonitorPanel from "@/components/dispatch/EtopsMonitorPanel";

const Pill = ({ label, tone = "default" }) => {
  const toneClasses = {
    default: "bg-slate-800 text-slate-200",
    good: "bg-emerald-900/60 text-emerald-100",
    warn: "bg-amber-900/60 text-amber-100",
    bad: "bg-rose-900/60 text-rose-100",
    info: "bg-sky-900/60 text-sky-100",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClasses}`}
    >
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

const FlightStrip = ({ flight, onSelect }) => {
  const riskTone =
    flight.risk === "HIGH" ? "bad" : flight.risk === "MED" ? "warn" : "good";

  return (
    <div
      onClick={() => onSelect(flight)}
      className="cursor-pointer flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 hover:bg-slate-800/60 transition"
    >
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

const DetailDrawer = ({ flight, onClose }) => {
  if (!flight) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-slate-900 border-t border-slate-700 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {flight.flightNumber} — {flight.origin} → {flight.destination}
            </h2>
            <p className="text-xs text-slate-400">
              Tail {flight.tail} · ETOPS {flight.etops || "N/A"} · Dep{" "}
              {flight.depTime}Z
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        {/* Route */}
        <div className="mt-4">
          <SectionHeader title="Route" />
          <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
            {flight.route}
          </div>
        </div>

        {/* NOTAMs */}
        <div className="mt-4">
          <SectionHeader title="NOTAMs" />
          <div className="mt-2 flex flex-col gap-2">
            {flight.notams.map((n, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300"
              >
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* Weather */}
        <div className="mt-4">
          <SectionHeader title="Weather" />
          <div className="mt-2 flex flex-col gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              <span className="text-[10px] uppercase text-slate-500">DEP</span>
              <div>{flight.wx.dep}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              <span className="text-[10px] uppercase text-slate-500">ARR</span>
              <div>{flight.wx.arr}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              <span className="text-[10px] uppercase text-slate-500">ALT</span>
              <div>{flight.wx.alt}</div>
            </div>
          </div>
        </div>

        {/* Fuel */}
        <div className="mt-4">
          <SectionHeader title="Fuel Breakdown" />
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
            {Object.entries(flight.fuelBreakdown).map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
              >
                <div className="text-[10px] uppercase text-slate-500">
                  {k}
                </div>
                <div className="text-sm text-slate-100">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MEL / ETOPS */}
        <div className="mt-4">
          <SectionHeader title="MEL / ETOPS Impact" />
          <div className="mt-2 flex flex-col gap-2 text-xs text-slate-300">
            {flight.mel.map((m, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button className="flex-1 rounded-lg bg-sky-700 px-3 py-2 text-xs font-medium text-slate-50 hover:bg-sky-600">
            Amend Release
          </button>
          <button className="flex-1 rounded-lg bg-amber-700 px-3 py-2 text-xs font-medium text-slate-50 hover:bg-amber-600">
            Re‑Plan
          </button>
          <button className="flex-1 rounded-lg bg-rose-700 px-3 py-2 text-xs font-medium text-slate-50 hover:bg-rose-600">
            Cancel Flight
          </button>
        </div>
      </div>
    </div>
  );
};

const DispatchWorkstation = () => {
  const [selectedFlight, setSelectedFlight] = useState(null);

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
      flags: [{ label: "WX ATLANTIC", tone: "warn" }],
      route:
        "MERIT HFD PUT EBONY N47A 52N50W 53N40W 54N30W MALOT UL9 KONAN UL607 LAM",
      notams: [
        "LHR RWY 27L CLSD 23:00–05:00Z",
        "DUB ILS CAT II U/S",
        "EWR TWY K CLSD BTN K3–K5",
      ],
      wx: {
        dep: "EWR 232251Z 04008KT 1SM -RA BR OVC008 03/02 A2984",
        arr: "LHR 232250Z 21006KT 5SM BKN012 08/06 A3002",
        alt: "DUB 232250Z 19010KT 8SM SHRA SCT020 BKN040 07/05 A2996",
      },
      fuelBreakdown: {
        Taxi: "0.8",
        Trip: "68.0",
        Contingency: "3.4",
        Alternate: "1.2",
        FinalReserve: "2.0",
      },
      mel: [
        "27‑51‑01 FLAP SYS — CAT III RESTR (CAT I ONLY)",
        "34‑21‑02 IRS #2 DEGRADED — ETOPS MONITOR",
      ],
      etopsAlternates: ["SNN", "KEK"],
      natTrackPoints: { entry: "51N50W", exit: "54N30W" },
      driftDownTerrain: "Min FL200 over Greenland/Iceland",
      maxDiversionTime: "330 min",
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
      route:
        "GREKI Q818 YQG Q822 YXU Q824 YCF N49W050 N49W040 N49W030 LGL UN859 OKTET",
      notams: [
        "CDG RWY 26R TORA REDUCED",
        "BRU APCH RADAR LIMITED 23:00–01:00Z",
      ],
      wx: {
        dep: "EWR 232251Z 04008KT 1SM -RA BR OVC008 03/02 A2984",
        arr: "CDG 232250Z 20012KT 3SM TSRA BKN015CB 09/07 A2990",
        alt: "BRU 232250Z 19008KT 6SM SHRA SCT020 BKN035 08/06 A2988",
      },
      fuelBreakdown: {
        Taxi: "0.7",
        Trip: "62.5",
        Contingency: "3.1",
        Alternate: "1.0",
        FinalReserve: "1.9",
      },
      mel: [
        "23‑11‑03 APU INOP — GND PWR / AIR REQ",
        "22‑11‑01 L SLAT ACTUATOR — SPD/ALT RESTR",
      ],
      etopsAlternates: ["ORY", "CRL"],
      natTrackPoints: { entry: "49N50W", exit: "49N30W" },
      driftDownTerrain: "Min FL180 over Atlantic/Europe",
      maxDiversionTime: "240 min",
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
      route:
        "MERIT J80 MCI J24 HVE J146 FMG BDEGA3",
      notams: [
        "SFO RWY 28L/28R ILS PRM AVBL",
        "OAK RWY 30 CLOSED 06:00–09:00Z",
      ],
      wx: {
        dep: "EWR 232251Z 04008KT 1SM -RA BR OVC008 03/02 A2984",
        arr: "SFO 232250Z 28012KT 10SM FEW008 SCT020 14/10 A3010",
        alt: "OAK 232250Z 29010KT 10SM FEW010 13/09 A3008",
      },
      fuelBreakdown: {
        Taxi: "0.5",
        Trip: "35.0",
        Contingency: "1.8",
        Alternate: "1.0",
        FinalReserve: "1.5",
      },
      mel: ["No active MEL/CDL items impacting dispatch."],
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
              <FlightStrip
                key={f.flightNumber}
                flight={f}
                onSelect={setSelectedFlight}
              />
            ))}
          </div>
        </section>

        {/* Right: Risk, WX, ATC, ETOPS */}
        <section className="lg:col-span-1 flex flex-col gap-3">
          {/* ETOPS Monitor */}
          <EtopsMonitorPanel flights={flights} />

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
                    tone={
                      w.risk === "HIGH"
                        ? "bad"
                        : w.risk === "MED"
                        ? "warn"
                        : "good"
                    }
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
                    tone={
                      p.risk === "HIGH"
                        ? "bad"
                        : p.risk === "MED"
                        ? "warn"
                        : "good"
                    }
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

      <DetailDrawer
        flight={selectedFlight}
        onClose={() => setSelectedFlight(null)}
      />
    </div>
  );
};

export default DispatchWorkstation;