import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';

const TODAY = new Date().toISOString().split('T')[0];

/**
 * Master data hook for OpsCenter recovery tooling.
 * Provides flights, crew, OOS, and safety data with shared polling.
 */
export function useRecoveryTools() {
  const pollingInterval = useDynamicPolling(30000, 300000);

  const { data: flights = [], isLoading: flightsLoading, refetch: refetchFlights } = useQuery({
    queryKey: ['opscenter-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: crew = [], isLoading: crewLoading, refetch: refetchCrew } = useQuery({
    queryKey: ['opscenter-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: oos = [], isLoading: oosLoading, refetch: refetchOOS } = useQuery({
    queryKey: ['opscenter-oos'],
    queryFn: () => base44.entities.OOSEntry.list(),
    refetchInterval: pollingInterval,
  });

  const { data: safety = [], refetch: refetchSafety } = useQuery({
    queryKey: ['opscenter-safety'],
    queryFn: () => base44.entities.SafetyReport.filter({ status: 'open' }),
    refetchInterval: pollingInterval,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['opscenter-aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
    refetchInterval: pollingInterval,
  });

  const refetchAll = () => { refetchFlights(); refetchCrew(); refetchOOS(); refetchSafety(); };

  // Derived metrics
  const airborne  = flights.filter(f => f.status === 'airborne').length;
  const delayed   = flights.filter(f => f.status === 'delayed' || f.delay_minutes > 0).length;
  const cancelled = flights.filter(f => f.status === 'cancelled').length;
  const illegal   = crew.filter(c => c.legal_status === 'illegal').length;
  const nearLimit = crew.filter(c => c.legal_status === 'near_limit').length;
  const activeOOS = oos.filter(o => o.status === 'in_work' || o.status === 'waiting_on_parts').length;

  return {
    flights, crew, oos, safety, aircraft,
    isLoading: flightsLoading || crewLoading || oosLoading,
    refetchAll,
    metrics: { airborne, delayed, cancelled, illegal, nearLimit, activeOOS, openSafety: safety.length, totalFlights: flights.length },
  };
}