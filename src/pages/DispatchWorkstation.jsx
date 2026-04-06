import React, { useState } from "react";
import { X } from "lucide-react";

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {flight.flightNumber} — {flight.origin} → {flight.destination}
            </h2>
            <p className="text-xs text-slate-400">
              Tail {flight.tail} · ETOPS {flight.etops || "N/A"} · Dep {flight.depTime}Z
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Route */}
        <div className="mb-4">
          <SectionHeader title="Route" />
          <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
            {flight.route}
          </div>
        </div>

        {/* NOTAMs */}
        <div className="mb-4">
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
        <div className="mb-4">
          <SectionHeader title="Weather" />
          <div className="mt-2 flex flex-col gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              DEP: {flight.wx.dep}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              ARR: {flight.wx.arr}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              ALT: {flight.wx.alt}
            </div>
          </div>
        </div>

        {/* Fuel Breakdown */}
        <div className="mb-4">
          <SectionHeader title="Fuel Breakdown" />
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
            {Object.entries(flight.fuelBreakdown).map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
              >
                <div className="text-[10px] uppercase text-slate-500">{k}</div>
                <div className="text-sm text-slate-100">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MEL / CDL Impact */}
        <div className="mb-4">
          <SectionHeader title="MEL / CDL Impact" />
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

        {/* ETOPS Impact */}
        <div className="mb-4">
          <SectionHeader title="ETOPS Impact" />
          <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
            <div className="mb-2">
              <span className="font-semibold">Current Certification:</span> {flight.etops ? `ETOPS-${flight.etops}` : "Non-ETOPS"}
            </div>
            <div>
              <span className="font-semibold">Route Compliant:</span> Yes — alternates confirmed within ETOPS envelope.
            </div>
          </div>
        </div>

        {/* Release Actions */}
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
      route: "MERIT HFD PUT EBONY N47A 52N50W 53N40W 54N30W MALOT UL9 KONAN UL607 LAM",
      notams: ["LHR RWY 27L CLSD 23:00–05:00Z", "DUB ILS CAT II U/S"],
      wx: {
        dep: "OVC008 1SM -RA",
        arr: "BKN012 5SM",
        alt: "SHRA 8SM",
      },
      fuelBreakdown: {
        Taxi: "0.8",
        Trip: "68.0",
        Contingency: "3.4",
        Alternate: "1.2",
        FinalReserve: "2.0",
      },
      mel: ["27‑51‑01 FLAP SYS — CAT III RESTR", "34‑21‑02 IRS #2 DEGRADED"],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-slate-950 px-4 py-4 text-slate-50">
      <header>
        <h1 className="text-xl font-semibold">Dispatch Workstation</h1>
      </header>

      <div className="flex flex-col gap-2">
        {flights.map((f) => (
          <FlightStrip key={f.flightNumber} flight={f} onSelect={setSelectedFlight} />
        ))}
      </div>

      <DetailDrawer flight={selectedFlight} onClose={() => setSelectedFlight(null)} />
    </div>
  );
};

export default DispatchWorkstation;