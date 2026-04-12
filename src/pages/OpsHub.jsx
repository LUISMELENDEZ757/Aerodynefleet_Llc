import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { AlertTriangle, Menu, Plane, Wrench, Users, Cloud, Truck, TrendingUp, Brain, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const TODAY = new Date().toISOString().split('T')[0];

const QUICK_LINKS = [
  { label: '🛩️ EFB', path: '/EFB' },
  { label: '🔧 TechOps', path: '/TechOps' },
  { label: '📋 MEL', path: '/MEL' },
  { label: '✈️ Dispatch', path: '/Dispatch' },
  { label: '👥 Crew', path: '/CrewControl' },
  { label: '📊 Analytics', path: '/Analytics' },
  { label: '🏭 MCC', path: '/MaintenanceControl' },
  { label: '🌐 Stations', path: '/GlobalStations' },
];

function StatCard({ label, value, sub, color = 'text-white', icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
      </div>
      <p className={`text-4xl font-black leading-none ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function OpsHub() {
  const [showLinks, setShowLinks] = useState(false);

  const { data: flights = [] } = useQuery({
    queryKey: ['opshub-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['opshub-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: 30000,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['opshub-crew'],
    queryFn: () => base44.entities.CrewAssignment.list('-created_date', 100),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['opshub-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['opshub-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const { data: groundOps = [] } = useQuery({
    queryKey: ['opshub-ground'],
    queryFn: () => base44.entities.GroundOps.list('-created_date', 100),
    refetchInterval: 30000,
  });

  // Derived stats
  const activeFlights = flights.filter(f => !['arrived', 'landed', 'cancelled'].includes(f.status)).length;
  const delayed = flights.filter(f => f.status === 'delayed' || (f.delay_minutes || 0) >= 15).length;
  const cancelled = flights.filter(f => f.status === 'cancelled').length;
  const oosAircraft = aircraft.filter(a => a.status === 'oos').length;
  const melOpen = melItems.filter(m => m.status !== 'cleared').length;
  const crewIllegal = crew.filter(c => c.legal_status === 'illegal').length;
  const crewNearLimit = crew.filter(c => c.legal_status === 'near_limit').length;
  const activeGround = groundOps.filter(g => g.status !== 'completed' && g.status !== 'cancelled').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const activeAlerts = alerts.filter(a => !a.is_dismissed);

  const todayFlights = flights.filter(f => !['arrived', 'landed', 'cancelled'].includes(f.status))
    .sort((a, b) => (a.scheduled_departure || '').localeCompare(b.scheduled_departure || ''))
    .slice(0, 8);

  const STATUS_COLOR = {
    departed: 'text-green-400 bg-green-500/15',
    airborne: 'text-cyan-400 bg-cyan-500/15',
    boarding: 'text-primary bg-primary/15',
    scheduled: 'text-gray-400 bg-gray-500/10',
    delayed: 'text-amber-400 bg-amber-500/15',
    on_time: 'text-green-400 bg-green-500/15',
    diverted: 'text-orange-400 bg-orange-500/15',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Operations Hub</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Real-Time Fleet & Ops Monitoring</p>
          </div>
          <button
            onClick={() => setShowLinks(v => !v)}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {criticalAlerts.length > 0 && (
          <div className="max-w-7xl mx-auto mt-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs font-bold text-red-400">{criticalAlerts.length} CRITICAL ALERT{criticalAlerts.length > 1 ? 'S' : ''} — Immediate action required</span>
          </div>
        )}

        {showLinks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="max-w-7xl mx-auto mt-3 pt-3 border-t border-border flex flex-wrap gap-2"
          >
            {QUICK_LINKS.map(({ label, path }) => (
              <Link key={path} to={path} onClick={() => setShowLinks(false)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-secondary border border-border hover:border-primary/40 text-foreground transition-colors">
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-5">

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active Flights" value={activeFlights} sub={`${delayed} delayed · ${cancelled} cancelled`} color="text-primary" icon={Plane} />
          <StatCard label="OOS Aircraft" value={oosAircraft} sub={`${melOpen} open MEL items`} color={oosAircraft > 0 ? 'text-red-400' : 'text-green-400'} icon={Wrench} />
          <StatCard label="Crew Issues" value={crewIllegal + crewNearLimit} sub={`${crewIllegal} illegal · ${crewNearLimit} near limit`} color={(crewIllegal + crewNearLimit) > 0 ? 'text-amber-400' : 'text-green-400'} icon={Users} />
          <StatCard label="Ground Ops" value={activeGround} sub="active turns" color="text-cyan-400" icon={Truck} />
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-extrabold text-foreground">Active Alerts</p>
              <span className="ml-auto text-xs text-muted-foreground">{activeAlerts.length} unresolved</span>
            </div>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {activeAlerts.slice(0, 10).map(alert => (
                <div key={alert.id} className="px-5 py-3 flex items-start gap-3">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${
                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>{alert.severity?.toUpperCase()}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    {alert.message && <p className="text-xs text-muted-foreground truncate">{alert.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Flight Movement */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-foreground">Live Flight Movement</p>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1" />
            <Link to="/Dashboard" className="ml-auto text-xs text-primary hover:underline">Full view →</Link>
          </div>
          {todayFlights.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">No active flights today</div>
          ) : (
            <div className="divide-y divide-border">
              {todayFlights.map(f => {
                const sc = STATUS_COLOR[f.status] || STATUS_COLOR.scheduled;
                return (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded flex-shrink-0 ${sc}`}>
                      {f.status?.toUpperCase() || 'SCHED'}
                    </span>
                    <span className="text-sm font-mono font-bold text-foreground w-20 truncate">{f.flight_number}</span>
                    <span className="text-sm text-muted-foreground flex-1">{f.origin} → {f.destination}</span>
                    {f.aircraft_tail && <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{f.aircraft_tail}</span>}
                    {(f.delay_minutes || 0) >= 15 && (
                      <span className="text-xs font-bold text-amber-400 flex-shrink-0">+{f.delay_minutes}m</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fleet + Crew */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fleet Health */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-extrabold text-foreground">Fleet Health</p>
              <Link to="/FleetDashboard" className="ml-auto text-xs text-primary hover:underline">Fleet →</Link>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Active', value: aircraft.filter(a => a.status === 'active').length, color: 'text-green-400' },
                { label: 'Maintenance', value: aircraft.filter(a => a.status === 'maintenance').length, color: 'text-amber-400' },
                { label: 'OOS', value: oosAircraft, color: oosAircraft > 0 ? 'text-red-400' : 'text-gray-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-background rounded-xl p-3 text-center">
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {oosAircraft > 0 && (
              <div className="px-4 pb-4 space-y-1">
                {aircraft.filter(a => a.status === 'oos').slice(0, 3).map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono font-bold text-red-400">{a.tail_number}</span>
                    <span className="text-xs text-muted-foreground">{a.aircraft_type}</span>
                    {a.base_station && <span className="text-xs text-muted-foreground ml-auto">{a.base_station}</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Open MEL Items</span>
                <span className={`font-bold ${melOpen > 0 ? 'text-amber-400' : 'text-green-400'}`}>{melOpen}</span>
              </div>
            </div>
          </div>

          {/* Crew Status */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <p className="text-sm font-extrabold text-foreground">Crew Status</p>
              <Link to="/CrewControl" className="ml-auto text-xs text-primary hover:underline">Control →</Link>
            </div>
            <div className="p-4 space-y-3">
              {/* Legality bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-muted-foreground font-bold uppercase tracking-widest">FAR 117 Legality</span>
                  <span className={crewIllegal > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                    {crew.length > 0 ? Math.round(((crew.length - crewIllegal) / crew.length) * 100) : 100}% compliant
                  </span>
                </div>
                <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${crew.length > 0 ? ((crew.length - crewIllegal - crewNearLimit) / crew.length) * 100 : 100}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${crew.length > 0 ? (crewNearLimit / crew.length) * 100 : 0}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${crew.length > 0 ? (crewIllegal / crew.length) * 100 : 0}%` }} />
                </div>
                <div className="flex gap-3 mt-1.5 text-[10px]">
                  <span className="text-green-400">{crew.length - crewIllegal - crewNearLimit} Legal</span>
                  {crewNearLimit > 0 && <span className="text-amber-400">{crewNearLimit} Near Limit</span>}
                  {crewIllegal > 0 && <span className="text-red-400 font-bold">{crewIllegal} VIOLATION</span>}
                </div>
              </div>
              {crewIllegal > 0 && (
                <div className="space-y-1">
                  {crew.filter(c => c.legal_status === 'illegal').slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-red-400">{c.crew_name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{c.role}</span>
                      {c.flight_number && <span className="text-xs font-mono text-muted-foreground ml-auto">{c.flight_number}</span>}
                    </div>
                  ))}
                </div>
              )}
              {crew.length === 0 && (
                <p className="text-center text-muted-foreground text-xs py-4">No crew assignments today</p>
              )}
            </div>
          </div>
        </div>

        {/* Ground Ops */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Truck className="w-4 h-4 text-zinc-400" />
            <p className="text-sm font-extrabold text-foreground">Station Performance</p>
            <Link to="/GroundOps" className="ml-auto text-xs text-primary hover:underline">Ground Ops →</Link>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Active Turns', value: activeGround, color: 'text-primary' },
              { label: 'Boarding', value: groundOps.filter(g => ['boarding','final_boarding'].includes(g.boarding_status)).length, color: 'text-green-400' },
              { label: 'Fueling', value: groundOps.filter(g => g.fuel_truck_status === 'fueling').length, color: 'text-amber-400' },
              { label: 'Departed', value: groundOps.filter(g => g.boarding_status === 'closed').length, color: 'text-cyan-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-background rounded-xl p-3 text-center">
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links Footer */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Navigation</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map(({ label, path }) => (
              <Link key={path} to={path}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary border border-border hover:border-primary/40 text-foreground transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}