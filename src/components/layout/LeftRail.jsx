import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, ChevronLeft, ChevronRight } from 'lucide-react';
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
  { label: 'FUN IN THE SUN', path: '/TravelWeather' },
  { label: 'IROPS',          path: '/IROPS' },

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

const BrandHeader = ({ collapsed, onToggle }) => (
  <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 flex-shrink-0">
    {!collapsed && (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Plane className="w-5 h-5 text-[#0a0e18]" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-white tracking-widest uppercase leading-none">Aerodyne</p>
          <p className="text-[10px] text-gray-500">Fleet Management</p>
        </div>
      </div>
    )}
    <button
      onClick={onToggle}
      className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0 ml-auto"
    >
      {collapsed ? <ChevronRight className="w-4 h-4 text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-300" />}
    </button>
  </div>
);

export default function LeftRail({ onCollapsedChange }) {
  const location = useLocation();
  const { mode } = useRail();
  const [collapsed, setCollapsed] = useState(false);

  const toggle = (val) => {
    setCollapsed(val);
    onCollapsedChange?.(val);
  };

  if (collapsed) {
    return (
      <aside className="fixed left-0 top-0 h-full w-12 bg-[#0a0e18] border-r border-border flex flex-col z-50">
        <BrandHeader collapsed onToggle={() => toggle(false)} />
      </aside>
    );
  }

  if (mode === 'tech') {
    return (
      <aside className="fixed left-0 top-0 h-full w-48 bg-[#0a0e18] border-r border-border flex flex-col z-50">
        <BrandHeader collapsed={false} onToggle={() => toggle(true)} />
        <nav className="flex flex-col gap-0 flex-1 w-full px-2 overflow-y-auto scrollbar-hide py-2">
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
    <aside className="fixed left-0 top-0 h-full w-48 bg-[#0a0e18] border-r border-border flex flex-col z-50">
      <BrandHeader collapsed={false} onToggle={() => toggle(true)} />
      <motion.nav 
        className="flex flex-col gap-0 flex-1 w-full px-2 overflow-y-auto scrollbar-hide py-2"
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