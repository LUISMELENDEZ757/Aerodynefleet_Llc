import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to fetch and apply aircraft-type-specific dispatch policies
 * Returns policy rules adapted to the aircraft type
 */
export default function useDispatchPolicy(aircraftType) {
  const { data: policy, isLoading } = useQuery({
    queryKey: ['dispatch-policy', aircraftType],
    queryFn: () => base44.entities.DispatchPolicy.filter({ aircraft_type: aircraftType }),
    enabled: !!aircraftType,
    select: (data) => data[0] || null,
  });

  return { policy, isLoading };
}