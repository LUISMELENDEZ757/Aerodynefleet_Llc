import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Plane } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  {
    id: 'core',
    title: null,
    items: [
      { label: 'Home', icon: '🏠', path: '/' },
      { label: 'Maintenance Control', icon: '⚙️', path: '/MaintenanceControl' },
      { label: 'MCC Ops Hub', icon: '🎯', path: '/OpsHub' },
      { label: 'AOCS Hub', icon: '📊', path: '/AocsDashboard' },
    ],
  },
  {
    id: 'fleet',
    title: 'Fleet Health',
    items: [
      { label: 'Fleet Dashboard', icon: '✈️', path: '/FleetDashboard' },
      { label: 'Fleet Registry', icon: '📋', path: '/FleetRegistry' },
      { label: 'OOS Aircraft', icon: '🚫', path: '/OOSDashboard' },
      { label: 'ETOPS Monitor', icon: '🌍', path: '/ETOPSMonitor' },
      { label: 'Engine Health', icon: '🔥', path: '/EngineHealthAnalytics' },
      { label: 'Avionics', icon: '📡', path: '/AvionicsDashboard' },
      { label: 'Boeing AHM', icon: '📡', path: '/BoeingAHM' },
      { label: 'Airbus Skywise', icon: '🌐', path: '/AirbusSkyw' },
      { label: 'Telemetry Hub', icon: '📶', path: '/TelemetryHub' },
      { label: 'AI Forecasting', icon: '🤖', path: '/AIForecasting' },
      { label: 'AI MX Copilot', icon: '🧠', path: '/AICopilot' },
      { label: 'AOG Forecast', icon: '⚠️', path: '/AOGForecast' },
    ],
  },
  {
    id: 'linemx',
    title: 'Line Maintenance',
    items: [
      { label: 'Technician Mode', icon: '🧰', path: '/TechnicianMode' },
      { label: 'Crew Chief', icon: '👨‍✈️', path: '/CrewChief' },
      { label: 'Mx Supervisor', icon: '📋', path: '/MxSupervisor' },
      { label: 'Line Maintenance', icon: '🔧', path: '/LineMaintenanceDashboard' },
      { label: 'TechOps Dashboard', icon: '🛠️', path: '/TechOps' },
      { label: 'E-Logbook', icon: '📖', path: '/TechOpsLogbook' },
      { label: 'Aircraft Status', icon: '📚', path: '/MaintenanceLogbook' },
      { label: 'Mx Tracking', icon: '📡', path: '/MxTracking' },
      { label: 'Manpower & Staffing', icon: '👷', path: '/ManpowerStaffing' },
      { label: 'Work Assignments', icon: '📝', path: '/WorkAssignments' },
      { label: 'Shift Turnover', icon: '🤝', path: '/ShiftHandover' },
      { label: 'Line Mx Tablet', icon: '📱', path: '/LineMxTablet' },
    ],
  },
  {
    id: 'engineering',
    title: 'Engineering',
    items: [
      { label: 'Engineering Dashboard', icon: '🔬', path: '/EngineeringDashboard' },
      { label: 'MEL Deferrals', icon: '⚠️', path: '/MEL' },
      { label: 'Chronic & MEL Control', icon: '🚨', path: '/ChronicMEL' },
      { label: 'Heavy MX / MRO', icon: '🏭', path: '/HeavyMxMRO' },
      { label: 'Engine Removal/Install', icon: '🧩', path: '/EngineRemovalInstallation' },
      { label: 'EBU Dashboard', icon: '🔩', path: '/EBUDashboard' },
      { label: 'AD Tracking', icon: '📋', path: '/ADTracking' },
      { label: 'Planning & Checks', icon: '📅', path: '/Planning' },
      { label: 'Engineering Calendar', icon: '📅', path: '/EngCalendar' },
      { label: 'Reliability Tracking', icon: '📊', path: '/Reliability' },
      { label: 'Production Control', icon: '📊', path: '/ProductionControl' },
    ],
  },
  {
    id: 'records',
    title: 'Records & Compliance',
    items: [
      { label: 'QA / QC', icon: '🔍', path: '/QAQC' },
      { label: 'QC Supervisor', icon: '✅', path: '/QCSupervisor' },
      { label: 'Certificate of Release', icon: '📜', path: '/CRS' },
      { label: 'Signature Audit', icon: '🔐', path: '/SignatureAudit' },
      { label: 'Component Traceability', icon: '🔗', path: '/ComponentTraceability' },
      { label: 'Records Retention', icon: '🗂️', path: '/RecordsRetention' },
      { label: 'Release Archive', icon: '📥', path: '/ReleaseArchive' },
      { label: 'Audit Logs', icon: '📜', path: '/AuditLog' },
    ],
  },
  {
    id: 'parts',
    title: 'Parts & Inventory',
    items: [
      { label: 'Parts Supply', icon: '📦', path: '/PartsSupply' },
      { label: 'Part Inventory', icon: '📦', path: '/PartInventory' },
      { label: 'BOR/ROB Operations', icon: '📥', path: '/BORROB' },
      { label: 'Tooling', icon: '🔩', path: '/ToolingManagement' },
    ],
  },
  {
    id: 'dispatch',
    title: 'Dispatch & Operations',
    items: [
      { label: 'Dispatch Workstation', icon: '🎮', path: '/Dispatch' },
      { label: 'IROPS Recovery', icon: '🚨', path: '/IROPS' },
      { label: 'AI Dispatch Copilot', icon: '🤖', path: '/AIDispatchCopilot' },
      { label: 'Flight Board', icon: '🛫', path: '/FlightBoard' },
      { label: 'Live Flight Tracker', icon: '🛫', path: '/LiveFlightTracker' },
      { label: 'Fleet Ops Board', icon: '🎛️', path: '/AerodyneFleetOps' },
      { label: 'OTP Dashboard', icon: '📊', path: '/OTPDashboard' },
      { label: 'Weather', icon: '⛅', path: '/Weather' },
      { label: 'NOTAMs', icon: '📢', path: '/NOTAMs' },
      { label: 'SIGMET Map', icon: '🗺️', path: '/SIGMETMap' },
      { label: 'Fuel Management', icon: '⛽', path: '/FuelContracts' },
      { label: 'Starlink Network', icon: '🛰️', path: '/Starlink' },
    ],
  },
  {
    id: 'crew',
    title: 'Crew Operations',
    items: [
      { label: 'Crew Control', icon: '👨‍💼', path: '/CrewControl' },
      { label: 'Crew Pairings', icon: '🔗', path: '/CrewPairing' },
      { label: 'Crew Directory', icon: '📇', path: '/CrewDirectory' },
      { label: 'Training Records', icon: '📚', path: '/Training' },
      { label: 'FAR 117 Calculator', icon: '🧮', path: '/FAR117' },
    ],
  },
  {
    id: 'cabin',
    title: 'Cabin & Ground',
    items: [
      { label: 'Cabin Discrepancy', icon: '🛋️', path: '/CabinDiscrepancy' },
      { label: 'Passenger Service', icon: '👨‍💼', path: '/PSS' },
      { label: 'Ground Ops', icon: '🚧', path: '/GroundOps' },
      { label: 'Load Control', icon: '⚖️', path: '/LoadControl' },
      { label: 'Global Stations', icon: '🌍', path: '/GlobalStations' },
      { label: 'Station Dashboard', icon: '📍', path: '/StationDashboard' },
    ],
  },
  {
    id: 'efb',
    title: 'Flight Deck / EFB',
    items: [
      { label: 'EFB Dashboard', icon: '📱', path: '/EFB' },
      { label: 'Flight Planner', icon: '📈', path: '/FlightPlanner' },
      { label: 'Documents', icon: '📄', path: '/Documents' },
    ],
  },
  {
    id: 'admin',
    title: 'Admin / System',
    items: [
      { label: 'User Management', icon: '👤', path: '/UserManagement' },
      { label: 'Settings', icon: '⚙️', path: '/Settings' },
      { label: 'Screensaver Admin', icon: '🖥️', path: '/ScreensaverAdmin' },
      { label: 'Integration Hub', icon: '🔌', path: '/IntegrationHub' },
      { label: 'Comm Center', icon: '📞', path: '/CommCenter' },
      { label: 'Analytics', icon: '📊', path: '/Analytics' },
    ],
  },
];

