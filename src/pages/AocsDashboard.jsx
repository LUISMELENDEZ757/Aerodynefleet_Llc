import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useFleet } from '@/lib/FleetContext';
import FleetSwitcher from '@/components/fleet/FleetSwitcher';
import {
  ChevronLeft, Globe, Plane, Users, Wrench, Fuel, AlertTriangle,
  BarChart3, Shield, Radio, Clock, CheckCircle, TrendingUp, ExternalLink,
  Satellite, Activity, Zap, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a78bfa', '#f97316'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: Globe },
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'fleet', label: 'Fleet', icon: Activity },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
];

function StatCard({ icon: Icon, label, value, sub, color, link }) {
  const content = (
    <div className={cn('rounded-xl border border-white/10 p-4 space-y-1 hover:brightness-110 transition-all', color.includes('bg-') ? color : 'bg-card')}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn('w-4 h-4', color.includes('text-') ? color : 'text-muted-foreground')} />}
        <p className={cn('text-2xl font-extrabold font-mono', color.includes('text-') ? color : 'text-foreground')}>{value}</p>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className={cn('text-[10px] font-bold', color.includes('text-') ? color : 'text-muted-foreground')}>{sub}</p>}
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

export default function AocsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [utcTime, setUtcTime] = useState('');
  const { activeFleet, activeFleetId } = useFleet();

  useEffect(() => {
    const update = () => setUtcTime(new Date().toUTCString().slice(17, 22));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const { data: flights = [] } = useQuery({
    queryKey: ['aocs-flights', activeFleetId],
    queryFn: () => activeFleet
      ? base44.entities.Flight.filter({ airline: activeFleet.name })
      : base44.entities.Flight.list('-flight_date', 200),
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

  const { data: alerts = [] } = useQuery({
    queryKey: ['aocs-alerts'],
    queryFn: () => base44.entities.OpsAlert.list('-created_date', 50),
    refetchInterval: 15000,
  });

  const { data: irops = [] } = useQuery({
    queryKey: ['aocs-irops'],
    queryFn: () => base44.entities.IROPSEvent.list('-created_date', 50),
    refetchInterval: 30000,
  });

  // Derived metrics
  const activeFlights = flights.filter(f => ['airborne', 'departed', 'boarding'].includes(f.status)).length;
  const delayedFlights = flights.filter(f => f.status === 'delayed' || (f.delay_minutes || 0) >= 15).length;
  const onTimeFlights = flights.filter(f => ['on_time', 'landed', 'arrived'].includes(f.status) && !(f.delay_minutes || 0) >= 15).length;
  const totalFlights = flights.length;
  const otpPct = totalFlights > 0 ? Math.round((onTimeFlights / totalFlights) * 100) : 0;

  const activeAircraft = aircraft.filter(a => a.status === 'active').length;
  const oosAircraft = aircraft.filter(a => ['oos', 'maintenance'].includes(a.status)).length;

  const crewLegal = crew.filter(c => c.legal_status === 'legal' || !c.legal_status).length;
  const crewViolations = crew.filter(c => ['violation', 'illegal'].includes(c.legal_status)).length;

  const openOOS = oosEntries.filter(e => ['in_work', 'waiting_on_parts'].includes(e.status)).length;
  const expiredMEL = melItems.filter(m => m.status === 'expired').length;
  const activeFaults = melItems.filter(m => m.status === 'open').length;

  const activeIROPS = irops.filter(i => i.status === 'active').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.is_dismissed).length;

  // OTP chart data
  const otpChartData = (() => {
    const map = {};
    flights.forEach(f => {
      const d = new Date(f.flight_date || f.created_date);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!map[key]) map[key] = { day: key, onTime: 0, delayed: 0, cancelled: 0 };
      if (['on_time', 'landed', 'arrived'].includes(f.status) && !(f.delay_minutes || 0) >= 15) map[key].onTime++;
      else if (f.status === 'delayed' || (f.delay_minutes || 0) >= 15) map[key].delayed++;
      else if (f.status === 'cancelled') map[key].cancelled++;
    });
    return Object.values(map).slice(-7);
  })();

  const recentAlerts = alerts
    .filter(a => !a.is_dismissed)
    .sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] ?? 3) - ({ critical: 0, warning: 1, info: 2 }[b.severity] ?? 3))
    .slice(0, 8);

  const fleetStatusData = [
    { name: 'Active', value: activeAircraft, color: '#22c55e' },
    { name: 'OOS', value: oosAircraft, color: '#ef4444' },
    { name: 'Maintenance', value: aircraft.filter(a => a.status === 'maintenance').length, color: '#f59e0b' },
  ].filter(d => d.value > 0);

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

      {/* Tab Bar */}
      <div className="flex gap-2 px-5 pt-4 border-b border-white/10 pb-0 bg-[#0a0e18] overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all border-b-2 -mb-px whitespace-nowrap',
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="px-5 pt-5 space-y-5">
          {/* Master KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Plane} label="Active Flights" value={activeFlights} sub={`${delayedFlights} delayed`} color={delayedFlights > 0 ? 'text-amber-400 bg-amber-600/15' : 'text-sky-400 bg-sky-600/15'} link="/Dashboard" />
            <StatCard icon={TrendingUp} label="OTP Rate" value={`${otpPct}%`} sub={`${totalFlights} total`} color={otpPct >= 80 ? 'text-green-400 bg-green-600/15' : 'text-amber-400 bg-amber-600/15'} link="/Analytics" />
            <StatCard icon={Activity} label="Fleet Active" value={`${activeAircraft}/${aircraft.length}`} sub={`${oosAircraft} OOS`} color={oosAircraft > 0 ? 'text-red-400 bg-red-600/15' : 'text-green-400 bg-green-600/15'} link="/FleetDashboard" />
            <StatCard icon={Users} label="Crew Issues" value={crewViolations} sub="FAR 117 flags" color={crewViolations > 0 ? 'text-red-400 bg-red-600/15' : 'text-green-400 bg-green-600/15'} link="/CrewControl" />
            <StatCard icon={AlertTriangle} label="Active IROPS" value={activeIROPS} sub={activeIROPS > 0 ? 'events' : 'none'} color={activeIROPS > 0 ? 'text-amber-400 bg-amber-600/15' : 'text-green-400 bg-green-600/15'} link="/IROPS" />
            <StatCard icon={Wrench} label="Open MX / MEL" value={openOOS + expiredMEL} sub={`${expiredMEL} expired MEL`} color={expiredMEL > 0 ? 'text-red-400 bg-red-600/15' : 'text-orange-400 bg-amber-600/15'} link="/MaintenanceControl" />
          </div>

          {/* OTP Chart */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <p className="text-sm font-extrabold text-white">On-Time Performance Trend</p>
              </div>
              <Link to="/Analytics" className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300">
                View Analytics <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            {otpChartData.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No flight data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={otpChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="onTime" fill="#22c55e" name="On Time" stackId="a" />
                  <Bar dataKey="delayed" fill="#f59e0b" name="Delayed" stackId="a" />
                  <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Active IROPS */}
            <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-sm font-extrabold text-white">Active IROPS Events</p>
                  </div>
                  <Link to="/IROPS" className="text-xs font-bold text-red-400 hover:text-red-300">IROPS Center →</Link>
                </div>
              </div>
              {irops.filter(i => i.status === 'active').length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-bold text-sm">No active IROPS events</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
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
                          {event.affected_flights?.length > 0 && <span className="text-[10px] text-amber-400">{event.affected_flights.length} flights</span>}
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

            {/* Live Alerts */}
            <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-400" />
                  <p className="text-sm font-extrabold text-white">Live Alerts Feed</p>
                </div>
              </div>
              {recentAlerts.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-bold text-sm">No active alerts</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {recentAlerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 px-5 py-3">
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
          </div>

          {/* Fleet Status */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <p className="text-sm font-extrabold text-white">Fleet Status Overview</p>
                </div>
                <Link to="/FleetDashboard" className="text-xs font-bold text-orange-400 hover:text-orange-300">Fleet Dashboard →</Link>
              </div>
            </div>
            {aircraft.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No aircraft data</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
                {fleetStatusData.length > 0 && (
                  <div className="sm:col-span-1">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={fleetStatusData} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name">
                          {fleetStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className={cn('grid gap-2', fleetStatusData.length > 0 ? 'sm:col-span-1 lg:col-span-2' : 'sm:col-span-2 lg:col-span-3')}>
                  {aircraft.slice(0, 6).map(ac => {
                    const acOOS = oosEntries.filter(e => e.tail_number === ac.tail_number && e.status !== 'released');
                    const acMEL = melItems.filter(m => m.aircraft_tail === ac.tail_number && m.status !== 'cleared');
                    const healthy = acOOS.length === 0 && acMEL.length === 0;
                    return (
                      <div key={ac.id} className="flex items-center gap-3 bg-[#0d1117] border border-white/5 rounded-xl px-3 py-2.5">
                        <span className="font-mono font-extrabold text-white w-16 flex-shrink-0">{ac.tail_number}</span>
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0 hidden sm:block">{ac.aircraft_type}</span>
                        <div className="flex gap-1.5 flex-1">
                          {healthy && <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> CLEAR</span>}
                          {acOOS.length > 0 && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg">{acOOS.length} OOS</span>}
                          {acMEL.length > 0 && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">{acMEL.length} MEL</span>}
                        </div>
                        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0',
                          ac.status === 'active' ? 'text-green-400 bg-green-500/15' :
                          ac.status === 'oos' ? 'text-red-400 bg-red-500/15' : 'text-orange-400 bg-orange-500/15'
                        )}>{ac.status?.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flights Tab */}
      {activeTab === 'flights' && (
        <div className="px-5 pt-5">
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-400" />
                <p className="text-sm font-extrabold text-white">Today's Flights</p>
              </div>
              <p className="text-xs text-gray-500">{flights.length} total</p>
            </div>
            {flights.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No flights scheduled</p>
            ) : (
              <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                {flights.map(flight => (
                  <div key={flight.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
                        <Plane className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white font-mono">{flight.flight_number}</p>
                        <p className="text-xs text-gray-400">{flight.origin} → {flight.destination}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-mono text-gray-400">{flight.scheduled_departure || '—'}</p>
                        <p className="text-[10px] text-gray-500">STD</p>
                      </div>
                      <span className={cn('text-xs font-bold px-3 py-1 rounded-full',
                        flight.status === 'airborne' || flight.status === 'departed' ? 'bg-green-500/20 text-green-400' :
                        flight.status === 'delayed' ? 'bg-amber-500/20 text-amber-400' :
                        flight.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-sky-500/20 text-sky-400'
                      )}>{flight.status?.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fleet Tab */}
      {activeTab === 'fleet' && (
        <div className="px-5 pt-5 space-y-5">
          {/* Fleet KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Activity} label="Total Aircraft" value={aircraft.length} color="text-sky-400 bg-sky-600/15" />
            <StatCard icon={CheckCircle} label="Active" value={activeAircraft} color={activeAircraft > 0 ? 'text-green-400 bg-green-600/15' : 'text-gray-400 bg-gray-600/15'} />
            <StatCard icon={Wrench} label="OOS" value={oosAircraft} color={oosAircraft > 0 ? 'text-red-400 bg-red-600/15' : 'text-gray-400 bg-gray-600/15'} />
            <StatCard icon={AlertTriangle} label="Open MEL" value={activeFaults} color={activeFaults > 0 ? 'text-amber-400 bg-amber-600/15' : 'text-gray-400 bg-gray-600/15'} />
          </div>

          {/* Aircraft List */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-extrabold text-white">Aircraft Registry</p>
              </div>
              <Link to="/FleetDashboard" className="text-xs font-bold text-orange-400 hover:text-orange-300">Manage Fleet →</Link>
            </div>
            {aircraft.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No aircraft registered</p>
            ) : (
              <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                {aircraft.map(ac => {
                  const acOOS = oosEntries.filter(e => e.tail_number === ac.tail_number);
                  const acMEL = melItems.filter(m => m.aircraft_tail === ac.tail_number);
                  return (
                    <div key={ac.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center">
                          <Plane className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-white font-mono">{ac.tail_number}</p>
                          <p className="text-xs text-gray-400">{ac.aircraft_type} · {ac.base_station || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {(acOOS.length > 0 || acMEL.length > 0) && (
                          <div className="flex gap-1.5">
                            {acOOS.length > 0 && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg">{acOOS.length} OOS</span>}
                            {acMEL.length > 0 && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">{acMEL.length} MEL</span>}
                          </div>
                        )}
                        <span className={cn('text-xs font-bold px-3 py-1 rounded-full',
                          ac.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          ac.status === 'oos' ? 'bg-red-500/20 text-red-400' :
                          ac.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gray-500/20 text-gray-400'
                        )}>{ac.status?.toUpperCase()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="px-5 pt-5">
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-extrabold text-white">All Active Alerts</p>
              </div>
              <p className="text-xs text-gray-500">{alerts.filter(a => !a.is_dismissed).length} total</p>
            </div>
            {alerts.filter(a => !a.is_dismissed).length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-bold text-sm">No active alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                {alerts.filter(a => !a.is_dismissed).map(alert => (
                  <div key={alert.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/5">
                    <div className={cn('w-3 h-3 rounded-full mt-1 flex-shrink-0',
                      alert.severity === 'critical' ? 'bg-red-400 animate-pulse' :
                      alert.severity === 'warning' ? 'bg-amber-400' : 'bg-sky-400'
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-white">{alert.title}</p>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded',
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                        )}>{alert.severity?.toUpperCase()}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                      <div className="flex gap-3 text-xs">
                        {alert.flight_number && <span className="text-sky-400">FLT {alert.flight_number}</span>}
                        {alert.aircraft_tail && <span className="text-gray-400">{alert.aircraft_tail}</span>}
                        {alert.target_roles?.length > 0 && <span className="text-gray-500">{alert.target_roles.join(', ')}</span>}
                        <span className="text-gray-600">{new Date(alert.created_date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}