import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to fetch aircraft-specific cabin configuration and checklists
 * Returns cabin layout, doors, emergency equipment, and crew checklists
 */
export default function useCabinConfig(aircraftType, checklistType = null) {
  // Fetch cabin configuration
  const { data: cabinConfig, isLoading: cabinLoading } = useQuery({
    queryKey: ['cabin-config', aircraftType],
    queryFn: () => base44.entities.CabinConfiguration.filter({ aircraft_type: aircraftType }),
    enabled: !!aircraftType,
    select: (data) => data[0] || null,
  });

  // Fetch crew checklists
  const { data: checklists, isLoading: checklistLoading } = useQuery({
    queryKey: ['crew-checklists', aircraftType, checklistType],
    queryFn: () => {
      const query = { aircraft_type: aircraftType };
      if (checklistType) query.checklist_type = checklistType;
      return base44.entities.CrewChecklist.filter(query);
    },
    enabled: !!aircraftType,
  });

  return { cabinConfig, checklists, isLoading: cabinLoading || checklistLoading };
}