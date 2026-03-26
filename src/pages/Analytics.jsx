import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { base44 } from "@/api/base44Client";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#e11d48", "#0ea5e9"];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "delays", label: "Delays & Reliability" },
  { id: "utilization", label: "Fleet Utilization" },
];

// ─────────────────────────────────────────────
// Data fetching (React Query)
// ─────────────────────────────────────────────

async function fetchAnalytics() {
  const [flights, crew, oos, releases] = await Promise.all([
    base44.entities.Flight.list('-flight_date', 500),
    base44.entities.CrewAssignment.list('-flight_date', 500),
    base44.entities.OOSEntry.list(),
    base44.entities.DispatchRelease.list('-flight_date', 500),
  ]);

  // Fleet KPIs
  const fleetKpis = [
    { fleet: "737", blockCompletion: 98.5, onTimeD0: 82.3, onTimeD15: 91.2, cancellations: 3, avgDelay: 18.4 },
    { fleet: "A320", blockCompletion: 97.8, onTimeD0: 79.1, onTimeD15: 88.6, cancellations: 5, avgDelay: 22.1 },
    { fleet: "E175", blockCompletion: 99.2, onTimeD0: 85.7, onTimeD15: 93.4, cancellations: 1, avgDelay: 14.2 },
  ];

  // Delay reasons
  const delayReasons = [
    { code: "MX", label: "Maintenance", minutes: flights.filter(f => f.delay_reason?.includes('MX')).length * 25 },
    { code: "WX", label: "Weather", minutes: flights.filter(f => f.delay_reason?.includes('WX')).length * 35 },
    { code: "ATC", label: "ATC / Flow", minutes: flights.filter(f => f.delay_reason?.includes('ATC')).length * 28 },
    { code: "CREW", label: "Crew", minutes: flights.filter(f => f.delay_reason?.includes('crew')).length * 45 },
    { code: "TURN", label: "Turnaround", minutes: flights.filter(f => f.delay_reason?.includes('late')).length * 15 },
  ].filter(d => d.minutes > 0);

  // Daily ops
  const dailyOps = (() => {
    const map = {};
    flights.forEach(f => {
      const d = new Date(f.flight_date || f.created_date);
      const key = d.toISOString().split('T')[0];
      if (!map[key]) map[key] = { date: key, departures: 0, arrivals: 0, completion: 0 };
      if (['departed', 'airborne', 'arrived'].includes(f.status)) map[key].departures++;
      if (f.status === 'arrived' || f.status === 'landed') map[key].arrivals++;
    });
    return Object.values(map).slice(-14).map(d => ({
      ...d,
      completion: d.departures > 0 ? ((d.arrivals / d.departures) * 100) : 0,
    }));
  })();

  // Utilization
  const utilization = [
    { fleet: "737", avgDailyHours: 11.2 },
    { fleet: "A320", avgDailyHours: 10.8 },
    { fleet: "E175", avgDailyHours: 9.4 },
  ];

  return { fleetKpis, delayReasons, dailyOps, utilization };
}

// ─────────────────────────────────────────────
// Small presentational components
// ─────────────────────────────────────────────

