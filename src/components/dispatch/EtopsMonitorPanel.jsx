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

export default function EtopsMonitorPanel({ flights }) {
  const etopsFlights = flights.filter((f) => f.etops);

  if (etopsFlights.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <SectionHeader
          title="ETOPS Monitor"
          subtitle="Extended range operations"
        />
        <p className="text-xs text-slate-400">
          No ETOPS flights currently active.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <SectionHeader
        title="ETOPS Monitor"
        subtitle={`${etopsFlights.length} active`}
      />
      <div className="flex flex-col gap-3 text-[11px]">
        {etopsFlights.map((flight) => (
          <div
            key={flight.flightNumber}
            className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
          >
            {/* Flight header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-100">
                  {flight.flightNumber}
                </div>
                <div className="text-[10px] text-slate-400">
                  {flight.origin} → {flight.destination}
                </div>
              </div>
              <Pill label={`ETOPS-${flight.etops}`} tone="info" />
            </div>

            {/* Alternate airports */}
            <div className="border-t border-slate-700/50 pt-2">
              <div className="text-[10px] uppercase text-slate-500 mb-1">
                Suitable Alternates
              </div>
              <div className="flex flex-wrap gap-1">
                <Pill label={flight.alternate} tone="good" />
                {flight.etopsAlternates?.map((alt) => (
                  <Pill key={alt} label={alt} tone="good" />
                ))}
              </div>
            </div>

            {/* Drift-down constraints */}
            <div className="border-t border-slate-700/50 pt-2">
              <div className="text-[10px] uppercase text-slate-500 mb-1">
                Drift-Down Constraint
              </div>
              <div className="text-[10px] text-slate-300">
                {flight.driftDownTerrain || "Standard terrain clearance"}
              </div>
            </div>

            {/* Entry/Exit points */}
            {flight.natTrackPoints && (
              <div className="border-t border-slate-700/50 pt-2">
                <div className="text-[10px] uppercase text-slate-500 mb-1">
                  NAT Track Points
                </div>
                <div className="text-[10px] text-slate-300">
                  Entry: {flight.natTrackPoints.entry} · Exit:{" "}
                  {flight.natTrackPoints.exit}
                </div>
              </div>
            )}

            {/* Max diversion time */}
            <div className="border-t border-slate-700/50 pt-2">
              <div className="text-[10px] uppercase text-slate-500 mb-1">
                Max Diversion Time
              </div>
              <div className="text-[10px] text-slate-300">
                {flight.maxDiversionTime || `${flight.etops} minutes`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}