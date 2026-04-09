import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plane, LayoutGrid, Activity, RefreshCw, Bell,
  ChevronDown, Clock, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FleetBadge } from '@/components/fleet/FleetSwitcher';
import { useRail } from '@/lib/RailContext';
import TechOpsDashboard from '@/components/techops/TechOpsDashboard';
import useTieredPreload from '@/hooks/useTieredPreload';

import FlightMovementPanel  from '@/components/opshub/FlightMovementPanel';
import FleetHealthPanel     from '@/components/opshub/FleetHealthPanel';
import CrewStatusPanel      from '@/components/opshub/CrewStatusPanel';
import WeatherAtcPanel      from '@/components/opshub/WeatherAtcPanel';
import StationPerformancePanel from '@/components/opshub/StationPerformancePanel';
import OpsAlertsPanel       from '@/components/opshub/OpsAlertsPanel';
import PredictiveAiPanel    from '@/components/opshub/PredictiveAiPanel';
import DelayProbabilityWidget from '@/components/opshub/DelayProbabilityWidget';

// ── Module launcher (kept for quick-access) ──────────────────────────────────
const QUICK_LINKS = [
  { label: 'Flight Ops',      path: '/Dashboard',             bg: 'bg-primary/20',      color: 'text-primary'    },
  { label: 'Dispatch',        path: '/Dispatch',              bg: 'bg-blue-500/20',      color: 'text-blue-400'   },
  { label: 'EFB',             path: '/EFB',                   bg: 'bg-yellow-500/20',    color: 'text-yellow-400' },
  { label: 'MEL',             path: '/MEL',                   bg: 'bg-orange-500/20',    color: 'text-orange-400' },
  { label: 'IROPS',           path: '/IROPS',                 bg: 'bg-red-600/20',       color: 'text-red-400'    },
  { label: 'Fleet',           path: '/FleetDashboard',        bg: 'bg-emerald-500/20',   color: 'text-emerald-400'},
  { label: 'Crew',            path: '/CrewControl',           bg: 'bg-purple-500/20',    color: 'text-purple-400' },
  { label: 'Weather',         path: '/Weather',               bg: 'bg-cyan-500/20',      color: 'text-cyan-400'   },
  { label: 'Ground Ops',      path: '/GroundOps',             bg: 'bg-zinc-500/20',      color: 'text-zinc-400'   },
  { label: 'Analytics',       path: '/Analytics',             bg: 'bg-lime-600/20',      color: 'text-lime-400'   },
  { label: 'Engine Health',   path: '/EngineHealthAnalytics', bg: 'bg-emerald-700/20',   color: 'text-emerald-400'},
  { label: 'Telemetry',       path: '/TelemetryHub',          bg: 'bg-sky-600/20',       color: 'text-sky-400'    },
  { label: 'AI Co-Pilot',    path: '/AIDispatchCopilot',     bg: 'bg-violet-600/20',    color: 'text-violet-400' },
  { label: 'AOG Forecast',   path: '/AOGForecast',           bg: 'bg-red-600/20',       color: 'text-red-400'    },
  { label: 'Diversion',      path: '/DiversionWorkflow',     bg: 'bg-orange-600/20',    color: 'text-orange-400' },
  { label: 'SIGMET Map',     path: '/SIGMETMap',             bg: 'bg-blue-600/20',      color: 'text-blue-400'   },
  { label: 'FAR 117',        path: '/FAR117',                bg: 'bg-green-600/20',     color: 'text-green-400'  },
  { label: 'OTP Report',     path: '/OTPDashboard',          bg: 'bg-amber-600/20',     color: 'text-amber-400'  },
  { label: 'Cost/Flight',    path: '/CostAnalytics',         bg: 'bg-emerald-600/20',   color: 'text-emerald-400'},
  { label: 'Pred. Parts',    path: '/PredictiveParts',       bg: 'bg-cyan-600/20',      color: 'text-cyan-400'   },
  { label: 'AOCS Hub',       path: '/AocsDashboard',         bg: 'bg-indigo-600/20',    color: 'text-indigo-400' },
];

