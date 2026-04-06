import React from "react";

const StatCard = ({ label, value, sublabel, tone = "default" }) => {
  const toneClasses = {
    default: "bg-slate-800 border-slate-700",
    good: "bg-emerald-900/40 border-emerald-700/60",
    warn: "bg-amber-900/40 border-amber-700/60",
    bad: "bg-rose-900/40 border-rose-700/60",
  }[tone];

  return (
    <div className={`flex flex-col gap-1 rounded-xl border px-4 py-3 ${toneClasses}`}>
      <div className="text-xs font-medium text-slate-300 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-50">{value}</div>
      {sublabel && (
        <div className="text-xs text-slate-400">
          {sublabel}
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-baseline justify-between">
    <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
      {title}
    </h2>
    {subtitle && (
      <span className="text-xs text-slate-400">
        {subtitle}
      </span>
    )}
  </div>
);

const AocsDashboard = () => {
  // 🔧 Replace these with real data hooks later
  const opsSummary = {
    totalFlights: 128,
    onTime: 112,
    delayed: 13,
    cancelled: 3,
  };

  const fleetHealth = {
    active: 46,
    oos: 3,
    etopsReady: 18,
    cat3Ready: 22,
  };

  const delayDrivers = [
    { label: "Weather", minutes: 184 },
    { label: "Maintenance", minutes: 96 },
    { label: "Crew", minutes: 72 },
    { label: "ATC", minutes: 51 },
  ];

  const hotspots = [
    { station: "EWR", issue: "Deicing program", risk: "Medium" },
    { station: "ORD", issue: "Gate congestion", risk: "High" },
    { station: "IAH", issue: "Crew connections", risk: "Medium" },
  ];

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-slate-950 px-4 py-4 text-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Aerodyne Fleet
          </div>
          <h1 className="text-xl font-semibold text-slate-50">
            AOCS Operations Hub
          </h1>
          <p className="text-xs text-slate-400">
            System‑wide view of today's operation, fleet health, and risk.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live feed
        </div>
      </header>

      {/* Main grid */}
      <main className="grid gap-4 md:grid-cols-3">
        {/* Column 1: Ops summary */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:col-span-1">
          <SectionHeader
            title="Today's operation"
            subtitle="System‑wide movement"
          />
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total flights"
              value={opsSummary.totalFlights}
              sublabel="All fleets / all stations"
            />
            <StatCard
              label="On‑time"
              value={`${opsSummary.onTime} (${Math.round(
                (opsSummary.onTime / opsSummary.totalFlights) * 100
              )}% )`}
              tone="good"
              sublabel="D0 / A14 performance"
            />
            <StatCard
              label="Delayed"
              value={opsSummary.delayed}
              tone="warn"
              sublabel="15+ minutes"
            />
            <StatCard
              label="Cancelled"
              value={opsSummary.cancelled}
              tone="bad"
              sublabel="System‑wide"
            />
          </div>
        </section>

        {/* Column 2: Fleet health */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:col-span-1">
          <SectionHeader
            title="Fleet health"
            subtitle="Airworthiness & capability"
          />
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Active aircraft"
              value={fleetHealth.active}
              sublabel="Released for service"
            />
            <StatCard
              label="OOS / AOG"
              value={fleetHealth.oos}
              tone="bad"
              sublabel="Out of service"
            />
            <StatCard
              label="ETOPS ready"
              value={fleetHealth.etopsReady}
              tone="good"
              sublabel="Meets current ETOPS program"
            />
            <StatCard
              label="CAT III capable"
              value={fleetHealth.cat3Ready}
              tone="good"
              sublabel="Approved & available"
            />
          </div>
        </section>

        {/* Column 3: Hotspots */}
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:col-span-1">
          <SectionHeader
            title="Operational hotspots"
            subtitle="Stations needing attention"
          />
          <div className="flex flex-col gap-2">
            {hotspots.map((h) => (
              <div
                key={h.station}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">
                    {h.station}
                  </div>
                  <div className="text-xs text-slate-400">{h.issue}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    h.risk === "High"
                      ? "bg-rose-900/60 text-rose-200"
                      : "bg-amber-900/60 text-amber-200"
                  }`}
                >
                  {h.risk} risk
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom: Delay drivers */}
        <section className="md:col-span-2 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <SectionHeader
            title="Delay drivers today"
            subtitle="Cumulative minutes by root cause"
          />
          <div className="flex flex-col gap-2">
            {delayDrivers.map((d) => {
              const totalMinutes = delayDrivers.reduce((sum, dd) => sum + dd.minutes, 0);
              const percent = Math.round((d.minutes / totalMinutes) * 100);
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-300">{d.label}</span>
                      <span className="text-xs text-slate-500">{d.minutes} min ({percent}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-slate-400"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AocsDashboard;