function MobileNavGroup({ group, location, isExpanded, onToggle, onNavigate }) {
  if (!group.title) {
    return (
      <div className="px-2 pb-1">
        {group.items.map(({ label, icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 h-9 px-3 rounded-lg transition-all text-[12px] font-semibold',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <span className="text-[12px] w-4 text-center">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="px-2">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all',
          group.items.some(i => i.path === location.pathname) ? 'text-primary' : 'text-white/40 hover:text-white/70'
        )}
      >
        <span className="text-[9px] font-black uppercase tracking-[0.18em]">{group.title}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', isExpanded ? 'rotate-0' : '-rotate-90')} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-1 space-y-0.5">
              {group.items.map(({ label, icon, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={`${group.id}-${path}`}
                    to={path}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 h-8 px-3 rounded-lg transition-all text-[12px] font-medium',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-white/60 hover:text-white hover:bg-white/8'
                    )}
                  >
                    <span className="text-[11px] w-4 text-center flex-shrink-0">{icon}</span>
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MobileLeftRail({ onNavigate }) {
  const location = useLocation();

  const getDefaultExpanded = () => {
    const expanded = {};
    NAV_GROUPS.forEach(g => {
      if (g.title) {
        expanded[g.id] = g.items.some(i => i.path === location.pathname);
      }
    });
    return expanded;
  };

  const [expandedGroups, setExpandedGroups] = useState(getDefaultExpanded);

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <nav className="py-2 w-full">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-4 pb-3 border-b border-white/8 mb-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Plane className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[12px] font-black text-white tracking-wide leading-none">AERODYNE</p>
          <p className="text-[9px] text-white/40 tracking-widest uppercase mt-0.5">Fleet OS</p>
        </div>
      </div>

      {NAV_GROUPS.map((group, idx) => (
        <React.Fragment key={group.id}>
          <MobileNavGroup
            group={group}
            location={location}
            isExpanded={!group.title || expandedGroups[group.id]}
            onToggle={() => toggleGroup(group.id)}
            onNavigate={onNavigate}
          />
          {idx < NAV_GROUPS.length - 1 && group.title && (
            <div className="mx-3 my-1.5 border-t border-white/6" />
          )}
        </React.Fragment>
      ))}
      <div className="h-8" />
    </nav>
  );
}