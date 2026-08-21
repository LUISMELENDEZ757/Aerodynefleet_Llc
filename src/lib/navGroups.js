// Shared left-rail navigation definition.
// Consumed by both the LeftRail (rendering) and the Sandbox Simulation (list of dashboards to test).
// Keeping this single source of truth avoids circular imports between the two.

export const NAV_GROUPS = [
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
      { label: 'Aircraft Compliance', icon: '📋', path: '/AircraftDetail' },
      { label: 'OOS Aircraft', icon: '🚫', path: '/OOSDashboard' },
      { label: 'ETOPS Monitor', icon: '🌍', path: '/ETOPSMonitor' },
      { label: 'Capability Programs', icon: '🛡️', path: '/CapabilityDashboard' },
      { label: 'Engine Health', icon: '🔥', path: '/EngineHealthAnalytics' },
      { label: 'Avionics', icon: '📡', path: '/AvionicsDashboard' },
      { label: 'Boeing AHM', icon: '📡', path: '/BoeingAHM' },
      { label: 'Airbus Skywise', icon: '🌐', path: '/AirbusSkyw' },
      { label: 'AI Forecasting', icon: '🤖', path: '/AIForecasting' },
      { label: 'AI MX Copilot', icon: '🧠', path: '/AICopilot' },
      { label: 'AOG Forecast', icon: '⚠️', path: '/AOGForecast' },
      { label: 'Analytics', icon: '📊', path: '/Analytics' },
    ],
  },
  {
    id: 'linemx',
    title: 'Line Maintenance',
    items: [
      { label: 'Technician Mode', icon: '🧰', path: '/TechnicianMode' },
      { label: 'Inspector Mode', icon: '🔍', path: '/InspectorMode' },
      { label: 'Crew Chief', icon: '👨‍✈️', path: '/CrewChief' },
      { label: 'Mx Supervisor', icon: '📋', path: '/MxSupervisor' },
      { label: 'Line Maintenance', icon: '🔧', path: '/LineMaintenanceDashboard' },
      { label: 'TechOps Dashboard', icon: '🛠️', path: '/TechOps' },
      { label: 'Tech Support', icon: '🚨', path: '/TechSupport' },
      { label: 'E-Logbook', icon: '📖', path: '/TechOpsLogbook' },
      { label: 'Aircraft Status', icon: '📚', path: '/MaintenanceLogbook' },
      { label: 'Mx Tracking', icon: '📡', path: '/MxTracking' },
      { label: 'Manpower & Staffing', icon: '👷', path: '/ManpowerStaffing' },
      { label: 'Work Assignments', icon: '📝', path: '/WorkAssignments' },
      { label: 'Shift Turnover', icon: '🤝', path: '/ShiftHandover' },
      { label: 'Discrepancy Lab', icon: '🔬', path: '/DiscrepancyLab' },
      { label: 'Engine Removal/Install', icon: '🧩', path: '/EngineRemovalInstallation' },
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
      { label: 'Manuals Navigator', icon: '📘', path: '/Documents' },
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
      { label: 'World Route Map', icon: '🌐', path: '/WorldRouteMap' },
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
      { label: 'Ground Ops Gantt', icon: '📅', path: '/GroundOpsGantt' },
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
      { label: 'Sandbox Dashboard', icon: '🧪', path: '/Sandbox' },
      { label: 'User Management', icon: '👤', path: '/UserManagement' },
      { label: 'Crew Directory', icon: '📇', path: '/CrewDirectory' },
      { label: 'Training Records', icon: '📚', path: '/Training' },
      { label: 'Settings', icon: '⚙️', path: '/Settings' },
      { label: 'Academy', icon: '🎓', path: '/Academy' },
      { label: 'Screensaver Admin', icon: '🖥️', path: '/ScreensaverAdmin' },
      { label: 'Integration Hub', icon: '🔌', path: '/IntegrationHub' },
      { label: 'Telemetry Hub', icon: '📶', path: '/TelemetryHub' },
      { label: 'Comm Center', icon: '📞', path: '/CommCenter' },
    ],
  },
];

// Flat, ordered list of every dashboard (route) the simulation can exercise.
export const flatNavPaths = () =>
  NAV_GROUPS.flatMap((g) =>
    g.items.map((i) => ({ ...i, group: g.title || 'Core' }))
  );