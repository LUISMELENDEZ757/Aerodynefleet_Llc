import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRail } from '@/lib/RailContext';

// ── FLIGHT OPS GROUP ─────────────────────────────────────────────────────────
const FLIGHT_OPS_ITEMS = [
  { label: 'HOME',           path: '/Home' },
  { label: 'AOCS',           path: '/AocsDashboard' },
  { label: 'DISPATCH',       path: '/Dispatch' },
  { label: 'EFB',            path: '/EFB' },
  { label: 'FLIGHT CREW',    path: '/FlightCrew' },
  { label: 'CABIN CREW',     path: '/FlightAttendant' },
  { label: 'CREW CONTROL',   path: '/CrewControl' },
  { label: 'WEATHER',        path: '/Weather' },
  { label: 'IROPS',          path: '/IROPS' },
  { label: 'FUEL MGMT',      path: '/Fuel' },
  { label: 'LOAD CONTROL',   path: '/LoadControl' },
  { label: 'FLIGHT PLANNER', path: '/FlightPlanner' },
  { label: 'SAFETY & QA',    path: '/SafetyQA' },
  { label: 'QA/QC',          path: '/QAQC' },
  { label: 'ANALYTICS',      path: '/Analytics' },
  { label: 'COMM CENTER',    path: '/CommCenter' },
  { label: 'STARLINK',       path: '/Starlink' },
  { label: 'SETTINGS',       path: '/Settings' },
];

// ── TECH OPS GROUP ───────────────────────────────────────────────────────────
const TECH_OPS_ITEMS = [
  { label: 'TECH OPS',       path: '/TechOps' },
  { label: 'LINE MX',        path: '/LineMaintenanceDashboard' },
  { label: 'HEAVY MX / MRO', path: '/HeavyMxMRO' },
  { label: 'ENGINE REMOVAL / INST', path: '/EngineRemovalInstallation' },
  { label: 'FLEET DASHBOARD',path: '/FleetDashboard' },
  { label: 'E-LOGBOOK',      path: '/TechOpsLogbook' },
  { label: 'MEL',            path: '/MEL' },
  { label: 'MCC',            path: '/MaintenanceControl' },
  { label: 'OOS DASHBOARD',  path: '/OOSDashboard' },
  { label: 'TECHNICIAN',     path: '/TechnicianMode' },
  { label: 'TOOLING',        path: '/ToolingManagement' },
  { label: 'ENGINEERING',    path: '/EngineeringDashboard' },
  { label: 'ENGINE HEALTH',  path: '/EngineHealthAnalytics' },
  { label: 'TELEMETRY',      path: '/TelemetryHub' },
  { label: 'GROUND OPS',     path: '/GroundOps' },
  { label: 'NOTAMs',         path: '/NOTAMs' },
  { label: 'TRAINING',       path: '/Training' },
  { label: 'DOCUMENTS',      path: '/Documents' },
];

// ── TECH-MODE ONLY RAIL (simplified) ─────────────────────────────────────────
const TECH_MODE_ITEMS = [
  { label: 'HOME',           path: '/Home' },
  { label: 'AOCS',           path: '/AocsDashboard' },
  { label: 'LINE MX',        path: '/LineMaintenanceDashboard' },
  ...TECH_OPS_ITEMS,
  { label: 'SETTINGS',       path: '/Settings' },
];

function NavGroup({ title, items, location }) {
  return (
    <div className="w-full">
      {title && <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest px-3 pt-3 pb-1">{title}</p>}
      {items.map(({ label, path }, idx) => {
        const isActive = location.pathname === path;
        return (
          <motion.div
            key={path}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.3, ease: 'easeOut' }}
          >
            <Link
              to={path}
              className={cn(
                'relative group flex items-center h-9 px-3 rounded-xl transition-all text-xs font-extrabold tracking-wide whitespace-nowrap active:scale-95',
                isActive
                  ? 'bg-primary/30 text-primary border border-primary/30'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="navBg"
                  className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              {label}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function LeftRail() {
  const location = useLocation();
  const { mode } = useRail();

  if (mode === 'tech') {
    return (
      <aside className="fixed left-0 top-0 h-full w-48 glass-strong border-r border-border flex flex-col py-4 z-50 liquid-glow">
        <nav className="flex flex-col gap-0 flex-1 w-full px-2 overflow-y-auto scrollbar-hide">
          {TECH_MODE_ITEMS.map(({ label, path }, idx) => {
            const isActive = location.pathname === path;
            return (
              <motion.div
                key={path}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.3, ease: 'easeOut' }}
              >
                <Link to={path}
                  className={cn(
                    'flex items-center h-9 px-3 rounded-xl transition-all text-xs font-extrabold tracking-wide whitespace-nowrap active:scale-95',
                    isActive ? 'bg-primary/30 text-primary border border-primary/30' : 'text-gray-500 hover:text-gray-300'
                  )}>
                  {label}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-48 glass-strong border-r border-border flex flex-col py-2 z-50 liquid-glow">
      <motion.nav 
        className="flex flex-col gap-0 flex-1 w-full px-2 overflow-y-auto scrollbar-hide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, staggerChildren: 0.02 }}
      >
        <NavGroup items={FLIGHT_OPS_ITEMS} location={location} />
        <motion.div className="my-1 border-t border-white/8 mx-3" />
        <NavGroup title="Tech Ops" items={TECH_OPS_ITEMS} location={location} />
      </motion.nav>
    </aside>
  );
}