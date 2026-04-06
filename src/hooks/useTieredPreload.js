/**
 * useTieredPreload
 * Fires lazy import preloads in priority order:
 *   Tier 1 (critical)    → immediate
 *   Tier 2 (operational) → after 800ms
 *   Tier 3 (enterprise)  → after 2000ms
 */
import { useEffect } from 'react';

const TIER_1 = [
  () => import('@/pages/Dashboard'),
  () => import('@/pages/EFB'),
  () => import('@/pages/CrewControl'),
  () => import('@/pages/AocsDashboard'),
  () => import('@/pages/WeatherDashboard'),
];

const TIER_2 = [
  () => import('@/pages/FlightCrewDashboard'),
  () => import('@/pages/FlightAttendantDashboard'),
  () => import('@/pages/MaintenanceControl'),
  () => import('@/pages/FleetDashboard'),
  () => import('@/pages/DispatchWorkstation'),
  () => import('@/pages/IROPS'),
  () => import('@/pages/FuelManagement'),
  () => import('@/pages/MELDashboard'),
];

const TIER_3 = [
  () => import('@/pages/Logbook/index'),
  () => import('@/pages/OpsCenter/index'),
  () => import('@/pages/Analytics'),
  () => import('@/pages/AuditLog'),
  () => import('@/pages/LoadControl'),
  () => import('@/pages/FlightPlanner'),
  () => import('@/pages/DelayCostTracker'),
  () => import('@/pages/CrewBidding'),
  () => import('@/pages/DocumentLibraryPage'),
  () => import('@/pages/TrainingRecords'),
  () => import('@/pages/FuelContracts'),
  () => import('@/pages/PaxReaccommodationPage'),
  () => import('@/pages/LearningCenter'),
  () => import('@/pages/Scheduling'),
];

export default function useTieredPreload() {
  useEffect(() => {
    const load = (fn) => { try { fn().catch(() => {}); } catch (_) {} };

    // Tier 1 — immediate, critical dashboards
    TIER_1.forEach(load);

    // Tier 2 — operational dashboards, faster load
    const t2 = setTimeout(() => TIER_2.forEach(load), 400);

    // Tier 3 — secondary modules, after interaction
    const t3 = setTimeout(() => TIER_3.forEach(load), 1500);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
}