function ZuluClock() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(time.getUTCHours()).padStart(2, '0');
  const m = String(time.getUTCMinutes()).padStart(2, '0');
  const s = String(time.getUTCSeconds()).padStart(2, '0');
  return (
    <span className="font-mono text-sm font-extrabold text-primary tracking-widest">
      {h}:{m}:{s} Z
    </span>
  );
}

export default function Home() {
  useTieredPreload();
  const { mode } = useRail();
  const [showModules, setShowModules] = useState(false);

  const { data: flights = [],    refetch: refetchFlights }    = useQuery({ queryKey: ['opshub-flights'],    queryFn: () => base44.entities.Flight.list('-flight_date', 200),           refetchInterval: 30000 });
  const { data: aircraft = [],   refetch: refetchAircraft }   = useQuery({ queryKey: ['opshub-aircraft'],   queryFn: () => base44.entities.Aircraft.list('tail_number', 500),          refetchInterval: 60000 });
  const { data: crew = [],       refetch: refetchCrew }       = useQuery({ queryKey: ['opshub-crew'],       queryFn: () => base44.entities.CrewAssignment.list('-flight_date', 200),   refetchInterval: 30000 });
  const { data: melItems = [],   refetch: refetchMel }        = useQuery({ queryKey: ['opshub-mel'],        queryFn: () => base44.entities.MELItem.list('-deferred_date', 200),        refetchInterval: 60000 });
  const { data: alerts = [],     refetch: refetchAlerts }     = useQuery({ queryKey: ['opshub-alerts'],     queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),   refetchInterval: 20000 });
  const { data: groundOps = [],  refetch: refetchGroundOps }  = useQuery({ queryKey: ['opshub-groundops'],  queryFn: () => base44.entities.GroundOps.list('-flight_date', 100),         refetchInterval: 30000 });
  const { data: releases = [] }                               = useQuery({ queryKey: ['opshub-releases'],   queryFn: () => base44.entities.DispatchRelease.list('-flight_date', 100),  refetchInterval: 60000 });

  const refetchAll = () => {
    refetchFlights(); refetchAircraft(); refetchCrew();
    refetchMel(); refetchAlerts(); refetchGroundOps();
  };

  const criticalAlerts = alerts.filter(a => !a.is_dismissed && a.severity === 'critical').length;

  if (mode === 'tech') return <TechOpsDashboard />;

  return (
    <div className="min-h-screen bg-[#0d1117] pb-24">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 bg-[#0a0e18] border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white tracking-widest uppercase leading-none">Operations Hub</p>
            <p className="text-[10px] text-gray-500 font-mono">Aerodyne Fleet LLC</p>
          </div>
          <FleetBadge />
        </div>
        <div className="flex items-center gap-3">
          <ZuluClock />
          {criticalAlerts > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-1 rounded-full animate-pulse">
              <Bell className="w-3 h-3" /> {criticalAlerts}
            </span>
          )}
          <button onClick={refetchAll} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={() => setShowModules(v => !v)}
            className={cn('flex items-center gap-1 text-[10px] font-bold px-3 py-2 rounded-xl border transition-colors',
              showModules ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            )}>
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modules</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showModules && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* ── MODULE QUICK-ACCESS DRAWER ── */}
      {showModules && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-[#111620] border-b border-white/10 px-4 py-3"
        >
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map(({ label, path, bg, color }) => (
              <Link key={path} to={path} onClick={() => setShowModules(false)}
                className={cn('text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 transition-all hover:border-white/20', bg, color)}>
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── MAIN DASHBOARD GRID ── */}
      <div className="p-4 space-y-4 max-w-7xl mx-auto">

        {/* Row 1: Alerts (full width if critical) */}
        {alerts.filter(a => !a.is_dismissed).length > 0 && (
          <OpsAlertsPanel alerts={alerts} />
        )}

        {/* Row 2: Flight Movement (full width) */}
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

        {/* Row 5: Delay Probability + Predictive AI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DelayProbabilityWidget flights={flights} aircraft={aircraft} />
          <PredictiveAiPanel
          flights={flights}
          aircraft={aircraft}
          crew={crew}
          melItems={melItems}
        />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 font-mono pt-2">AERODYNE FLEET LLC · OPS HUB v3.0</p>
      </div>
    </div>
  );
}