import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to subscribe to real-time entity updates and invalidate affected queries
 */
export function useRealtimeSync(entityName, queryKey) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = base44.entities[entityName].subscribe((event) => {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey });

      // For specific queries, invalidate related queries
      if (entityName === 'Flight') {
        queryClient.invalidateQueries({ queryKey: ['flights'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } else if (entityName === 'CrewAssignment') {
        queryClient.invalidateQueries({ queryKey: ['crew'] });
        queryClient.invalidateQueries({ queryKey: ['crew-legality'] });
      } else if (entityName === 'OpsAlert') {
        queryClient.invalidateQueries({ queryKey: ['ops-alerts'] });
      } else if (entityName === 'MELItem') {
        queryClient.invalidateQueries({ queryKey: ['mel'] });
      } else if (entityName === 'FuelRecord') {
        queryClient.invalidateQueries({ queryKey: ['fuel'] });
      }
    });

    return unsubscribe;
  }, [entityName, queryKey, queryClient]);
}