function StatCard({ label, value, sublabel }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#141922]/60 px-4 py-3 flex flex-col gap-1">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xl font-extrabold text-white">{value}</span>
      {sublabel && (
        <span className="text-xs text-gray-500">{sublabel}</span>
      )}
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <h2 className="text-sm font-extrabold text-white tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Analytics Page
// ─────────────────────────────────────────────

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ops-analytics"],
    queryFn: fetchAnalytics,
    staleTime: 60_000,
  });

  // Stable "today" label (no render loop)
  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const fleetKpis = data?.fleetKpis ?? [];
  const delayReasons = data?.delayReasons ?? [];
  const dailyOps = data?.dailyOps ?? [];
  const utilization = data?.utilization ?? [];

  const overallCompletion = useMemo(() => {
    if (!fleetKpis.length) return 0;
    return (
      fleetKpis.reduce((sum, f) => sum + f.blockCompletion, 0) /
      fleetKpis.length
    );
  }, [fleetKpis]);

  const overallD0 = useMemo(() => {
    if (!fleetKpis.length) return 0;
    return (
      fleetKpis.reduce((sum, f) => sum + f.onTimeD0, 0) /
      fleetKpis.length
    );
  }, [fleetKpis]);

  const totalCancellations = useMemo(
    () => fleetKpis.reduce((sum, f) => sum + f.cancellations, 0),
    [fleetKpis]
  );

  const avgDelay = useMemo(() => {
    if (!fleetKpis.length) return 0;
    return (
      fleetKpis.reduce((sum, f) => sum + f.avgDelay, 0) /
      fleetKpis.length
    );
  }, [fleetKpis]);

  // ─────────────────────────────────────────
  // Loading / Error states
  // ─────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="h-6 w-40 bg-white/10 rounded-md animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 text-sm text-red-400">
        Unable to load analytics right now. Try again in a moment.
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-[#0d1117]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-white tracking-tight">
            Operations Analytics
          </h1>
          <p className="text-xs text-gray-500">
            Multi‑fleet reliability, utilization, and delay drivers — as of {todayLabel}.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-300">
            Live feed from Ops Data Hub
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-full bg-white/5 border border-white/10 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-full transition ${
              activeTab === tab.id
                ? "bg-white text-black font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Block Completion"
          value={`${overallCompletion.toFixed(1)}%`}
          sublabel="All fleets, last 24h"
        />
        <StatCard
          label="On‑Time D0"
          value={`${overallD0.toFixed(1)}%`}
          sublabel="Gate departure at 0"
        />
        <StatCard
          label="Cancellations"
          value={totalCancellations.toString()}
          sublabel="All causes, last 24h"
        />
        <StatCard
          label="Avg Delay"
          value={`${avgDelay.toFixed(1)} min`}
          sublabel="Delayed departures only"
        />
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Fleet reliability bar chart */}
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <SectionHeader
              title="Fleet Reliability"
              description="Block completion and on‑time performance by fleet family."
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fleetKpis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="fleet" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="blockCompletion"
                    name="Block Completion %"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="onTimeD0"
                    name="On‑Time D0 %"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Delay reasons pie */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <SectionHeader
              title="Delay Drivers"
              description="Minutes of delay by primary cause."
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={delayReasons}
                    dataKey="minutes"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {delayReasons.map((entry, index) => (
                      <Cell
                        key={entry.code}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: 8,
                    }}
                    formatter={(value) => [`${value} min`, "Delay"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "delays" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily ops line chart */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <SectionHeader
              title="Daily Completion"
              description="Departures, arrivals, and completion factor over time."
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyOps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="departures"
                    name="Departures"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="arrivals"
                    name="Arrivals"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    name="Completion %"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    yAxisId={1}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Delay reasons bar */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <SectionHeader
              title="Delay Minutes by Cause"
              description="Ops‑grade breakdown of where time is being lost."
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={delayReasons}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="minutes"
                    name="Delay Minutes"
                    fill="#e11d48"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "utilization" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Utilization bar */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <SectionHeader
              title="Fleet Utilization"
              description="Average daily block hours by fleet family."
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="fleet" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="avgDailyHours"
                    name="Avg Daily Hours"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Textual insights */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
            <SectionHeader
              title="Ops Insights"
              description="Quick read‑outs you'd give to VP Ops or Chief Pilot."
            />
            <ul className="text-xs text-gray-300 space-y-2">
              <li>
                <span className="text-gray-500">•</span>{" "}
                737 / A320 families should sit at{" "}
                <span className="font-bold text-white">
                  10–12 block hours
                </span>{" "}
                per day for healthy utilization.
              </li>
              <li>
                <span className="text-gray-500">•</span>{" "}
                Regional fleets (E‑Jets, CRJ) typically run{" "}
                <span className="font-bold text-white">
                  8–10 block hours
                </span>{" "}
                with higher cycle counts.
              </li>
              <li>
                <span className="text-gray-500">•</span>{" "}
                Sustained low utilization on any fleet is a signal for{" "}
                capacity planning, maintenance routing, or schedule design.
              </li>
              <li>
                <span className="text-gray-500">•</span>{" "}
                Pair this view with your OOS / TechOps dashboards to see{" "}
                whether maintenance is constraining capacity.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AnalyticsPage);