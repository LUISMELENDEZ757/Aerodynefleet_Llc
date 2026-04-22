import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plane, Shield, Brain, AlertTriangle, TrendingUp, DollarSign,
  CloudLightning, Package, Clock, CheckCircle, BarChart3, Zap,
  Users, ArrowRight, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#141922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 11 },
};

const FEATURE_CARDS = [
  { title: "AI Dispatch Co-Pilot", desc: "Real-time LLM assistant for dispatch decisions", path: "/AIDispatchCopilot", icon: Brain, border: "border-violet-500/40", bg: "bg-violet-500/10", text: "text-violet-400", badge: "AI" },
  { title: "AOG Probability Forecast", desc: "Predict AOG risk 24h / 72h ahead", path: "/AOGForecast", icon: Zap, border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-400", badge: "AI" },
  { title: "One-Click Diversion", desc: "Full diversion package in seconds", path: "/DiversionWorkflow", icon: AlertTriangle, border: "border-orange-500/40", bg: "bg-orange-500/10", text: "text-orange-400", badge: "OPS" },
  { title: "SIGMET / AIRMET Monitor", desc: "Live weather hazards & route impact", path: "/SIGMETMap", icon: CloudLightning, border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400", badge: "WX" },
  { title: "FAR 117 Calculator", desc: "Crew duty, rest & fatigue risk index", path: "/FAR117", icon: Shield, border: "border-green-500/40", bg: "bg-green-500/10", text: "text-green-400", badge: "CREW" },
  { title: "OTP Analytics", desc: "On-time performance & root cause", path: "/OTPDashboard", icon: BarChart3, border: "border-primary/40", bg: "bg-primary/10", text: "text-primary", badge: "PERF" },
  { title: "Cost Per Flight", desc: "Fuel, crew, delay & maintenance cost", path: "/CostAnalytics", icon: DollarSign, border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", badge: "COST" },
  { title: "Predictive Parts Ordering", desc: "AI-driven proactive procurement", path: "/PredictiveParts", icon: Package, border: "border-cyan-500/40", bg: "bg-cyan-500/10", text: "text-cyan-400", badge: "AI" },
];

export default function AocsDashboard() {
  const today = new Date().toISOString().split("T")[0];

  const { data: flights = [] } = useQuery({ queryKey: ["aocs-flights"], queryFn: () => base44.entities.Flight.list("-flight_date", 300), refetchInterval: 60000 });
  const { data: aircraft = [] } = useQuery({ queryKey: ["aocs-aircraft"], queryFn: () => base44.entities.Aircraft.list("tail_number", 500), refetchInterval: 60000 });
  const { data: mel = [] } = useQuery({ queryKey: ["aocs-mel"], queryFn: () => base44.entities.MELItem.list("-deferred_date", 300), refetchInterval: 60000 });
  const { data: faults = [] } = useQuery({ queryKey: ["aocs-faults"], queryFn: () => base44.entities.FaultMessage.filter({ status: "active" }), refetchInterval: 60000 });

  const todayFlights = flights.filter(f => f.flight_date === today);
  const total = todayFlights.length;
  const onTime = todayFlights.filter(f => (f.delay_minutes || 0) < 15).length;
  const delayed = todayFlights.filter(f => (f.delay_minutes || 0) >= 15 && f.status !== "cancelled").length;
  const cancelled = todayFlights.filter(f => f.status === "cancelled").length;
  const otp = total > 0 ? Math.round((onTime / total) * 100) : 0;

  const activeAc = aircraft.filter(a => a.status === "active").length;
  const oosAc = aircraft.filter(a => a.status === "oos").length;
  const mxAc = aircraft.filter(a => a.status === "maintenance").length;
  const etopsReady = aircraft.filter(a => a.etops_approval && a.etops_approval >= 120).length;
  const cat3Ready = aircraft.filter(a => a.cat_approval && ["CAT IIIa", "CAT IIIb", "CAT IIIc"].includes(a.cat_approval)).length;

  const openMel = mel.filter(m => m.status === "open" || m.status === "expiring_soon");
  const expiredMel = mel.filter(m => m.status === "expired");
  const activeFaults = faults.length;

  const reasonMap = {};
  todayFlights.filter(f => (f.delay_minutes || 0) >= 15).forEach(f => {
    const r = f.delay_reason || "Other";
    const cat = r.toLowerCase().includes("weather") ? "Weather"
      : r.toLowerCase().includes("maint") || r.toLowerCase().includes("mx") ? "Maintenance"
      : r.toLowerCase().includes("crew") ? "Crew"
      : r.toLowerCase().includes("atc") ? "ATC" : "Other";
    reasonMap[cat] = (reasonMap[cat] || 0) + (f.delay_minutes || 15);
  });
  const delayData = Object.entries(reasonMap).map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes);

  const stationIssues = {};
  todayFlights.filter(f => (f.delay_minutes || 0) >= 30).forEach(f => {
    const s = f.origin || "UNK";
    stationIssues[s] = (stationIssues[s] || 0) + 1;
  });
  const hotspots = Object.entries(stationIssues).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, count]) => ({
    station: s, issue: count >= 3 ? "Multiple delays" : "Delay", risk: count >= 3 ? "High" : "Medium"
  }));

  return (
    <div className="min-h-screen bg-background pb-24 p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.2em]">Aerodyne Fleet LLC</p>
          <h1 className="text-2xl font-black text-foreground">AOCS Operations Hub</h1>
          <p className="text-xs text-muted-foreground">System-wide view · Real-time data</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live Feed
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today's OTP", value: `${otp}%`, sub: `${total} flights`, tone: otp >= 85 ? "good" : otp >= 70 ? "warn" : "bad", icon: Activity },
          { label: "Active Aircraft", value: activeAc, sub: `${oosAc} OOS / ${mxAc} MX`, tone: oosAc > 3 ? "warn" : "good", icon: Plane },
          { label: "Active Faults", value: activeFaults, sub: `${openMel.length} open MEL`, tone: activeFaults > 10 ? "bad" : activeFaults > 5 ? "warn" : "good", icon: AlertTriangle },
          { label: "Delayed Today", value: delayed, sub: `${cancelled} cancelled`, tone: delayed > 10 ? "bad" : delayed > 5 ? "warn" : "good", icon: Clock },
        ].map(({ label, value, sub, tone, icon: Icon }) => {
          const toneColor = { good: "text-green-400", warn: "text-amber-400", bad: "text-red-400" }[tone];
          const toneBg = { good: "border-green-500/20", warn: "border-amber-500/20", bad: "border-red-500/20" }[tone];
          return (
            <div key={label} className={cn("bg-card border rounded-2xl p-4", toneBg)}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{label}</p>
                <Icon className={cn("w-4 h-4", toneColor)} />
              </div>
              <p className={cn("text-3xl font-black", toneColor)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ops Summary */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Today's Operation</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total", value: total || "—", color: "text-white" },
              { label: "On Time", value: onTime, color: "text-green-400" },
              { label: "Delayed", value: delayed, color: delayed > 0 ? "text-amber-400" : "text-gray-500" },
              { label: "Cancelled", value: cancelled, color: cancelled > 0 ? "text-red-400" : "text-gray-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={cn("text-xl font-black", color)}>{value}</p>
              </div>
            ))}
          </div>
          <Link to="/OTPDashboard" className="flex items-center justify-between text-xs font-bold text-primary hover:text-primary/80">
            Full OTP Report <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Fleet Health */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Fleet Health</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Active", value: activeAc, color: "text-green-400" },
              { label: "OOS/AOG", value: oosAc, color: oosAc > 0 ? "text-red-400" : "text-gray-500" },
              { label: "ETOPS Ready", value: etopsReady, color: "text-blue-400" },
              { label: "CAT III", value: cat3Ready, color: "text-cyan-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={cn("text-xl font-black", color)}>{value}</p>
              </div>
            ))}
          </div>
          <Link to="/AOGForecast" className="flex items-center justify-between text-xs font-bold text-red-400 hover:text-red-300">
            AOG Probability Forecast <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hotspots */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Operational Hotspots</p>
          {hotspots.length > 0 ? (
            <div className="space-y-2">
              {hotspots.map(h => (
                <div key={h.station} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{h.station}</p>
                    <p className="text-[10px] text-muted-foreground">{h.issue}</p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", h.risk === "High" ? "bg-red-900/50 text-red-300" : "bg-amber-900/50 text-amber-300")}>
                    {h.risk} risk
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 rounded-xl px-3 py-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-xs font-bold text-green-400">No station hotspots detected</p>
            </div>
          )}
          {expiredMel.length > 0 && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-bold text-red-400">{expiredMel.length} expired MEL items</p>
            </div>
          )}
        </div>

        {/* Delay Drivers Chart */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Delay Drivers (Cumulative Minutes)</p>
          {delayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={delayData} layout="vertical">
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} width={90} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v} min`, "Delay"]} />
                <Bar dataKey="minutes" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-sm">No delays recorded today</p>
            </div>
          )}
        </div>

        {/* MEL / Fault Status */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">MEL & Fault Status</p>
          <div className="space-y-2">
            {[
              { label: "Open MEL Items", value: openMel.length, color: openMel.length > 10 ? "text-amber-400" : "text-white" },
              { label: "Expired MEL", value: expiredMel.length, color: expiredMel.length > 0 ? "text-red-400" : "text-gray-500" },
              { label: "Active Faults", value: activeFaults, color: activeFaults > 10 ? "text-red-400" : activeFaults > 5 ? "text-amber-400" : "text-white" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-sm font-black", color)}>{value}</p>
              </div>
            ))}
          </div>
          <Link to="/MEL" className="flex items-center justify-between text-xs font-bold text-amber-400 hover:text-amber-300">
            MEL Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Advanced Feature Cards */}
      <div>
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">Advanced Capabilities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURE_CARDS.map(({ title, desc, path, icon: Icon, border, bg, text, badge }) => (
            <Link key={path} to={path} className={cn("bg-card border rounded-2xl p-4 hover:scale-[1.02] transition-all active:scale-[0.98] group", border)}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
                  <Icon className={cn("w-5 h-5", text)} />
                </div>
                <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-widest", text, bg, border)}>
                  {badge}
                </span>
              </div>
              <p className="text-sm font-extrabold text-foreground mb-0.5">{title}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}