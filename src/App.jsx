import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { FleetProvider } from '@/lib/FleetContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import AppLayout from '@/components/layout/AppLayout';
import { ROUTE_DEPTH } from '@/lib/NavigationStack';
import useOfflineSync from '@/hooks/useOfflineSync';
import { offlineStore } from '@/lib/offline-store';
import OfflineBadge from '@/components/layout/OfflineBadge';

const Home                  = lazy(() => import('@/pages/Home'));
const OpsHub                = lazy(() => import('@/pages/OpsHub'));
const Dashboard             = lazy(() => import('@/pages/Dashboard'));
const OOSDetail             = lazy(() => import('@/pages/OOSDetail'));
const NewOOS                = lazy(() => import('@/pages/NewOOS'));
const FlightAttendantDashboard = lazy(() => import('@/pages/FlightAttendantDashboard'));
const FlightCrewDashboard   = lazy(() => import('@/pages/FlightCrewDashboard'));
const EFB                   = lazy(() => import('@/pages/EFB'));
const CrewCalendar          = lazy(() => import('@/pages/CrewCalendar'));
const CrewControl           = lazy(() => import('@/pages/CrewControl'));
const WorldClock            = lazy(() => import('@/pages/WorldClock'));
const SafetyQA              = lazy(() => import('@/pages/SafetyQA'));
const QAQCDashboard         = lazy(() => import('@/pages/QAQCDashboard'));
const Scheduling            = lazy(() => import('@/pages/Scheduling'));
const WeatherDashboard      = lazy(() => import('@/pages/WeatherDashboard'));
const LearningCenter        = lazy(() => import('@/pages/LearningCenter'));
const Logbook               = lazy(() => import('@/pages/Logbook/index'));
const OpsCenter             = lazy(() => import('@/pages/OpsCenter/index'));
const IROPS                 = lazy(() => import('@/pages/IROPS'));

const AuditLogPage          = lazy(() => import('@/pages/AuditLog'));
const Analytics             = lazy(() => import('@/pages/Analytics'));

