import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Clock, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import OpsAlertsPanel from '@/components/opshub/OpsAlertsPanel';
import FlightMovementPanel from '@/components/opshub/FlightMovementPanel';
import FleetHealthPanel from '@/components/opshub/FleetHealthPanel';
import GlobalFleetMap from '@/components/map/GlobalFleetMap';
import CrewStatusPanel from '@/components/opshub/CrewStatusPanel';
import WeatherAtcPanel from '@/components/opshub/WeatherAtcPanel';
import StationPerformancePanel from '@/components/opshub/StationPerformancePanel';
import DelayProbabilityWidget from '@/components/opshub/DelayProbabilityWidget';
import PredictiveAiPanel from '@/components/opshub/PredictiveAiPanel';
import WorldTimeCard from '@/components/aocs/WorldTimeCard';

const TODAY = new Date().toISOString().split('T')[0];

const QUICK_LINKS = [
  { label: '🛩️ EFB', path: '/EFB', bg: 'bg-blue-600/20', color: 'text-blue-400' },
  { label: '🔧 TechOps', path: '/TechOps', bg: 'bg-orange-600/20', color: 'text-orange-400' },
  { label: '📋 MEL', path: '/MEL', bg: 'bg-amber-600/20', color: 'text-amber-400' },
  { label: '✈️ Dispatch', path: '/Dispatch', bg: 'bg-cyan-600/20', color: 'text-cyan-400' },
  { label: '👥 Crew', path: '/CrewControl', bg: 'bg-purple-600/20', color: 'text-purple-400' },
  { label: '📊 Analytics', path: '/Analytics', bg: 'bg-green-600/20', color: 'text-green-400' },
  { label: '🏭 MCC', path: '/MaintenanceControl', bg: 'bg-red-600/20', color: 'text-red-400' },
  { label: '🌐 Stations', path: '/GlobalStations', bg: 'bg-indigo-600/20', color: 'text-indigo-400' },
];

export default function OpsHub() {
  const [showModules, setShowModules] = useState(false);

  const { data: flights = [] } = useQuery({
    queryKey: ['ops-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['ops-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: 30000,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['ops-crew'],
    queryFn: () => base44.entities.CrewAssignment.list('-created_date', 100),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['ops-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['ops-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: groundOps = [] } = useQuery({
    queryKey: ['ops-ground'],
    queryFn: () => base44.entities.GroundOps.list('-created_date', 100),
    refetchInterval: 30000,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['ops-releases'],
    queryFn: () => base44.entities.CertificateOfRelease.list('-created_date', 50),
    refetchInterval: 60000,
  });

  const { data: flightAwarePositions = [] } = useQuery({
    queryKey: ['ops-fa-positions'],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwarePositions', {});
      return res.data?.aircraft || [];
    },
    refetchInterval: 30000,
  });

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-30 px-5 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">MCC Maintenance Control Dashboard</h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">Fleet Status · Real-Time Monitoring</p>
            </div>
            <button onClick={() => setShowModules(!showModules)} className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {criticalAlerts.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2 mb-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-red-400">{criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''}</span>
            </motion.div>
          )}

          {showModules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex flex-wrap gap-2 pt-3 border-t border-border"
            >
              {QUICK_LINKS.map(({ label, path, bg, color }) => (
                <Link key={path} to={path} onClick={() => setShowModules(false)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-border transition-all hover:border-primary ${bg} ${color}`}>
                  {label}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="p-4 space-y-4 max-w-7xl mx-auto">

        {/* Row 1: Alerts */}
        {alerts.filter(a => !a.is_dismissed).length > 0 && (
          <OpsAlertsPanel alerts={alerts} />
        )}

        {/* Row 2: Flight Movement */}
        <FlightMovementPanel flights={flights} />

        {/* Row 3: Fleet Health + Crew Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FleetHealthPanel aircraft={aircraft} melItems={melItems} />
          <CrewStatusPanel crew={crew} />
        </div>

        {/* Row 4: Weather/ATC + Station Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WeatherAtcPanel releases={releases} />
          <StationPerformancePanel groundOps={groundOps} flights={flights} />
        </div>

        {/* Row 5: Global Fleet Map */}
        <div className="h-96 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-card">
            <p className="text-xs font-extrabold text-foreground uppercase tracking-widest">Global Fleet Status Map</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Live positions · Weather patterns · Maintenance status (🟢 Airworthy 🟡 MEL 🔴 OOS)</p>
          </div>
          <GlobalFleetMap flights={flights} aircraft={aircraft} melItems={melItems} />
        </div>

        {/* Row 6: Delay Probability + Predictive AI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DelayProbabilityWidget flights={flights} aircraft={aircraft} />
          <PredictiveAiPanel
            flights={flights}
            aircraft={aircraft}
            crew={crew}
            melItems={melItems}
          />
        </div>

        {/* Row 7: World Time Card (AOCS Hub) */}
        <WorldTimeCard />
      </div>
    </div>
  );
}