import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useFleet } from '@/lib/FleetContext';
import FleetSwitcher, { FleetBadge } from '@/components/fleet/FleetSwitcher';
import { ChevronLeft, Globe, Plane, Users, Wrench, Fuel, AlertTriangle, BarChart3, Shield, Radio, Clock, CheckCircle, TrendingUp, ExternalLink, Satellite, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StarlinkNetworkMap from '@/components/aocs/StarlinkNetworkMap';

const tooltipStyle = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 },
};

// ── KPI Tile ────────────────────────────────────────────────────────────────
function KpiTile({ label, value, sub, color, bg, link }) {
  const content = (
    <div className={cn('rounded-2xl border border-white/10 p-4 space-y-1 hover:brightness-110 transition-all', bg)}>
      <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
      <p className="text-xs text-white font-bold">{label}</p>
      {sub && <p className={cn('text-[10px] font-bold', color)}>{sub}</p>}
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color, link, linkLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4', color)} />
        <p className="text-sm font-extrabold text-white">{title}</p>
      </div>
      {link && (
        <Link to={link} className={cn('flex items-center gap-1 text-xs font-bold hover:opacity-80', color)}>
          {linkLabel} <ExternalLink className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview',       icon: Globe },
  { id: 'network',  label: 'Starlink Network', icon: Satellite },
];

export default function AocsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { activeFleet, activeFleetId } = useFleet();

  const { data: flights = [] } = useQuery({
    queryKey: ['aocs-flights', activeFleetId],
    queryFn: () => activeFleet
      ? base44.entities.Flight.filter({ airline: activeFleet.name })
      : base44.entities.Flight.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const { data: aircraft = [] } = useQuery({
    queryKey: ['aocs-aircraft', activeFleetId],
    queryFn: () => activeFleet
      ? base44.entities.Aircraft.filter({ airline: activeFleet.name })
      : base44.entities.Aircraft.list('tail_number', 200),
    refetchInterval: 30000,
  });
  const { data: crew = [] } = useQuery({
    queryKey: ['aocs-crew'],
    queryFn: () => base44.entities.CrewAssignment.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const { data: oosEntries = [] } = useQuery({
    queryKey: ['aocs-oos'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 100),
    refetchInterval: 30000,
  });
  const { data: melItems = [] } = useQuery({
    queryKey: ['aocs-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 100),
    refetchInterval: 30000,
  });
  const { data: faultMessages = [] } = useQuery({
    queryKey: ['aocs-faults'],
    queryFn: () => base44.entities.FaultMessage.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const { data: irops = [] } = useQuery({
    queryKey: ['aocs-irops'],
    queryFn: () => base44.entities.IROPSEvent.list('-created_date', 50),
    refetchInterval: 30000,
  });
  const { data: fuelRecords = [] } = useQuery({
    queryKey: ['aocs-fuel'],
    queryFn: () => base44.entities.FuelRecord.list('-created_date', 100),
    refetchInterval: 60000,
  });
  const { data: safetyReports = [] } = useQuery({
    queryKey: ['aocs-safety'],
    queryFn: () => base44.entities.SafetyReport.list('-created_date', 50),
    refetchInterval: 60000,
  });
  const { data: alerts = [] } = useQuery({
    queryKey: ['aocs-alerts'],
    queryFn: () => base44.entities.OpsAlert.list('-created_date', 50),
    refetchInterval: 15000,
  });
  const { data: dispatches = [] } = useQuery({
    queryKey: ['aocs-dispatch'],
    queryFn: () => base44.entities.DispatchRelease.list('-created_date', 100),
    refetchInterval: 30000,
  });

  // ── Derived metrics ─────────────────────────────────────────────────────
  const activeFlights   = flights.filter(f => f.status === 'airborne' || f.flight_phase === 'cruise').length;
  const delayedFlights  = flights.filter(f => f.status === 'delayed').length;
  const cancelledFlights= flights.filter(f => f.status === 'cancelled').length;
  const onTimeFlights   = flights.filter(f => f.status === 'on_time' || f.status === 'landed').length;
  const totalFlights    = flights.length;
  const otpPct          = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : '—';

  const activeAircraft  = aircraft.filter(a => a.status === 'active').length;
  const oosAircraft     = aircraft.filter(a => a.status === 'oos' || a.status === 'maintenance').length;
  const totalAircraft   = aircraft.length;

  const crewLegal       = crew.filter(c => c.legal_status === 'legal').length;
  const crewViolations  = crew.filter(c => c.legal_status === 'violation' || c.legal_status === 'illegal').length;

  const openOOS         = oosEntries.filter(e => e.status === 'in_work' || e.status === 'waiting_on_parts').length;
  const expiredMEL      = melItems.filter(m => m.status === 'expired').length;
  const activeFaults    = faultMessages.filter(f => f.status === 'active').length;
  const criticalFaults  = faultMessages.filter(f => f.status === 'active' && f.severity === 'warning').length;

  const activeIROPS     = irops.filter(i => i.status === 'active').length;
  const criticalIROPS   = irops.filter(i => i.status === 'active' && i.severity === 'critical').length;

  const openSafety      = safetyReports.filter(s => s.status === 'open' || s.status === 'investigating').length;
  const criticalAlerts  = alerts.filter(a => a.severity === 'critical' && !a.is_dismissed).length;

  const releasedToday   = dispatches.filter(d => d.release_status === 'released').length;

  const avgFuelVariance = fuelRecords.length > 0
    ? (fuelRecords.reduce((s, r) => s + (r.variance_percent || 0), 0) / fuelRecords.length).toFixed(1)
    : '—';

  // ── OTP chart data (last 7 days grouped) ────────────────────────────────
  const otpChartData = (() => {
    const map = {};
    flights.forEach(f => {
      const d = new Date(f.created_date);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!map[key]) map[key] = { day: key, onTime: 0, delayed: 0, cancelled: 0 };
      if (f.status === 'on_time' || f.status === 'landed') map[key].onTime++;
      else if (f.status === 'delayed') map[key].delayed++;
      else if (f.status === 'cancelled') map[key].cancelled++;
    });
    return Object.values(map).slice(-7);
  })();

  // ── Recent critical alerts ────────────────────────────────────────────────
  const recentAlerts = alerts
    .filter(a => !a.is_dismissed)
    .sort((a, b) => {
      const sev = { critical: 0, warning: 1, info: 2 };
      return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
    })
    .slice(0, 8);

  const now = new Date();
  const utcTime = now.toUTCString().slice(17, 22);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0e18] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-widest leading-none">AOCS</p>
            <p className="text-[10px] text-sky-400 tracking-widest uppercase font-bold">Airline Operations Control System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FleetSwitcher expanded={false} />
          {criticalAlerts > 0 && (
            <div className="flex items-center gap-2 bg-red-600/30 border border-red-500/50 rounded-xl px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-extrabold text-red-400">{criticalAlerts} CRITICAL</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 rounded-xl px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-400 font-bold">{utcTime}Z</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />
          </div>
        </div>
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-5 pt-4 border-b border-white/10 pb-0 bg-[#0a0e18]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 -mb-px',
              activeTab === id
                ? 'text-sky-400 border-sky-400 bg-sky-400/10'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── NETWORK TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'network' && (
        <div className="flex-1" style={{ minHeight: 'calc(100vh - 130px)' }}>
          <StarlinkNetworkMap />
        </div>
      )}

      {activeTab === 'overview' && <>

      {/* ── MASTER KPI GRID ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-5 pt-5">
        <KpiTile label="Active Flights"   value={activeFlights}   sub={`${delayedFlights} delayed`}          color={delayedFlights > 0 ? 'text-amber-400' : 'text-sky-400'}    bg="bg-sky-600/15"    link="/Dashboard" />
        <KpiTile label="OTP Rate"         value={`${otpPct}%`}    sub={`${totalFlights} total`}              color={otpPct < 80 ? 'text-red-400' : 'text-green-400'}             bg="bg-green-600/15"  link="/Analytics" />
        <KpiTile label="Fleet Active"     value={`${activeAircraft}/${totalAircraft}`} sub={`${oosAircraft} OOS`} color={oosAircraft > 0 ? 'text-red-400' : 'text-green-400'}   bg="bg-orange-600/15" link="/FleetDashboard" />
        <KpiTile label="Crew Issues"      value={crewViolations}  sub="FAR 117 flags"                        color={crewViolations > 0 ? 'text-red-400' : 'text-green-400'}     bg="bg-purple-600/15" link="/CrewControl" />
        <KpiTile label="Active IROPS"     value={activeIROPS}     sub={criticalIROPS > 0 ? `${criticalIROPS} CRITICAL` : 'events'} color={criticalIROPS > 0 ? 'text-red-400' : activeIROPS > 0 ? 'text-amber-400' : 'text-green-400'} bg="bg-red-600/15" link="/IROPS" />
        <KpiTile label="Open MX / MEL"    value={openOOS + expiredMEL} sub={`${expiredMEL} expired MEL`}     color={expiredMEL > 0 ? 'text-red-400' : 'text-orange-400'}         bg="bg-amber-600/15"  link="/MaintenanceControl" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-5 pt-3">
        <KpiTile label="Active Faults"    value={activeFaults}    sub={criticalFaults > 0 ? `${criticalFaults} WARNING` : 'fleet-wide'} color={criticalFaults > 0 ? 'text-red-400' : 'text-amber-400'} bg="bg-red-600/15" link="/TechOpsLogbook" />
        <KpiTile label="Dispatches"       value={releasedToday}   sub="released"                             color="text-blue-400"                                               bg="bg-blue-600/15"   link="/Dispatch" />
        <KpiTile label="Safety Reports"   value={openSafety}      sub="open / investigating"                 color={openSafety > 0 ? 'text-amber-400' : 'text-green-400'}       bg="bg-yellow-600/15" link="/SafetyQA" />
        <KpiTile label="Fuel Variance"    value={`${avgFuelVariance}%`} sub="avg burn variance"             color={parseFloat(avgFuelVariance) > 5 ? 'text-amber-400' : 'text-green-400'} bg="bg-teal-600/15" link="/Fuel" />
        <KpiTile label="Unread Alerts"    value={alerts.filter(a => !a.is_read && !a.is_dismissed).length} sub="system-wide" color="text-sky-400" bg="bg-sky-600/15" />
        <KpiTile label="Cancelled"        value={cancelledFlights} sub="today"                              color={cancelledFlights > 0 ? 'text-red-400' : 'text-green-400'}    bg="bg-gray-600/15"  link="/Dashboard" />
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 px-5 mt-6">

        {/* Left col: OTP chart + IROPS + Maintenance */}
        <div className="lg:col-span-2 space-y-5">

          {/* OTP Trend chart */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
            <SectionHeader icon={TrendingUp} title="On-Time Performance — Recent Flights" color="text-green-400" link="/Analytics" linkLabel="Analytics" />
            {otpChartData.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No flight data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={otpChartData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="onTime"    fill="#22c55e" radius={[0,0,0,0]} name="On Time" stackId="a" />
                  <Bar dataKey="delayed"   fill="#f59e0b" name="Delayed"    stackId="a" />
                  <Bar dataKey="cancelled" fill="#ef4444" radius={[4,4,0,0]} name="Cancelled" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Active IROPS */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <SectionHeader icon={AlertTriangle} title="Active IROPS Events" color="text-red-400" link="/IROPS" linkLabel="IROPS Center" />
            </div>
            {irops.filter(i => i.status === 'active').length === 0 ? (
              <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <p className="text-green-400 font-bold text-sm">No active IROPS events</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {irops.filter(i => i.status === 'active').slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-start gap-3 px-5 py-3">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      event.severity === 'critical' ? 'bg-red-400' :
                      event.severity === 'major' ? 'bg-orange-400' : 'bg-amber-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{event.description}</p>
                      <div className="flex gap-2 mt-1">
                        {event.affected_station && <span className="text-[10px] text-gray-500">{event.affected_station}</span>}
                        {event.affected_flights?.length > 0 && <span className="text-[10px] text-amber-400">{event.affected_flights.length} flights affected</span>}
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0',
                      event.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      event.severity === 'major' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'
                    )}>{event.severity?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fleet + MX overview */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <SectionHeader icon={Wrench} title="Fleet & Maintenance Overview" color="text-orange-400" link="/MaintenanceControl" linkLabel="MCC" />
            </div>
            <div className="divide-y divide-white/5">
              {aircraft.slice(0, 8).map(ac => {
                const acOOS  = oosEntries.filter(e => e.tail_number === ac.tail_number && e.status !== 'released');
                const acMEL  = melItems.filter(m => m.aircraft_tail === ac.tail_number && m.status !== 'cleared');
                const acFault = faultMessages.filter(f => f.aircraft_tail === ac.tail_number && f.status === 'active');
                const healthy = acOOS.length === 0 && acMEL.length === 0 && acFault.length === 0;
                return (
                  <div key={ac.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="font-mono font-extrabold text-white w-20 flex-shrink-0">{ac.tail_number}</span>
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">{ac.aircraft_type}</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {healthy && <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> CLEAR</span>}
                      {acOOS.length > 0 && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg">{acOOS.length} OOS</span>}
                      {acMEL.length > 0 && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">{acMEL.length} MEL</span>}
                      {acFault.length > 0 && <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg">{acFault.length} FAULT</span>}
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0',
                      ac.status === 'active' ? 'text-green-400 bg-green-500/15' :
                      ac.status === 'oos' ? 'text-red-400 bg-red-500/15' : 'text-orange-400 bg-orange-500/15'
                    )}>{ac.status?.toUpperCase()}</span>
                  </div>
                );
              })}
              {aircraft.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No aircraft</p>}
            </div>
          </div>
        </div>

        {/* Right col: Alerts + Quick Links + Safety */}
        <div className="space-y-5">

          {/* Live Alerts Feed */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <SectionHeader icon={Radio} title="Live Alerts Feed" color="text-sky-400" />
            </div>
            {recentAlerts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-bold text-sm">No active alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      alert.severity === 'critical' ? 'bg-red-400' :
                      alert.severity === 'warning' ? 'bg-amber-400' : 'bg-sky-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{alert.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
                      {alert.flight_number && <p className="text-[10px] text-sky-400 mt-0.5">FLT {alert.flight_number}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <SectionHeader icon={Shield} title="Safety Reports" color="text-yellow-400" link="/SafetyQA" linkLabel="Safety & QA" />
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { label: 'Open Reports',        value: safetyReports.filter(s => s.status === 'open').length,         color: 'text-amber-400' },
                { label: 'Investigating',        value: safetyReports.filter(s => s.status === 'investigating').length, color: 'text-blue-400' },
                { label: 'Closed / Resolved',   value: safetyReports.filter(s => s.status === 'closed').length,       color: 'text-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className={cn('text-sm font-extrabold', color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Quick Access</p>
            {[
              { label: 'Dispatch Workstation', path: '/Dispatch',           color: 'bg-blue-600' },
              { label: 'OPS Center',           path: '/OpsCenter',          color: 'bg-rose-600' },
              { label: 'Maintenance Control',  path: '/MaintenanceControl', color: 'bg-orange-600' },
              { label: 'Crew Control',         path: '/CrewControl',        color: 'bg-purple-600' },
              { label: 'Fuel Management',      path: '/Fuel',               color: 'bg-amber-600' },
              { label: 'Supervisor Dash',      path: '/Supervisor',         color: 'bg-slate-600' },
              { label: 'Safety & QA',          path: '/SafetyQA',           color: 'bg-yellow-700' },
              { label: 'Analytics',            path: '/Analytics',          color: 'bg-lime-700' },
            ].map(({ label, path, color }) => (
              <Link key={path} to={path}
                className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl text-white text-xs font-bold hover:brightness-110 transition-all', color)}>
                {label} <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      </>}
    </div>
  );
}