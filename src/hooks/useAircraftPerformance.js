import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useAircraftPerformance(tail_number, aircraft_type) {
  // Fetch aircraft to get aircraft_type if only tail provided
  const { data: aircraft } = useQuery({
    queryKey: ['aircraft-perf', tail_number],
    queryFn: () => base44.entities.Aircraft.filter({ tail_number }),
    enabled: !!tail_number,
    select: (data) => data[0] || null,
  });

  const acType = aircraft?.aircraft_type || aircraft_type;

  // Fetch performance profile for aircraft type
  const { data: profile, isLoading } = useQuery({
    queryKey: ['performance-profile', acType],
    queryFn: () => base44.entities.PerformanceProfile.filter({ aircraft_type: acType }),
    enabled: !!acType,
    select: (data) => data[0] || null,
  });

  return { profile, aircraft, acType, isLoading };
}