const SettingsPage          = lazy(() => import('@/pages/Settings'));
const LoadControl           = lazy(() => import('@/pages/LoadControl'));
const FlightPlanner         = lazy(() => import('@/pages/FlightPlanner'));
const DelayCostTracker      = lazy(() => import('@/pages/DelayCostTracker'));
const CrewBidding           = lazy(() => import('@/pages/CrewBidding'));
const MELDashboard          = lazy(() => import('@/pages/MELDashboard'));
const DocumentLibraryPage   = lazy(() => import('@/pages/DocumentLibraryPage'));
const TrainingRecords       = lazy(() => import('@/pages/TrainingRecords'));
const FuelContracts         = lazy(() => import('@/pages/FuelContracts'));
const PaxReaccommodationPage = lazy(() => import('@/pages/PaxReaccommodationPage'));
const StarlinkDashboard     = lazy(() => import('@/pages/StarlinkDashboard'));
const CommCenter            = lazy(() => import('@/pages/CommCenter'));
const SupervisorDashboard   = lazy(() => import('@/pages/SupervisorDashboard'));
const DispatchWorkstation   = lazy(() => import('@/pages/DispatchWorkstation'));
const RecordRetentionPolicy = lazy(() => import('@/pages/RecordRetentionPolicy'));
const GroundOpsPage         = lazy(() => import('@/pages/GroundOps'));
const NOTAMsPage            = lazy(() => import('@/pages/NOTAMsPage'));
const CrewDirectory         = lazy(() => import('@/pages/CrewDirectory'));
const FlightBoard           = lazy(() => import('@/pages/FlightBoard'));
const OOSDashboard          = lazy(() => import('@/pages/OOSAircraftDashboard'));
const TechnicianMode        = lazy(() => import('@/pages/OOSDashboard'));
const UserManagement        = lazy(() => import('@/pages/UserManagement'));
const CostReporting         = lazy(() => import('@/pages/CostReporting'));
const FleetDashboard        = lazy(() => import('@/pages/FleetDashboard'));
const TechOpsLogbook        = lazy(() => import('@/pages/TechOpsLogbook'));
const CabinDiscrepancy      = lazy(() => import('@/pages/CabinDiscrepancy'));
const ToolingManagement       = lazy(() => import('@/pages/ToolingManagement'));
const EngineeringDashboard    = lazy(() => import('@/pages/EngineeringDashboard'));
const MaintenanceControl      = lazy(() => import('@/pages/MaintenanceControl'));
const AocsDashboard           = lazy(() => import('@/pages/AocsDashboard'));
const FleetRegistry           = lazy(() => import('@/pages/FleetRegistry'));
const TechOpsDashboard        = lazy(() => import('@/components/techops/TechOpsDashboard'));
const TravelWeather           = lazy(() => import('@/pages/TravelWeather'));
const ETOPSMonitor            = lazy(() => import('@/pages/ETOPSMonitor'));
const TelemetryHub            = lazy(() => import('@/pages/TelemetryHub'));
const EngineHealthAnalytics   = lazy(() => import('@/pages/EngineHealthAnalytics'));
const LineMaintenanceDashboard = lazy(() => import('@/pages/LineMaintenanceDashboard'));
const ReleaseArchiveDashboard = lazy(() => import('@/pages/ReleaseArchiveDashboard'));
const HeavyMxMRO               = lazy(() => import('@/pages/HeavyMxMRO'));
const RecordRetentionDashboard  = lazy(() => import('@/pages/RecordRetentionDashboard'));
const ShiftHandoverPage         = lazy(() => import('@/pages/ShiftHandoverPage'));
const ChronicMELDashboard       = lazy(() => import('@/pages/ChronicMELDashboard'));
const EngineeringCalendar       = lazy(() => import('@/pages/EngineeringCalendar'));
const WorkAssignmentDashboard   = lazy(() => import('@/pages/WorkAssignmentDashboard'));
const EngineRemovalInstallation = lazy(() => import('@/pages/EngineRemovalInstallation'));
const PassengerServiceSystem   = lazy(() => import('@/pages/PassengerServiceSystem'));
const PartsSupplyDashboard     = lazy(() => import('@/pages/PartsSupplyDashboard'));
const LiveFlightTracker        = lazy(() => import('@/pages/LiveFlightTracker'));
const AerodyneFleetOps         = lazy(() => import('@/pages/AerodyneFleetOps'));
const CrewPairingScheduler     = lazy(() => import('@/pages/CrewPairingScheduler'));
const FAR117Calculator         = lazy(() => import('@/pages/FAR117Calculator'));
const OTPDashboard             = lazy(() => import('@/pages/OTPDashboard'));
const DiversionWorkflow        = lazy(() => import('@/pages/DiversionWorkflow'));
const AIDispatchCopilot        = lazy(() => import('@/pages/AIDispatchCopilot'));
const LiveSIGMETMap            = lazy(() => import('@/pages/LiveSIGMETMap.jsx'));
const AOGProbabilityForecast   = lazy(() => import('@/pages/AOGProbabilityForecast'));
const ProductionControlCenter  = lazy(() => import('@/pages/ProductionControlCenter'));
const CostPerFlightAnalytics   = lazy(() => import('@/pages/CostPerFlightAnalytics'));
const PredictivePartsOrdering  = lazy(() => import('@/pages/PredictivePartsOrdering'));
const LineMxTablet             = lazy(() => import('@/pages/LineMxTablet'));
const BORROBDashboard          = lazy(() => import('@/pages/BORROBDashboard'));
const ADTracking               = lazy(() => import('@/pages/ADTracking'));
const ComponentTraceability    = lazy(() => import('@/pages/ComponentTraceability'));
const CertificateOfRelease     = lazy(() => import('@/pages/CertificateOfRelease'));
const SignatureAuditDashboard  = lazy(() => import('@/pages/SignatureAuditDashboard'));
const CrewChiefDashboard       = lazy(() => import('@/pages/CrewChiefDashboard'));
const MxSupervisorDashboard    = lazy(() => import('@/pages/MaintenanceSupervisorDashboard'));
const QCSupervisorDashboard    = lazy(() => import('@/pages/QCSupervisorDashboard'));
const GlobalStationMgmt        = lazy(() => import('@/pages/GlobalStationManagement'));
const StationDashboard         = lazy(() => import('@/pages/StationDashboard'));
const AircraftMaintenanceTracking = lazy(() => import('@/pages/AircraftMaintenanceTracking'));
const IntegrationHub           = lazy(() => import('@/pages/IntegrationHub'));

function PageFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }
  static getDerivedStateFromError(error) {
    if (error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Importing a module script failed')) {
      return { hasError: true };
    }
    return null;
  }
  componentDidCatch(error) {
    console.error('Chunk load error:', error);
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">Page failed to load</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  useOfflineSync(); // Enable offline sync

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<AppLayout />}>
        <Route path="/OpsHub" element={<OpsHub />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/OOSDetail" element={<OOSDetail />} />
        <Route path="/NewOOS" element={<NewOOS />} />
        <Route path="/FlightAttendant" element={<FlightAttendantDashboard />} />
        <Route path="/FlightCrew" element={<FlightCrewDashboard />} />
        <Route path="/EFB" element={<EFB />} />
        <Route path="/CrewCalendar" element={<CrewCalendar />} />
        <Route path="/CrewControl" element={<CrewControl />} />
        <Route path="/WorldClock" element={<WorldClock />} />
        <Route path="/SafetyQA" element={<SafetyQA />} />
        <Route path="/QAQC" element={<QAQCDashboard />} />
        <Route path="/Scheduling" element={<Scheduling />} />
        <Route path="/Weather" element={<WeatherDashboard />} />
        <Route path="/Learning" element={<LearningCenter />} />
        <Route path="/Logbook" element={<Logbook />} />
        <Route path="/OpsCenter" element={<OpsCenter />} />
        <Route path="/IROPS" element={<IROPS />} />

        <Route path="/AuditLog" element={<AuditLogPage />} />
        <Route path="/Analytics" element={<Analytics />} />

        <Route path="/LoadControl" element={<LoadControl />} />
        <Route path="/FlightPlanner" element={<FlightPlanner />} />
        <Route path="/DelayCost" element={<DelayCostTracker />} />
        <Route path="/CrewBidding" element={<CrewBidding />} />
        <Route path="/MEL" element={<MELDashboard />} />
        <Route path="/Documents" element={<DocumentLibraryPage />} />
        <Route path="/Training" element={<TrainingRecords />} />
        <Route path="/FuelContracts" element={<FuelContracts />} />
        <Route path="/PaxReaccom" element={<PaxReaccommodationPage />} />
        <Route path="/Starlink" element={<StarlinkDashboard />} />
        <Route path="/CommCenter" element={<CommCenter />} />
        <Route path="/Supervisor" element={<SupervisorDashboard />} />
        <Route path="/Dispatch" element={<DispatchWorkstation />} />
        <Route path="/RetentionPolicy" element={<RecordRetentionPolicy />} />
        <Route path="/GroundOps" element={<GroundOpsPage />} />
        <Route path="/NOTAMs" element={<NOTAMsPage />} />
        <Route path="/CrewDirectory" element={<CrewDirectory />} />
        <Route path="/FlightBoard" element={<FlightBoard />} />
        <Route path="/OOSDashboard" element={<OOSDashboard />} />
        <Route path="/TechnicianMode" element={<TechnicianMode />} />
        <Route path="/UserManagement" element={<UserManagement />} />
        <Route path="/CostReporting" element={<CostReporting />} />
        <Route path="/FleetDashboard" element={<FleetDashboard />} />
        <Route path="/TechOpsLogbook" element={<TechOpsLogbook />} />
        <Route path="/CabinDiscrepancy" element={<CabinDiscrepancy />} />
        <Route path="/ToolingManagement" element={<ToolingManagement />} />
        <Route path="/EngineeringDashboard" element={<EngineeringDashboard />} />
        <Route path="/MaintenanceControl" element={<MaintenanceControl />} />
        <Route path="/AocsDashboard" element={<AocsDashboard />} />
        <Route path="/FleetRegistry" element={<FleetRegistry />} />
        <Route path="/TechOps" element={<TechOpsDashboard />} />
        <Route path="/Settings" element={<SettingsPage />} />
        <Route path="/TravelWeather" element={<TravelWeather />} />
        <Route path="/ETOPSMonitor" element={<ETOPSMonitor />} />
        <Route path="/TelemetryHub" element={<TelemetryHub />} />
        <Route path="/EngineHealthAnalytics" element={<EngineHealthAnalytics />} />
        <Route path="/LineMaintenanceDashboard" element={<LineMaintenanceDashboard />} />
        <Route path="/HeavyMxMRO" element={<HeavyMxMRO />} />
        <Route path="/EngineRemovalInstallation" element={<EngineRemovalInstallation />} />
        <Route path="/PSS" element={<PassengerServiceSystem />} />
        <Route path="/PartsSupply" element={<PartsSupplyDashboard />} />
        <Route path="/LiveFlightTracker" element={<LiveFlightTracker />} />
        <Route path="/AerodyneFleetOps" element={<AerodyneFleetOps />} />
        <Route path="/CrewPairing" element={<CrewPairingScheduler />} />
        <Route path="/FAR117" element={<FAR117Calculator />} />
        <Route path="/OTPDashboard" element={<OTPDashboard />} />
        <Route path="/DiversionWorkflow" element={<DiversionWorkflow />} />
        <Route path="/AIDispatchCopilot" element={<AIDispatchCopilot />} />
        <Route path="/SIGMETMap" element={<LiveSIGMETMap />} />
        <Route path="/AOGForecast" element={<AOGProbabilityForecast />} />
        <Route path="/CostAnalytics" element={<CostPerFlightAnalytics />} />
        <Route path="/PredictiveParts" element={<PredictivePartsOrdering />} />
        <Route path="/LineMxTablet" element={<LineMxTablet />} />
        <Route path="/ReleaseArchive" element={<ReleaseArchiveDashboard />} />
        <Route path="/BORROB" element={<BORROBDashboard />} />
        <Route path="/ProductionControl" element={<ProductionControlCenter />} />
        <Route path="/RecordsRetention" element={<RecordRetentionDashboard />} />
        <Route path="/ShiftHandover" element={<ShiftHandoverPage />} />
        <Route path="/ChronicMEL" element={<ChronicMELDashboard />} />
        <Route path="/EngCalendar" element={<EngineeringCalendar />} />
        <Route path="/WorkAssignments" element={<WorkAssignmentDashboard />} />
        <Route path="/ADTracking" element={<ADTracking />} />
        <Route path="/ComponentTraceability" element={<ComponentTraceability />} />
        <Route path="/CRS" element={<CertificateOfRelease />} />
        <Route path="/SignatureAudit" element={<SignatureAuditDashboard />} />
        <Route path="/CrewChief" element={<CrewChiefDashboard />} />
        <Route path="/MxSupervisor" element={<MxSupervisorDashboard />} />
        <Route path="/QCSupervisor" element={<QCSupervisorDashboard />} />
        <Route path="/GlobalStations" element={<GlobalStationMgmt />} />
        <Route path="/StationDashboard" element={<StationDashboard />} />
        <Route path="/MxTracking" element={<AircraftMaintenanceTracking />} />
        <Route path="/IntegrationHub" element={<IntegrationHub />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </ChunkErrorBoundary>
  );
};


function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <FleetProvider>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <Router>
          <AuthenticatedApp />
        </Router>
        <OfflineBadge />
        <Toaster />
        </FleetProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App