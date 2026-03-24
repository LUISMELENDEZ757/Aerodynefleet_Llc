import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import AppLayout from '@/components/layout/AppLayout';
import { ROUTE_DEPTH } from '@/lib/NavigationStack';

const Home                  = lazy(() => import('@/pages/Home'));
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
const Scheduling            = lazy(() => import('@/pages/Scheduling'));
const WeatherDashboard      = lazy(() => import('@/pages/WeatherDashboard'));
const LearningCenter        = lazy(() => import('@/pages/LearningCenter'));
const Logbook               = lazy(() => import('@/pages/Logbook/index'));
const OpsCenter             = lazy(() => import('@/pages/OpsCenter/index'));
const IROPS                 = lazy(() => import('@/pages/IROPS'));
const FuelManagement        = lazy(() => import('@/pages/FuelManagement'));
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

function PageFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
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
        <Route path="/Scheduling" element={<Scheduling />} />
        <Route path="/Weather" element={<WeatherDashboard />} />
        <Route path="/Learning" element={<LearningCenter />} />
        <Route path="/Logbook" element={<Logbook />} />
        <Route path="/OpsCenter" element={<OpsCenter />} />
        <Route path="/IROPS" element={<IROPS />} />
        <Route path="/Fuel" element={<FuelManagement />} />
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
        <Route path="/Settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App