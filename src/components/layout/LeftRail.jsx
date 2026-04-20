import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRail } from '@/lib/RailContext';

// ── WORKGROUP 1: TECHNICIAN MODE (Line Maintenance / OOS / TechOps) ──────────
const TECHNICIAN_ITEMS = [
  { label: '👨‍✈️ Crew Chief', path: '/CrewChief' },
  { label: '📋 Mx Supervisor', path: '/MxSupervisor' },
  { label: '✅ QC Supervisor', path: '/QCSupervisor' },
  { label: '🌍 Global Stations', path: '/GlobalStations' },
  { label: '📊 Production Control', path: '/ProductionControl' },
  { label: '📝 Work Assignments', path: '/WorkAssignments' },
  { label: '🔧 Line Maintenance', path: '/LineMaintenanceDashboard' },
  { label: '📡 Mx Tracking', path: '/MxTracking' },
  { label: '🤝 Shift Handover', path: '/ShiftHandover' },
  { label: '📅 Engineering Calendar', path: '/EngCalendar' },
  { label: '🛠️ TechOps Dashboard', path: '/TechOps' },
  { label: '🚫 OOS Aircraft', path: '/OOSDashboard' },
  { label: '⚙️ Maintenance Control', path: '/MaintenanceControl' },
  { label: '✈️ Fleet Management', path: '/FleetDashboard' },
  { label: '📞 Comm Center', path: '/CommCenter' },
  { label: '📖 E-Logbook', path: '/TechOpsLogbook' },
  { label: '📚 Mx Logbook', path: '/MaintenanceLogbook' },
  { label: '🚨 Chronic & MEL Control', path: '/ChronicMEL' },
  { label: '⚠️ MEL Deferrals', path: '/MEL' },
  { label: '🔍 QA/QC', path: '/QAQC' },
  { label: '📦 Parts Supply', path: '/PartsSupply' },
  { label: '🔩 Tooling', path: '/ToolingManagement' },
  { label: '🔬 Engineering', path: '/EngineeringDashboard' },
  { label: '📡 Avionics', path: '/AvionicsDashboard' },
  { label: '🧩 Engine Removal', path: '/EngineRemovalInstallation' },
  { label: '🏭 Heavy MxMRO', path: '/HeavyMxMRO' },
  { label: '📥 ROB/BOR Operations', path: '/BORROB' },
  { label: '📋 AD Tracking', path: '/ADTracking' },
  { label: '🔗 Component Traceability', path: '/ComponentTraceability' },
  { label: '📜 Certificate of Release', path: '/CRS' },
  { label: '🔐 Signature Audit', path: '/SignatureAudit' },
];

// ── WORKGROUP 2: DISPATCH & OPERATIONS CONTROL ─────────────────────────────────
const DISPATCH_OPS_ITEMS = [
  { label: '🎮 Dispatch Workstation', path: '/Dispatch' },
  { label: '🌍 ETOPS Monitor', path: '/ETOPSMonitor' },
  { label: '🚨 IROPS Recovery', path: '/IROPS' },
  { label: '🤖 Delay Predictor', path: '/AIDispatchCopilot' },
  { label: '⛅ Weather', path: '/Weather' },
  { label: '🌤️ Travel Weather', path: '/TravelWeather' },
  { label: '📢 NOTAMs', path: '/NOTAMs' },
  { label: '📊 Ops Analytics', path: '/OTPDashboard' },
  { label: '⛽ Fuel Management', path: '/FuelContracts' },
  { label: '🛰️ Starlink Network', path: '/Starlink' },
];

// ── WORKGROUP 3: CREW OPERATIONS ────────────────────────────────────────────────
const CREW_OPS_ITEMS = [
  { label: '👨‍💼 Crew Control', path: '/CrewControl' },
  { label: '😴 Crew Fatigue', path: '/CrewControl' },
  { label: '🔗 Pairings', path: '/CrewPairing' },
  { label: '📇 Crew Directory', path: '/CrewDirectory' },
  { label: '📚 Training Records', path: '/Training' },
  { label: '🧮 FAR 117 Calculator', path: '/FAR117' },
];

