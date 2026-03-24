/**
 * useTieredPreload
 * Fires lazy import preloads in priority order:
 *   Tier 1 (critical)    → immediate
 *   Tier 2 (operational) → after 800ms
 *   Tier 3 (enterprise)  → after 2000ms
 */
import { useEffect } from 'react';

const TIER_1 = [
  () => import('@/pages/EFB'),
  () => import('@/pages/CrewControl'),
  () => import('@/pages/WeatherDashboard'),
  () => import('@/pages/Dashboard'),
];

const TIER_2 = [
  () => import('@/pages/FlightCrewDashboard'),
  () => import('@/pages/FlightAttendantDashboard'),
  () => import('@/pages/LearningCenter'),
  () => import('@/pages/Scheduling'),
  () => import('@/pages/IROPS'),
  () => import('@/pages/FuelManagement'),
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
  () => import('@/pages/MELDashboard'),
  () => import('@/pages/DocumentLibraryPage'),
  () => import('@/pages/TrainingRecords'),
  () => import('@/pages/FuelContracts'),
  () => import('@/pages/PaxReaccommodationPage'),
];

export default function useTieredPreload() {
  useEffect(() => {
    // Tier 1 — immediate, critical modules
    TIER_1.forEach(fn => fn());

    // Tier 2 — operational, after short delay
    const t2 = setTimeout(() => TIER_2.forEach(fn => fn()), 800);

    // Tier 3 — enterprise, after user has had time to interact
    const t3 = setTimeout(() => TIER_3.forEach(fn => fn()), 2000);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
}