// ── WORKGROUP 4: FLIGHT DECK / EFB ──────────────────────────────────────────────
const FLIGHT_DECK_ITEMS = [
  { label: '📱 EFB Dashboard', path: '/EFB' },
  { label: '✍️ Flight Release', path: '/EFB' },
  { label: '📈 Flight Performance', path: '/FlightPlanner' },
  { label: '⛅ Weather', path: '/Weather' },
  { label: '📄 Documents', path: '/Documents' },
  { label: '🛫 Live Flights', path: '/LiveFlightTracker' },
  { label: '🎛️ Fleet Ops Board', path: '/AerodyneFleetOps' },
];

// ── WORKGROUP 5: ADMIN / SYSTEM ─────────────────────────────────────────────────
const ADMIN_SYSTEM_ITEMS = [
  { label: '✈️ Fleet Management', path: '/FleetDashboard' },
  { label: '👤 User Management', path: '/UserManagement' },
  { label: '⚙️ Settings', path: '/Settings' },
  { label: '🖥️ Screensaver Editor', path: '/ScreensaverAdmin' },
  { label: '📜 Audit Logs', path: '/AuditLog' },
];

// ── HOME & CORE OPERATIONS (accessible to all) ──────────────────────────────────
const CORE_ITEMS = [
  { label: '🏠 HOME', path: '/' },
  { label: '🎯 OPS HUB', path: '/OpsHub' },
  { label: '📊 AOCS Hub', path: '/AocsDashboard' },
];





function NavGroup({ title, items, location }) {
  return (
    <div className="w-full">
      {title && <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest px-3 pt-3 pb-2">{title}</p>}
      {items.map(({ label, path }, idx) => {
        const isActive = location.pathname === path;
        return (
          <motion.div
            key={`${title}-${idx}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.02, duration: 0.3, ease: 'easeOut' }}
          >
            <Link
              to={path}
              className={cn(
                'flex items-center h-8 px-3 rounded-lg transition-all text-xs font-bold tracking-wide whitespace-nowrap active:scale-95 mx-1',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:text-white hover:bg-white/10'
              )}
            >
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
        <Plane className="w-5 h-5 text-sidebar-background" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-sidebar-foreground tracking-widest uppercase leading-none">Aerodyne</p>
        <p className="text-[10px] text-sidebar-foreground/70">Fleet Management</p>
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
  const [collapsed, setCollapsed] = useState(false);

  const toggle = (val) => {
    setCollapsed(val);
    onCollapsedChange?.(val);
  };

  if (collapsed) {
    return (
      <aside className="fixed left-0 top-0 h-full w-12 bg-sidebar border-r border-border flex flex-col z-50">
        <BrandHeader collapsed onToggle={() => toggle(false)} />
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-48 bg-sidebar border-r border-border flex flex-col z-50">
      <BrandHeader collapsed={false} onToggle={() => toggle(true)} />
      <motion.nav 
        className="flex flex-col gap-0 flex-1 w-full overflow-y-auto scrollbar-hide py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, staggerChildren: 0.01 }}
      >
        {/* Core / Home */}
        <NavGroup items={CORE_ITEMS} location={location} />
        <motion.div className="my-1 border-t border-white/8 mx-3" />

        {/* Workgroup 1: Technician */}
        <NavGroup title="🔧 Technician Mode" items={TECHNICIAN_ITEMS} location={location} />
        <motion.div className="my-1 border-t border-white/8 mx-3" />

        {/* Workgroup 2: Dispatch & Ops */}
        <NavGroup title="✈️ Dispatch & Ops" items={DISPATCH_OPS_ITEMS} location={location} />
        <motion.div className="my-1 border-t border-white/8 mx-3" />

        {/* Workgroup 3: Crew */}
        <NavGroup title="👥 Crew Ops" items={CREW_OPS_ITEMS} location={location} />
        <motion.div className="my-1 border-t border-white/8 mx-3" />

        {/* Workgroup 4: Flight Deck */}
        <NavGroup title="🛩️ Flight Deck / EFB" items={FLIGHT_DECK_ITEMS} location={location} />
        <motion.div className="my-1 border-t border-white/8 mx-3" />

        {/* Workgroup 5: Admin */}
        <NavGroup title="⚙️ Admin / System" items={ADMIN_SYSTEM_ITEMS} location={location} />
      </motion.nav>
    </aside>
  );
}